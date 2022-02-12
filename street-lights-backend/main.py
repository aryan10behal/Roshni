from audioop import mul
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
from math import radians, cos, sin, asin, sqrt, acos, atan2, pow, degrees, dist, pi
from timeit import default_timer as timer




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

def pointToLineDistance(p1, p2, p3, distance_from_path):
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
        lights = p3[np.where(
            (p3[:, 1] - p1[1] >= 0) ^ (p3[:, 1] - p2[1] >= 0), 
            np.abs(p3[:, 0] - p1[0]), 
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        ) < distance_from_path]

        distance_from_p1 = np.sqrt((lights[:, 0] - p1[0]) ** 2 + (lights[:, 1] - p1[1]) ** 2)
        distance_from_p2 = np.sqrt((lights[:, 0] - p2[0]) ** 2 + (lights[:, 1] - p2[1]) ** 2)
        distance = np.where(
            (lights[:, 1] - p1[1] >= 0) ^ (lights[:, 1] - p2[1] >= 0), 
            np.abs(lights[:, 0] - p1[0]), 
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        )
    else:
        A = (p2[1] - p1[1])/(p2[0] - p1[0])
        B = -1
        C = - (A * p1[0] + B * p1[1])
        C1 = - (A * p1[0] - B * p1[1])
        C2 = - (A * p2[0] - B * p2[1])
        lights = p3[np.where(
            (A * p3[:, 0] - B * p3[:, 1] + C1 >= 0) ^ (A * p3[:, 0] - B * p3[:, 1] + C2 >= 0), 
            np.abs(A * p3[:, 0] + B * p3[:, 1] + C)/(A**2 + B**2)**0.5,
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        ) < distance_from_path]

        distance_from_p1 = np.sqrt((lights[:, 0] - p1[0]) ** 2 + (lights[:, 1] - p1[1]) ** 2)
        distance_from_p2 = np.sqrt((lights[:, 0] - p2[0]) ** 2 + (lights[:, 1] - p2[1]) ** 2)
        distance = np.where(
            (A * lights[:, 0] - B * lights[:, 1] + C1 >= 0) ^ (A * lights[:, 0] - B * lights[:, 1] + C2 >= 0), 
            np.abs(A * lights[:, 0] + B * lights[:, 1] + C)/(A**2 + B**2)**0.5,
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        )

    return lights, distance

def perpendicular_checker(p1,p2,p3):
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

    PR = haversine(p2[0], p2[1], p1[0], p1[1])
    PQ = haversine(p1[0], p1[1], x, y)
    QR = haversine(p2[0], p2[1], x, y)

    if PR > PQ + QR + 2 or PR < PQ + QR - 2:
        return False

    return True


def find_perpendiculars(lights_considered, path):
    perpendiculars = []
    gath = set()
    for a, b, p1, p2 in lights_considered:
        p3 = (a, b)
        gath.add((p1[0],p1[1]))
        gath.add((p2[0],p2[1]))
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

        PQ = haversine(p1[0], p1[1], x, y)

        perpendiculars.append({
            'lat': x,
            'lng': y,
            'p1': p1,
            'p2': p2,
            'dist': path[p1] + PQ
        })

    perpendiculars_list = sorted(perpendiculars, key = lambda i: i['dist'])
    perpendiculars = [{'lat': x['lat'], 'lng': x['lng']} for x in perpendiculars_list]
    return perpendiculars, perpendiculars_list, gath

def find_dark_spots(perpendiculars, path, dark_route_threshold):
    j = 0
    path_size = len(path)
    dark_routes = []
    dark_spot_distance = []
    dark_bounds = []
    dark_lights = []

    for i in range(1, len(perpendiculars)):
        distance = perpendiculars[i]['dist'] - perpendiculars[i-1]['dist']
        if distance > dark_route_threshold:
            point1 = {'lat': perpendiculars[i-1]['lat'], 'lng': perpendiculars[i-1]['lng']}
            point2 = {'lat': perpendiculars[i]['lat'], 'lng': perpendiculars[i]['lng']}
            if point1 not in dark_lights:
                dark_lights.append(point1)
            if point2 not in dark_lights:
                dark_lights.append(point2)
            dark_spot_distance.append(distance)
            dark_route = []
            while j < path_size and path[j][1] < perpendiculars[i-1]['dist']:
                j+=1
            dark_route.append(point1)
            while j< path_size and path[j][1] <= perpendiculars[i]['dist']:
                dark_route.append({
                'lat': path[j][0][0],
                'lng': path[j][0][1]})
                j+=1
            dark_route.append(point2)
            j-=1
            dark_routes.append(dark_route)

    return  dark_routes, dark_bounds, dark_lights, dark_spot_distance





load_dotenv()


GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

maps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
mongodb = pymongo.MongoClient("mongodb://localhost:27017/")

db = mongodb["street-lights-db"]

app = FastAPI()

origins = [
    "*"
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

    # in meter
    light_distance_from_path = float(request_args['distanceFromPath'])
    dark_route_threshold = float(request_args['darkRouteThreshold'])

    # light_distance_from_path = 10
    # dark_route_threshold = 100
    # conversion to perpendicular to line distance..
    # Equation Y =  *X - 1.263
    # X = 9.000712452*10^-6 y  +  1.143801869731*10^-5

    distance_from_path = (9.000712452*light_distance_from_path + 11.43801869731)/1000000

    directions_api_response = maps.directions(source, destination)

    route_duplicate = []
    path = dict()

    for direction in directions_api_response[0]['legs'][0]['steps']:
        polyline = googlemaps.convert.decode_polyline(direction['polyline']['points'])
        route_duplicate += polyline

    route = []
    route.append(route_duplicate[0])
    for i in range(1, len(route_duplicate)):
        if route_duplicate[i-1] != route_duplicate[i]:
            route.append(route_duplicate[i])
    
    total_distance = 0
    path[(route[0]['lat'], route[0]['lng'])] = total_distance 
    for i in range(1, len(route)):
        prev_point = route[i-1] 
        coordinate = route[i]
        total_distance += haversine(coordinate['lat'], coordinate['lng'], prev_point['lat'], prev_point['lng'])
        path[(coordinate['lat'], coordinate['lng'])] = total_distance 
            
    close_lights = dict()

    start = timer()
    print("hello")
    for i in range(1, len(route)):
        p1 = (route[i-1]['lat'], route[i-1]['lng'])
        p2 = (route[i]['lat'], route[i]['lng'])
        lights, distances = pointToLineDistance(p1, p2, light_coordinates, distance_from_path)
        for j in range(len(lights)):
            current_light = (lights[j][0], lights[j][1]) 
            if perpendicular_checker(p1, p2, current_light):
                if current_light in close_lights.keys():
                    if close_lights[current_light][2] > distances[j]:
                        close_lights[current_light] = (p1, p2, distances[j])   
                else:
                    close_lights[current_light] = (p1, p2, distances[j])
    

    for x in close_lights:
        light_between_points = [x[0], x[1], close_lights[x][0], close_lights[x][1]]
        lights_considered.append(light_between_points)
     
    perpendiculars, perpendiculars_list, gath = find_perpendiculars(lights_considered, path)

    path = sorted(path.items(), key=lambda kv: kv[1])
    
    dark_routes, dark_route_bounds, dark_lights, dark_spot_distances = find_dark_spots(perpendiculars_list, path, dark_route_threshold)

    gath = [{'lat': x[0], 'lng': x[1]} for x in gath]
    close_lights = [{'lat': x[0], 'lng': x[1]} for x in close_lights]
    # close_lights = [{'lat': x[0], 'lng': x[1]} for x in lights_considered]
    # close_lights = [{'lat': x[0][0], 'lng': x[0][1]} for x in path]
    # close_lights = [{'lat': x['lat'], 'lng': x['lng']} for x in route]
    
    dark_route_bounds = []
    for i in range(len(dark_routes)):
        dark_route_bounds.append(directions_api_response[0]['bounds'])
 
    output = {'route': route, 'route_lights': close_lights, 'bounds': directions_api_response[0]['bounds'], 'dark_routes': dark_routes, 'dark_route_bounds': dark_route_bounds, 'perpendiculars': perpendiculars, 'dark_spot_distances':  dark_spot_distances, 'indicator': perpendiculars}

    end = timer()
    print(end - start) 

    return output


@app.get("/icon")
def get_icon():
    return FileResponse("lamp-glow.png")

@app.get("/icon2")
def get_icon2():
    return FileResponse("light.png")
