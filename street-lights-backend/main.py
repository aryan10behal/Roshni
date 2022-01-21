from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse
import numpy as np
import googlemaps

def pointToLineDistance(p1, p2, p3):
    '''
    Ax + By + C = 0
    x3, y3
    perpendicular lines passing through p1 and p2:
    n1: Ax - By + C1 = 0
    n2: Ax - By + C2 = 0
    if p3 lies on opposite sides of both n1 and n2 
    '''
    distance_from_p1 = np.sqrt((p3[:, 0] - p1[0]) ** 2 + (p3[:, 1] - p1[1]) ** 2)
    distance_from_p2 = np.sqrt((p3[:, 0] - p2[0]) ** 2 + (p3[:, 1] - p2[1]) ** 2)
    if p2[0] == p1[0]:
        A = 1
        B = 0
        C = p1[0]
        distance = np.where(
            (p3[:, 1] - p1[1] >= 0) ^ (p3[:, 1] - p1[1] >= 0), 
            np.abs(p3[:, 0] - p1[0]), 
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        )
    else:
        A = (p2[1] - p1[1])/(p2[0] - p1[0])
        B = -1
        C = - (A * p1[0] + B * p1[1])
        C1 = - (A * p1[0] - B * p1[1])
        C2 = - (A * p2[0] - B * p2[1])
        distance = np.where(
            (A * p3[:, 0] - B * p3[:, 1] + C1 >= 0) ^ (A * p3[:, 0] - B * p3[:, 1] + C2 >= 0), 
            np.abs(A * p3[:, 0] + B * p3[:, 1] + C)/(A**2 + B**2)**0.5,
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        )
    return distance

load_dotenv()


GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

maps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
mongodb = pymongo.MongoClient("mongodb://localhost:27017/")

db = mongodb["street-lights-db"]

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

    directions_api_response = maps.directions(source, destination)
    route = []
    for direction in directions_api_response[0]['legs'][0]['steps']:
        route += googlemaps.convert.decode_polyline(direction['polyline']['points'])

    close_lights = set()
    for i in range(1, len(route)):
        p1 = (route[i-1]['lat'], route[i-1]['lng'])
        p2 = (route[i]['lat'], route[i]['lng'])
        if p1 == p2:
            continue
        distances = pointToLineDistance(p1, p2, light_coordinates)
        for j in range(len(all_lights)):
            if distances[j] < 0.0002:
                close_lights.add((all_lights[j]['lat'], all_lights[j]['lng']))

    close_lights = [{'lat': x[0], 'lng': x[1]} for x in close_lights]
    output = {'route': route, 'route_lights': close_lights, 'bounds': directions_api_response[0]['bounds']}
    return output


@app.get("/icon")
def get_icon():
    return FileResponse("lamp-glow.png")

