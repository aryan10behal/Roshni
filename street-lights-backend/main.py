from cgi import print_environ
from fileinput import close
from turtle import distance
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
            -1*np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
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
            -1*np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        )
    return distance

def find_perpendiculars(lights_considered, path):
    print(path)
    perpendiculars = []
    for a, b, p1, p2 in lights_considered:
        p3 = (a, b)
        if p2[0] == p1[0]:
            x = p1[0]
            y = p3[1]
        else:
            A1 = (p2[1] - p1[1])/(p2[0] - p1[0])
            B1 = -1
            C1 = p2[1] - A1*p2[0]
            if A1 == 0:
                A2 = -1
                B2 = 0
                C2 = p3[0]
            else:
                A2 = -1/A1
                B2 = -1
                C2 = p3[1] - A2*p3[0]

            x = (B1*C2 - B2*C1)/ (A1*B2 - A2*B1)
            y = (A2*C1 - A1*C2) / (A1*B2 - A2*B1)

        perpendiculars.append({
            'lat': x,
            'lng': y,
            'p1': p1,
            'p2': p2,
            'dist': path[p1] + np.sqrt((p1[0] - x) ** 2 + (p1[1] - y) ** 2)
        })
    perpendiculars_list = sorted(perpendiculars, key = lambda i: i['dist'])
    perpendiculars = [{'lat': x['lat'], 'lng': x['lng']} for x in perpendiculars_list]
    return perpendiculars, perpendiculars_list

def find_dark_spots(perpendiculars, path):
    # while route[j]['lat'] != perpendiculars[0]['p1']['lat']:
    j = 0
    path_size = len(path)
    dark_routes = []
    dark_spot_distance = []
    dark_bounds = []
    dark_lights = set()
    for i in range(1, len(perpendiculars)):
        distance = perpendiculars[i]['dist'] - perpendiculars[i-1]['dist']
        if distance > 100:
            dark_lights.add((perpendiculars[i-1]['lat'], perpendiculars[i-1]['lng']))
            dark_lights.add((perpendiculars[i]['lat'], perpendiculars[i]['lng']))
            dark_spot_distance.append(distance)
            dark_route = []
            print("longer distance...", distance)
            print(i-1)
            print(perpendiculars[i-1]['dist'], perpendiculars[i]['dist'] )
            print(path[j][1])
            print("--> ", j)
            while j < path_size and path[j][1] < perpendiculars[i-1]['dist']:
                j+=1
            dark_route.append({
                'lat': perpendiculars[i-1]['lat'],
                'lng': perpendiculars[i-1]['lng']
            })
            print("-", j)
            print(path[j][1])
            while j< path_size and path[j][1] <= perpendiculars[i]['dist']:
                dark_route.append({
                'lat': path[j][0][0],
                'lng': path[j][0][1]})
                j+=1
            dark_route.append({
                'lat': perpendiculars[i]['lat'],
                'lng': perpendiculars[i]['lng']
            })
            print("<-- ", j)
            j-=1
            dark_routes.append(dark_route)
    print(j, path_size)
    return  dark_routes, dark_bounds, dark_lights, dark_spot_distance





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
    print(len(all_lights))
    return all_lights

@app.get("/route")
def get_route(req: Request):
    lights_considered = []
    request_args = dict(req.query_params)
    source = request_args['source']
    destination = request_args['destination']


    directions_api_response = maps.directions(source, destination)

    route = []
    path = dict()
    
    for direction in directions_api_response[0]['legs'][0]['steps']:
        polyline = googlemaps.convert.decode_polyline(direction['polyline']['points'])
        route += polyline

    total_distance = 0
    path[(route[0]['lat'], route[0]['lng'])] = total_distance 
    for i in range(1, len(route)):
        prev_point = route[i-1] 
        coordinate = route[i]
        total_distance += np.sqrt((coordinate['lat'] - prev_point['lat']) ** 2 + (coordinate['lat'] - prev_point['lng']) ** 2)
        path[(coordinate['lat'], coordinate['lng'])] = total_distance 
            
    close_lights = []


    for i in range(1, len(route)):
        p1 = (route[i-1]['lat'], route[i-1]['lng'])
        p2 = (route[i]['lat'], route[i]['lng'])
        if p1 == p2:
            continue
        distances = pointToLineDistance(p1, p2, light_coordinates)
        for j in range(len(all_lights)):
            current_light = [all_lights[j]['lat'], all_lights[j]['lng']] 
            if abs(distances[j]) < 0.0002 and current_light not in close_lights:
                close_lights.append(current_light)
                light_between_points = [current_light[0], current_light[1], p1, p2]
                if distances[j] > 0 and light_between_points not in lights_considered: 
                    lights_considered.append(light_between_points)
    
            

    perpendiculars, perpendiculars_list = find_perpendiculars(lights_considered, path)
    path = sorted(path.items(), key=lambda kv: kv[1])
    dark_routes, dark_route_bounds, dark_lights, dark_spot_distances = find_dark_spots(perpendiculars_list, path)


    close_lights = [{'lat': x[0], 'lng': x[1]} for x in close_lights]
    dark_lights = [{'lat': x[0], 'lng': x[1]} for x in dark_lights]
  
    dark_route_bounds = []
    for i in range(len(dark_routes)):
        dark_route_bounds.append(directions_api_response[0]['bounds'])
    output = {'route': route, 'route_lights': close_lights, 'bounds': directions_api_response[0]['bounds'], 'dark_routes': dark_routes, 'dark_route_bounds': dark_route_bounds, 'perpendiculars': dark_lights, 'dark_spot_distances':  dark_spot_distances}

    return output


@app.get("/icon")
def get_icon():
    return FileResponse("lamp-glow.png")
