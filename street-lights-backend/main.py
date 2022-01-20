from time import time
from dis import dis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse
from math import radians, cos, sin, asin, sqrt, acos, atan2, pow, degrees, dist, pi
from decimal import Decimal
import numpy as np

def haversine(lat1, lon1, lat2, lon2):
    R = 6372.8 # this is in km.  For Earth radius in kilometers 
    lon1 = np.radians(lon1)
    lon2 = np.radians(lon2)
    lat1 = np.radians(lat1)
    lat2 = np.radians(lat2)
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = np.power(np.sin(dlat / 2), 2) + np.cos(lat1) * np.cos(lat2)* np.power(np.sin(dlon / 2),2)
    c = 2 * np.arcsin(np.sqrt(a))

    return c*R*1000
      


def bear(latA, lonA, latB, lonB):
        # BEAR Finds the bearing from one lat / lon point to another.
        return np.arctan2(
            np.sin(lonB - lonA) * np.cos(latB),
            np.cos(latA) * np.sin(latB) - np.sin(latA) * np.cos(latB) * np.cos(lonB - lonA)
        )


def pointToLineDistance(p1, p2, p3):
    lat1 = p1[0]
    lon1 = p1[1]
    lat2 = p2[0]
    lon2 = p2[1]
    lat3 = p3[:, 0]
    lon3 = p3[:, 1]


    lat1 = np.radians(lat1)
    lat2 = np.radians(lat2)
    lat3 = np.radians(lat3)
    lon1 = np.radians(lon1)
    lon2 = np.radians(lon2)
    lon3 = np.radians(lon3)
    R = 6378137

    bear12 = bear(lat1, lon1, lat2, lon2)
    bear13 = bear(lat1, lon1, lat3, lon3)
    dis13 = haversine( lat1, lon1, lat3, lon3)

    first = np.abs(bear13 - bear12) > (pi / 2)

    # Find the cross-track distance.
    dxt = np.arcsin(np.sin(dis13 / R) * np.sin(bear13 - bear12)) * R

    # Is p4 beyond the arc?
    dis12 = haversine(lat1, lon1, lat2, lon2)
    dis14 = np.arccos(np.cos(dis13 / R) /np.cos(dxt / R)) * R

    distance = np.where(first, dis13, np.where(dis14 > dis12, haversine(lat2, lon2, lat3, lon3), np.abs(dxt)))
    return distance

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
light_coordinates = np.array([[streetlight['lat'], streetlight['lng']] for streetlight in all_lights])

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
    data = requests.get(DIRECTIONS_API + '?&origin=' + source + '&destination=' + destination + '&key=' + GOOGLE_MAPS_API_KEY).json()
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

        #  checking for equality..
        if p1 == p2:
            continue 

        start = time()

        # distances = list(map(lambda x : pointToLineDistance(p1, p2, x), light_coordinates))
        distances = pointToLineDistance(p1, p2, light_coordinates)

        for j in range(len(all_lights)):
            if distances[j] < 0.5:
                # print("shortest_distance: ", distances[j])
                close_lights.add((all_lights[j]['lat'], all_lights[j]['lng']))

        end = time()
        # print(end - start)
    close_lights = [{'lat': x[0], 'lng': x[1]} for x in close_lights]
    output = {'route': roads, 'route_lights': close_lights}
    return output


@app.get("/icon")
def get_icon():
    return FileResponse("light.png")

