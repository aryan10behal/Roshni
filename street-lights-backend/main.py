from asyncore import poll3
from dis import dis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from httplib2 import Response
import pymongo
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse
from math import radians, cos, sin, asin, sqrt, acos, atan2, pow, degrees, dist, pi
from decimal import Decimal

def haversine(lat1, lon1, lat2, lon2):
    R = 6372.8 # this is in km.  For Earth radius in kilometers 
    lon1 = radians(lon1)
    lon2 = radians(lon2)
    lat1 = radians(lat1)
    lat2 = radians(lat2)
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = pow(sin(dlat / 2), 2) + cos(lat1) * cos(lat2)* pow(sin(dlon / 2),2)
    c = 2 * asin(sqrt(a))

    return c*R*1000
      


def bear(latA, lonA, latB, lonB):
        # BEAR Finds the bearing from one lat / lon point to another.
        return atan2(
            sin(lonB - lonA) * cos(latB),
            cos(latA) * sin(latB) - sin(latA) * cos(latB) * cos(lonB - lonA)
        )


def pointToLineDistance(p1, p2, p3):
    lat1 = p1[0]
    lon1 = p1[1]
    lat2 = p2[0]
    lon2 = p2[1]
    lat3 = p3[0]
    lon3 = p3[1]


    lat1 = radians(lat1)
    lat2 = radians(lat2)
    lat3 = radians(lat3)
    lon1 = radians(lon1)
    lon2 = radians(lon2)
    lon3 = radians(lon3)
    R = 6378137

    bear12 = bear(lat1, lon1, lat2, lon2)
    bear13 = bear(lat1, lon1, lat3, lon3)
    dis13 = haversine( lat1, lon1, lat3, lon3)

    # Is relative bearing obtuse?
    if abs(bear13 - bear12) > (pi / 2):
        return dis13

    # Find the cross-track distance.
    dxt = asin(sin(dis13 / R) * sin(bear13 - bear12)) * R

    # Is p4 beyond the arc?
    dis12 = haversine(lat1, lon1, lat2, lon2)
    dis14 = acos(cos(dis13 / R) /cos(dxt / R)) * R
    if dis14 > dis12:
        return haversine(lat2, lon2, lat3, lon3)
    return abs(dxt)

 

load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json'
ROADS_API = "https://roads.googleapis.com/v1/snapToRoads"



myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat']} for streetlight in db["streetlights"].find() if streetlight['lng'] and streetlight['lat']]

@app.get("/streetlights")
def read_item():
    return all_lights

@app.get("/route")
def get_route(req: Request):
    request_args = dict(req.query_params)
    source = request_args['source']
    destination = request_args['destination']
    print(source)
    print(destination)
    data = requests.get(DIRECTIONS_API + '?origin=' + source + '&destination=' + destination + '&key=' + GOOGLE_MAPS_API_KEY).json()
    route = [point['start_location'] for point in data['routes'][0]['legs'][0]['steps']]

    # concatenating lat and long with %2C
    path = [str(points['lat'])+"%2C"+ str(points['lng']) for points in route]


    #concatenating list of lat%2Clng to a single string..
    final_path = "%7C".join(str(val) for val in path)
    road_api_response = requests.get("https://roads.googleapis.com/v1/snapToRoads?path="+final_path+"&interpolate=true&key="+GOOGLE_MAPS_API_KEY).json()
    roads = [{'lat': point['location']['latitude'], 'lng': point['location']['longitude']} for point in road_api_response['snappedPoints']]


    # captures lights less than 2m away...
    close_lights = set()


    # distance calculator between points and lights
    for i in range(1, len(roads)):
        p1 = (roads[i-1]['lat'], roads[i-1]['lng'])
        p2 = (roads[i]['lat'], roads[i]['lng'])

        # checking for equality of points
        # dist_p1_p2 = haversine(p1[0], p1[1], p2[0], p2[1])
        # if dist_p1_p2 == 0:
        #     continue

        #  checking for equality..
        if p1[0] == p2[0] and p1[1] == p2[1]:
            continue 

        for j in range(len(all_lights)):
            p3 = (all_lights[j]['lat'], all_lights[j]['lng'])

            shortest_distance = pointToLineDistance(p1, p2, p3)

            # if distance is less than 2m, adding it to close_lights set..
            if shortest_distance < 2:
                print("shortest_distance: ", shortest_distance)
                close_lights.add(p3)

    #  final_lights - dictionary of lights under 2 m
    final_lights = [{'lat': light[0], 'lng': light[1]} for light in close_lights]
    output = {'data': data, 'final_lights': final_lights}
    return final_lights


@app.get("/icon")
def get_icon():
    return FileResponse("light.png")

