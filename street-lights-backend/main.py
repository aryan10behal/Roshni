from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse
import numpy as np

def pointToLineDistance(p1, p2, p3):
    '''
    Ax + By + C = 0
    x3, y3
    perpendicular lines passing through p1 and p2:
    n1: Ax - By + C1 = 0
    n2: Ax - By + C2 = 0
    if p3 lies on opposite sides of both n1 and n2 
    '''
    A = (p2[1] - p1[1])/(p2[0] - p1[0])
    B = -1
    C = - (A * p1[0] + B * p1[1])
    C1 = - (A * p1[0] - B * p1[1])
    C2 = - (A * p2[0] - B * p2[1])
    distance = np.where(
        (A * p3[:, 0] - B * p3[:, 1] + C1 >= 0) ^ (A * p3[:, 0] - B * p3[:, 1] + C2 >= 0), 
        np.abs(A * p3[:, 0] + B * p3[:, 1] + C)/(A**2 + B**2)**0.5,
        100
    )
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
        if p1 == p2:
            continue 
        distances = pointToLineDistance(p1, p2, light_coordinates)
        for j in range(len(all_lights)):
            if distances[j] < 0.0002:
                close_lights.add((all_lights[j]['lat'], all_lights[j]['lng']))

    close_lights = [{'lat': x[0], 'lng': x[1]} for x in close_lights]
    output = {'route': roads, 'route_lights': close_lights}
    return output


@app.get("/icon")
def get_icon():
    return FileResponse("light.png")

