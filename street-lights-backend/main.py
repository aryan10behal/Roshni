from audioop import mul
from cgi import print_environ
from enum import unique
from fileinput import close
import re
from time import time
from turtle import distance
from datetime import datetime
from urllib import request
from warnings import filters
from fastapi import FastAPI, Request, File, UploadFile, HTTPException, Depends
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
from csv import writer
import pandas as pd
from typing import List
import fastapi.security as _security
import sqlalchemy.orm as _orm
import services as _services, schemas as _schemas
import pytz


# for email 
import smtplib, ssl

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
        dist = np.where(
            (p3[:, 1] - p1[1] >= 0) ^ (p3[:, 1] - p2[1] >= 0), 
            np.abs(p3[:, 0] - p1[0]), 
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        ) < distance_from_path

        lights = p3[dist]
        distance_from_p1 = distance_from_p1[dist]
        distance_from_p2 = distance_from_p2[dist]
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
        dist = np.where(
            (A * p3[:, 0] - B * p3[:, 1] + C1 >= 0) ^ (A * p3[:, 0] - B * p3[:, 1] + C2 >= 0), 
            np.abs(A * p3[:, 0] + B * p3[:, 1] + C)/(A**2 + B**2)**0.5,
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        ) < distance_from_path

        lights = p3[dist]
        distance_from_p1 = distance_from_p1[dist]
        distance_from_p2 = distance_from_p2[dist]
        distance = np.where(
            (A * lights[:, 0] - B * lights[:, 1] + C1 >= 0) ^ (A * lights[:, 0] - B * lights[:, 1] + C2 >= 0), 
            np.abs(A * lights[:, 0] + B * lights[:, 1] + C)/(A**2 + B**2)**0.5,
            np.where(distance_from_p1 < distance_from_p2, distance_from_p1, distance_from_p2)
        )
    fine_lights = perpendicular_checker(p1, p2, lights)
    return fine_lights, distance

def perpendicular_checker(p1,p2,p3):
    PR = np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
    if p2[0] == p1[0]:
        x = p1[0]
        y = p3[:, 1]
        PQ = np.sqrt((x - p1[0]) ** 2 + (y[:] - p1[1]) ** 2)
        QR = np.sqrt((x - p2[0]) ** 2 + (y[:] - p2[1]) ** 2)
    else:
        A1 = (p2[1] - p1[1])/(p2[0] - p1[0])
        B1 = -1
        C1 = p2[1] - A1*p2[0]
        if A1 == 0:
            A2 = -1
            B2 = 0
            C2 = p3[:, 0]
        else:
            A2 = -1/A1
            B2 = -1
            C2 = p3[:,1] - A2*p3[:,0]

        x = ((B1*C2[:] - B2*C1)/ (A1*B2 - A2*B1))
        y = (A2*C1 - A1*C2[:]) / (A1*B2 - A2*B1)
        PQ = np.sqrt((x[:] - p1[0]) ** 2 + (y[:] - p1[1]) ** 2)
        QR = np.sqrt((x[:] - p2[0]) ** 2 + (y[:] - p2[1]) ** 2)

    # return list()
    # PR = np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
    # PQ = np.sqrt((x[:] - p1[0]) ** 2 + (y[:] - p1[1]) ** 2)
    # QR = np.sqrt((x[:] - p2[0]) ** 2 + (y[:] - p2[1]) ** 2)
    fine_lights = p3[PR == PQ[:] + QR[:]]
    return fine_lights


def find_perpendiculars(lights_considered, path, start_location, end_location):
    perpendiculars = []
    perpendiculars.append({
            'lat': start_location[0]['lat'],
            'lng': start_location[0]['lng'],
            'p1': (0, 0),
            'p2': (0,0),
            'dist': 0
        })
    perpendiculars.append({
            'lat': end_location[0]['lat'],
            'lng': end_location[0]['lng'],
            'p1': (0,0),
            'p2': (0,0),
            'dist': end_location[1],
        })
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
    return perpendiculars, perpendiculars_list

def find_dark_spots(perpendiculars, path, dark_route_threshold):
    j = 0
    path_size = len(path)
    dark_routes = []
    dark_spot_distance = []

    for i in range(1, len(perpendiculars)):
        distance = perpendiculars[i]['dist'] - perpendiculars[i-1]['dist']
        if distance > dark_route_threshold:
            point1 = {'lat': perpendiculars[i-1]['lat'], 'lng': perpendiculars[i-1]['lng']}
            point2 = {'lat': perpendiculars[i]['lat'], 'lng': perpendiculars[i]['lng']}
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

    return  dark_routes, dark_spot_distance





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

IST = pytz.timezone('Asia/Kolkata')


@app.post("/api/users")
async def create_user(new_user: _schemas.UserCreate, db: _orm.Session = Depends(_services.get_db), user: _schemas.User = Depends(_services.get_current_user)):
    db_user = await _services.get_user_by_email(new_user.email, db)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    new_user = await _services.create_user(new_user, db)
    print(new_user)
    
    # return await _services.create_token(user)


@app.post("/api/token")
async def generate_token(
    form_data: _security.OAuth2PasswordRequestForm = Depends(),
    db: _orm.Session = Depends(_services.get_db),
):
    user = await _services.authenticate_user(form_data.username, form_data.password, db)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    return await _services.create_token(user)


@app.get("/api/users/me", response_model=_schemas.User)
async def get_user(user: _schemas.User = Depends(_services.get_current_user)):
    return user


@app.post("/api/leads", response_model=_schemas.Lead)
async def create_lead(
    lead: _schemas.LeadCreate,
    user: _schemas.User = Depends(_services.get_current_user),
    db: _orm.Session = Depends(_services.get_db),
):
    return await _services.create_lead(user=user, db=db, lead=lead)


@app.get("/api/leads", response_model=List[_schemas.Lead])
async def get_leads(
    user: _schemas.User = Depends(_services.get_current_user),
    db: _orm.Session = Depends(_services.get_db),
):
    return await _services.get_leads(user=user, db=db)


@app.get("/api/leads/{lead_id}", status_code=200)
async def get_lead(
    lead_id: int,
    user: _schemas.User = Depends(_services.get_current_user),
    db: _orm.Session = Depends(_services.get_db),
):
    return await _services.get_lead(lead_id, user, db)


@app.delete("/api/leads/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: int,
    user: _schemas.User = Depends(_services.get_current_user),
    db: _orm.Session = Depends(_services.get_db),
):
    await _services.delete_lead(lead_id, user, db)
    return {"message", "Successfully Deleted"}


@app.put("/api/leads/{lead_id}", status_code=200)
async def update_lead(
    lead_id: int,
    lead: _schemas.LeadCreate,
    user: _schemas.User = Depends(_services.get_current_user),
    db: _orm.Session = Depends(_services.get_db),
):
    await _services.update_lead(lead_id, lead, user, db)
    return {"message", "Successfully Updated"}


@app.get("/api")
async def root():
    return {"message": "Awesome Leads Manager"}

@app.get("/logout")
async def logout(user: _schemas.User = Depends(_services.get_current_user)):
    
    

@app.get("/total_no_of_streetlights")
async def get_total_streetlights(req: Request):
    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
                         
    request_args = dict(req.query_params)
    if 'live' in request_args and request_args['live']:
        return len([light for light in all_lights if light['Unique Pole No.'] != ''])
    else:
        return len(all_lights)

@app.get("/total_pages")
async def get_total_pages(req: Request):
    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
                         
    request_args = dict(req.query_params)
    page_size = 10000
    if 'live' in request_args and request_args['live']:
        total_lights = len([light for light in all_lights if light['Unique Pole No.'] != ''])
        if total_lights%page_size == 0:
            return total_lights//page_size
        return total_lights//page_size + 1
    else:
        total_lights = len(all_lights)
        if total_lights%page_size == 0:
            return total_lights//page_size
        return total_lights//page_size + 1

@app.get("/streetlights")
async def get_streetlights(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    
    request_args = dict(req.query_params)
    if 'live' in request_args:
        only_live = int(request_args['live'])
    else:
        only_live = False
    begin_index = 0
    end_index = len(all_lights)
    if 'page_no' in request_args:
        page_no = int(request_args['page_no'])
        page_size = 10000
        if 'page_size' in request_args:
            page_size = int(request_args['page_size'])
        begin_index = page_no * page_size
        end_index = (page_no + 1) * page_size
        print('page_no', begin_index, end_index, 'page_size', page_size)

    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    start = timer()
    for light in all_lights[begin_index: end_index]:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
                          
    end = timer()
    response = [light for light in all_lights if not only_live or light['Unique Pole No.'] != '']
    response = response[begin_index: end_index]
    print(begin_index, end_index, "loading time", end-start, ' | response size:', len(response))
    return response



@app.get("/route")
def get_route(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]    
    light_coordinates = np.array([[streetlight['lat'], streetlight['lng']] for streetlight in all_lights])
    light_data = {(streetlight['lng'], streetlight['lat']):{'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['zone'], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.':streetlight['Ward No.'] , 'Wattage':streetlight['Wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights}
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
            light_data[(light['lng'], light['lat'])]['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light_data[(light['lng'], light['lat'])]['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
                        

    lights_considered = []
    request_args = dict(req.query_params)
    source = request_args['source']
    destination = request_args['destination']

    # source = "govindpuri"
    # destination = "iiitd"
    # light_distance_from_path = 100
    # dark_route_threshold = 100

    # in meter
    light_distance_from_path = float(request_args['distanceFromPath'])
    dark_route_threshold = float(request_args['darkRouteThreshold'])



    distance_from_path = (9.000712452*light_distance_from_path + 11.43801869731)/1000000
    directions_api_response = maps.directions(source, destination, alternatives=True)

    print("number of response = ", len(directions_api_response))

    all_routes = {'num':len(directions_api_response)}

    best_route_index = 0
    best_route_dark_distance = 1e9

    for route_num in range(len(directions_api_response)):
        print(f"---ROUTE {route_num}---")

        route_duplicate = []
        path = dict()

        start_location = [directions_api_response[route_num]['legs'][0]['start_location'], 0]
        end_location = [directions_api_response[route_num]['legs'][0]['end_location'], directions_api_response[route_num]['legs'][0]['distance']['value']]
        
        for direction in directions_api_response[route_num]['legs'][0]['steps']:
            polyline = googlemaps.convert.decode_polyline(direction['polyline']['points'])
            route_duplicate += polyline

        route = []
        route.append(route_duplicate[0])
        for i in range(1, len(route_duplicate)):
            if route_duplicate[i-1] != route_duplicate[i]:
                route.append(route_duplicate[i])
        
        

        if len(route) == 1:
            route.append(route[0])


        total_distance = 0
        path[(route[0]['lat'], route[0]['lng'])] = total_distance 
        for i in range(1, len(route)):
            prev_point = route[i-1] 
            coordinate = route[i]
            total_distance += haversine(coordinate['lat'], coordinate['lng'], prev_point['lat'], prev_point['lng'])
            path[(coordinate['lat'], coordinate['lng'])] = total_distance 
                
        close_lights = dict()

        start = timer()
        for i in range(1, len(route)):
            p1 = (route[i-1]['lat'], route[i-1]['lng'])
            p2 = (route[i]['lat'], route[i]['lng'])
            lights, distances = pointToLineDistance(p1, p2, light_coordinates, distance_from_path)
            for j in range(len(lights)):
                current_light = (lights[j][0], lights[j][1]) 
                if current_light in close_lights.keys():
                    if close_lights[current_light][2] > distances[j]:
                        close_lights[current_light] = (p1, p2, distances[j])   
                else:
                    close_lights[current_light] = (p1, p2, distances[j])
        
        end = timer()
        print("main algo time", end - start) 
        

        lights_considered = [[x[0], x[1], close_lights[x][0], close_lights[x][1]] for x in close_lights]
        perpendiculars, perpendiculars_list= find_perpendiculars(lights_considered, path, start_location, end_location)

        path = sorted(path.items(), key=lambda kv: kv[1])
        
        dark_routes, dark_spot_distances = find_dark_spots(perpendiculars_list, path, dark_route_threshold)


        dark_route_bounds = directions_api_response[route_num]['bounds']
        close_lights = [{'lat': x[0], 'lng': x[1], 'CCMS_no':light_data[(x[1],x[0])]['CCMS_no'], 'zone':light_data[(x[1],x[0])]['zone'], 'Type of Light':light_data[(x[1],x[0])]['Type of Light'], 'No. Of Lights':light_data[(x[1],x[0])]['No. Of Lights'], 'Ward No.':light_data[(x[1],x[0])]['Ward No.'] , 'Wattage':light_data[(x[1],x[0])]['Wattage'], 'Connected Load':light_data[(x[1],x[0])]['Connected Load'], 'Actual Load':light_data[(x[1],x[0])]['Actual Load'], 'Unique Pole No.':light_data[(x[1],x[0])]['Unique Pole No.']} for x in close_lights]  


        output = {'route': route, 'route_lights': close_lights, 'bounds': directions_api_response[route_num]['bounds'], 'dark_routes': dark_routes, 'dark_route_bounds': dark_route_bounds, 'perpendiculars': perpendiculars, 'dark_spot_distances':  dark_spot_distances, 'indicator': perpendiculars}
        end = timer()
        print("time to compute route: ", end - start) 

        longest_dark_route = 0
        # Choosing best route
        if len(dark_spot_distances)!=0:
            longest_dark_route = max(dark_spot_distances)
        
        if(longest_dark_route < best_route_dark_distance):
            best_route_dark_distance = longest_dark_route
            best_route_index = route_num

        all_routes[f'route_{route_num}'] = output
    all_routes['best_route_index'] = best_route_index

    return all_routes


@app.get("/addLight")
async def addLight(req: Request,  user: _schemas.User = Depends(_services.get_current_user)):

    request_args = dict(req.query_params)
    latitude = float(request_args['latitude'])
    longitude = float(request_args['longitude'])
    if({'lng': longitude, 'lat':latitude} in all_lights):
        return
    all_lights.append({'lng': longitude, 'lat':latitude})
    light_coordinates = np.append(light_coordinates, [[latitude, longitude]], axis = 0)

    db['streetlights'].insert_one({'lng': longitude, 'lat':latitude})

    with open("../street-lights-db/data/Added Lights.csv") as f_object:
        text = f_object.read()
        f_object.close()
    with open("../street-lights-db/data/Added Lights.csv", "a") as f_object:
        if not text.endswith('\n'):
            f_object.write('\n')
        writer1=writer(f_object)
        writer1.writerow([latitude, longitude])
        f_object.close()
    return

@app.get("/deleteLight")
async def deleteLight(req: Request, user: _schemas.User = Depends(_services.get_current_user)):
    
    request_args = dict(req.query_params)
    latitude = float(request_args['latitude'])
    longitude = float(request_args['longitude'])
    if({'lng': longitude, 'lat':latitude} not in all_lights):
        return
    all_lights.remove({'lng': longitude, 'lat':latitude})
    light_coordinates = np.delete(light_coordinates, np.argwhere(light_coordinates == [[latitude, longitude]]))
    db['streetlights'].delete_one({'lng': longitude, 'lat':latitude})
    with open("../street-lights-db/data/Deleted Lights.csv") as f_object:
        text = f_object.read()
        f_object.close()
    with open("../street-lights-db/data/Deleted Lights.csv", "a") as f_object:
        if not text.endswith('\n'):
            f_object.write('\n')
        writer1=writer(f_object)
        writer1.writerow([latitude, longitude])
        f_object.close()
    return




@app.get("/reportLight")
async def report(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']     

    admin_credentials = {admin['agency']: {'Name': admin['Name'], 'Email': admin['Email'], 'agency': admin['agency'],'Ward_No': admin['Ward_No'], 'zone':admin['zone']} for admin in db["administration-details"].find() if admin['Email']}


    request_args = dict(req.query_params)
    unique_pole_no = str(request_args['unique_pole_no'])
    phone_no = request_args['phone_no']
    report_type = request_args['report_type']

    try:
        rows = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['zone'], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.':streetlight['Ward No.'] , 'Wattage':streetlight['Wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights if streetlight['Unique Pole No.']==unique_pole_no]
        record = rows[0]
        db['reports'].insert_one({'id': unique_pole_no,'timestamp': str(datetime.now(IST)), 'phone_no': phone_no, 'report_type': report_type, 'unique_pole_no' : unique_pole_no})
        sender_mail_id = "superuser.roshni.0.0.0@gmail.com"
        password = "superuser123"

        # initialised to universal mail id
        concerned_authority_mail = "superuser.receiver.roshni.0.0.0@gmail.com"
        # password_receiver = "superuser456"

        agency = record['agency']

        # # currently assuming, an admin in a agency lvl...
        if agency in admin_credentials.keys():
            concerned_authority_mail = admin_credentials[agency]['Email']
        
        lat = record['lat']
        lng = record['lng']
        CCMS_no = record['CCMS_no']
        Zone = record['zone']
        Type_of_Light = record['Type of Light']
        No_Of_Lights = record['No. Of Lights']
        Wattage = record['Wattage']
        Ward_No =  record['Ward No.'] 
        Connected_Load = record['Connected Load']
        Actual_Load = record['Actual Load']

        # # Report Message here..
        report_message = "\n A light pole has been reported with following details: [Lat, Lng]: " + str(lat) +", "+ str(lng) + ', timestamp: '+ str(datetime.now(IST)) + ', CCMS_no: '+  str(CCMS_no) + ', Zone: '+ Zone+ ', Type_of_Light: '+  Type_of_Light + ', No_Of_Lights: ' + str(No_Of_Lights) + ', Wattage: ' + Wattage + ', Ward_No: ' + Ward_No + ', agency: ' + agency + ', unique_no: ' + unique_pole_no  + ', Connected Load: ' + str(Connected_Load) + ', Actual Load: '+ str(Actual_Load) + '|| Reported by: Phone No: ' + phone_no + 'Report Type: ' + report_type
        subject = "Light Reported"
        message = 'Subject: {}\n\n{}'.format(subject, report_message)
        port = 587 # For starttls
        smtp_server = "smtp.gmail.com"

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()
            server.starttls(context = context)
            server.ehlo()
            server.login(sender_mail_id, password)
            server.sendmail(sender_mail_id, concerned_authority_mail, message)
            print("Admin notified by mail!")
    except Exception as e:
        print(e)
    finally:
        reported_list = {report['unique_pole_no']: {'timestamp': report['timestamp'], 'id':report['id'], 'Phone No': report['phone_no'], 'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['reports'].find()}
        reported_list = [{'lng': reported_light['lng'], 'lat': reported_light['lat'], 'timestamp': reported_list[reported_light['Unique Pole No.']]['timestamp'], 'id':reported_list[reported_light['Unique Pole No.']]['id'],  'CCMS_no': reported_light['CCMS_no'], 'zone':reported_light['zone'], 'Type_of_Light':reported_light['Type of Light'], 'No_Of_Lights':reported_light['No. Of Lights'], 'Wattage':reported_light['Wattage'], 'Ward_No': reported_light['Ward No.'], 'Connected Load':reported_light['Connected Load'], 'Actual Load':reported_light['Actual Load'], 'unique_pole_no':reported_light['Unique Pole No.'], 'agency': reported_light['agency'], 'Phone No': reported_list[reported_light['Unique Pole No.']]['Phone No'], 'Report Type': reported_list[reported_light['Unique Pole No.']]['Report Type'],'unique_no': reported_light['unique_no']} for reported_light in all_lights if reported_light['Unique Pole No.'] in reported_list.keys()]
        return reported_list
 


@app.get("/report")
async def report(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
        
    admin_credentials = {admin['agency']: {'Name': admin['Name'], 'Email': admin['Email'], 'agency': admin['agency'],'Ward_No': admin['Ward_No'], 'zone':admin['zone']} for admin in db["administration-details"].find() if admin['Email']}

    request_args = dict(req.query_params)
    print(request_args)
    unique_pole_no = str(request_args['unique_pole_no'])
    phone_no = str(request_args['phone_no'])
    report_type = str(request_args['report_type'])

    try:
        rows = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['zone'], 'agency':streetlight['agency'], 'unique_no':streetlight['unique_no'], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.':streetlight['Ward No.'] , 'Wattage':streetlight['Wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights if streetlight['Unique Pole No.']==unique_pole_no]
        record = rows[0]
        print("Reporting: ", record)
        # record = [{ 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights if streetlight['Unique Pole No.']==unique_pole_no][0]
        db['reports'].insert_one({'id': unique_pole_no,'timestamp': str(datetime.now(IST)), 'phone_no': phone_no, 'report_type': report_type, 'unique_pole_no' : unique_pole_no})

        sender_mail_id = "superuser.roshni.0.0.0@gmail.com"
        password = "superuser123"

        # initialised to universal mail id
        concerned_authority_mail = "superuser.receiver.roshni.0.0.0@gmail.com"
        # password_receiver = "superuser456"

        agency = record['agency']

        # # currently assuming, an admin in a agency lvl...
        if agency in admin_credentials.keys():
            concerned_authority_mail = admin_credentials[agency]['Email']
        
        lat = record['lat']
        lng = record['lng']
        CCMS_no = record['CCMS_no']
        Zone = record['zone']
        Type_of_Light = record['Type of Light']
        No_Of_Lights = record['No. Of Lights']
        Wattage = record['Wattage']
        Ward_No =  record['Ward No.'] 
        Connected_Load = record['Connected Load']
        Actual_Load = record['Actual Load']

        # # Report Message here..
        report_message = "\n A light pole has been reported with following details: [Lat, Lng]: " + str(lat) +", "+ str(lng) + ', timestamp: '+ str(datetime.now(IST)) + ', CCMS_no: '+  str(CCMS_no) + ', Zone: '+ Zone+ ', Type_of_Light: '+  Type_of_Light + ', No_Of_Lights: ' + str(No_Of_Lights) + ', Wattage: ' + Wattage + ', Ward_No: ' + Ward_No + ', agency: ' + agency + ', unique_no: ' + unique_pole_no  + ', Connected Load: ' + str(Connected_Load) + ', Actual Load: '+ str(Actual_Load) + '|| Reported by: Phone No: ' + phone_no + 'Report Type: ' + report_type
        subject = "Light Reported"
        message = 'Subject: {}\n\n{}'.format(subject, report_message)
        port = 587 # For starttls
        smtp_server = "smtp.gmail.com"

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()
            server.starttls(context = context)
            server.ehlo()
            server.login(sender_mail_id, password)
            server.sendmail(sender_mail_id, concerned_authority_mail, message)
            print("Admin notified by mail!")
    except Exception as e:
        print("error message: ", e)

    reported_list = {report['unique_pole_no']: {'timestamp': report['timestamp'], 'id':report['id'], 'Phone No': report['phone_no'], 'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['reports'].find()}
    reported_list = [{'lng': reported_light['lng'], 'lat': reported_light['lat'], 'timestamp': reported_list[reported_light['Unique Pole No.']]['timestamp'], 'id':reported_list[reported_light['Unique Pole No.']]['id'],  'CCMS_no': reported_light['CCMS_no'], 'zone':reported_light['zone'], 'Type_of_Light':reported_light['Type of Light'], 'No_Of_Lights':reported_light['No. Of Lights'], 'Wattage':reported_light['Wattage'], 'Ward_No': reported_light['Ward No.'], 'Connected Load':reported_light['Connected Load'], 'Actual Load':reported_light['Actual Load'], 'unique_pole_no':reported_light['Unique Pole No.'], 'agency': reported_light['agency'], 'Phone No': reported_list[reported_light['Unique Pole No.']]['Phone No'], 'Report Type': reported_list[reported_light['Unique Pole No.']]['Report Type'],'unique_no': reported_light['unique_no']} for reported_light in all_lights if reported_light['Unique Pole No.'] in reported_list.keys()]
    return reported_list

@app.get("/reports")
async def get_reports(user: _schemas.User = Depends(_services.get_current_user)):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
        
    reported_list = {report['unique_pole_no']: {'timestamp': report['timestamp'], 'id':report['id'], 'Phone No': report['phone_no'], 'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['reports'].find()}
    reported_list = [{'lng': reported_light['lng'], 'lat': reported_light['lat'], 'timestamp': reported_list[reported_light['Unique Pole No.']]['timestamp'], 'id':reported_list[reported_light['Unique Pole No.']]['id'],  'CCMS_no': reported_light['CCMS_no'], 'zone':reported_light['zone'], 'Type_of_Light':reported_light['Type of Light'], 'No_Of_Lights':reported_light['No. Of Lights'], 'Wattage':reported_light['Wattage'], 'Ward_No': reported_light['Ward No.'], 'Connected Load':reported_light['Connected Load'], 'Actual Load':reported_light['Actual Load'], 'unique_pole_no':reported_light['Unique Pole No.'], 'agency': reported_light['agency'], 'Phone No': reported_list[reported_light['Unique Pole No.']]['Phone No'], 'Report Type': reported_list[reported_light['Unique Pole No.']]['Report Type'],'unique_no': reported_light['unique_no']} for reported_light in all_lights if reported_light['Unique Pole No.'] in reported_list.keys()]
    return reported_list

@app.get("/report_region")
def report_region(req: Request):
    
    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]    
    light_coordinates = np.array([[streetlight['lat'], streetlight['lng']] for streetlight in all_lights])
    light_data = {(streetlight['lng'], streetlight['lat']):{'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['zone'], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.':streetlight['Ward No.'] , 'Wattage':streetlight['Wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights}
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
            light_data[(light['lng'], light['lat'])]['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light_data[(light['lng'], light['lat'])]['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
                        
    admin_credentials = {admin['agency']: {'Name': admin['Name'], 'Email': admin['Email'], 'agency': admin['agency'],'Ward_No': admin['Ward_No'], 'zone':admin['zone']} for admin in db["administration-details"].find() if admin['Email']}


    request_args = dict(req.query_params)
    center = request_args['center']
    print(request_args)
    phone_no = request_args['phone_no']
    report_type = request_args['report_type']
    center = [float(center[1:center.find(',')]),float(center[center.find(',')+2:-1])]

    # converting m distance to lat_lng equilvalent
    radius = (9.000712452*float(request_args['radius']) + 11.43801869731)/1000000

    print(center, radius, phone_no, report_type)

    try:
        print("@@", light_coordinates[0])
        lights = light_coordinates[np.sqrt((light_coordinates[:, 0] - center[0]) ** 2 + (light_coordinates[:, 1] - center[1]) ** 2) < radius]
        print(len(lights), len(light_coordinates))
        all_agencies = set()
        # lights_to_be_reported = [{'lat': x[0], 'lng': x[1], 'CCMS_no':light_data[(x[1],x[0])]['CCMS_no'], 'zone':light_data[(x[1],x[0])]['zone'], 'Type of Light':light_data[(x[1],x[0])]['Type of Light'], 'No. Of Lights':light_data[(x[1],x[0])]['No. Of Lights'], 'Ward No.':light_data[(x[1],x[0])]['Ward No.'] , 'Wattage':light_data[(x[1],x[0])]['Wattage'], 'Connected Load':light_data[(x[1],x[0])]['Connected Load'], 'Actual Load':light_data[(x[1],x[0])]['Actual Load']} for x in lights]
        for x in lights:
            db['reports'].insert_one({'timestamp': str(datetime.now(IST)),'id': light_data[(x[1],x[0])]['Unique Pole No.'],'unique_pole_no' : light_data[(x[1],x[0])]['Unique Pole No.'], 'phone_no': phone_no, 'report_type': report_type})
            light_agency = light_data[(x[1],x[0])]['Unique Pole No.'][0:2] if light_data[(x[1],x[0])]['Unique Pole No.']!='' else ''
            all_agencies.add(light_agency)
            
        sender_mail_id = "superuser.roshni.0.0.0@gmail.com"
        password = "superuser123"

        for agency_identified in all_agencies:
            # initialised to universal mail id
            concerned_authority_mail = "superuser.receiver.roshni.0.0.0@gmail.com"
            # password_receiver = "superuser456"

            agency = agency_identified

            # # currently assuming, an admin in a agency lvl...
            if agency in admin_credentials.keys():
                concerned_authority_mail = admin_credentials[agency]['Email']
            
            # # Report Message here..
            report_message = "\n Light poles have been reported in the agency at: " + ' timestamp: '+ str(datetime.now(IST)) +'|| by: Phone No: ' + phone_no + 'Report Type: ' + report_type
            subject = "Light(s) Reported"
            message = 'Subject: {}\n\n{}'.format(subject, report_message)
            port = 587 # For starttls
            smtp_server = "smtp.gmail.com"

            context = ssl.create_default_context()
            with smtplib.SMTP(smtp_server, port) as server:
                server.ehlo()
                server.starttls(context = context)
                server.ehlo()
                server.login(sender_mail_id, password)
                server.sendmail(sender_mail_id, concerned_authority_mail, message)
        print("Admin(s) notified by mail!")

    except Exception as e:
        print("error message: ", e)

    reported_list = {report['unique_pole_no']: {'timestamp': report['timestamp'], 'id':report['id'], 'Phone No': report['phone_no'], 'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['reports'].find()}
    reported_list = [{'lng': reported_light['lng'], 'lat': reported_light['lat'], 'timestamp': reported_list[reported_light['Unique Pole No.']]['timestamp'], 'id':reported_list[reported_light['Unique Pole No.']]['id'],  'CCMS_no': reported_light['CCMS_no'], 'zone':reported_light['zone'], 'Type_of_Light':reported_light['Type of Light'], 'No_Of_Lights':reported_light['No. Of Lights'], 'Wattage':reported_light['Wattage'], 'Ward_No': reported_light['Ward No.'], 'Connected Load':reported_light['Connected Load'], 'Actual Load':reported_light['Actual Load'], 'unique_pole_no':reported_light['Unique Pole No.'], 'agency': reported_light['agency'], 'Phone No': reported_list[reported_light['Unique Pole No.']]['Phone No'], 'Report Type': reported_list[reported_light['Unique Pole No.']]['Report Type'],'unique_no': reported_light['unique_no']} for reported_light in all_lights if reported_light['Unique Pole No.'] in reported_list.keys()]
    return reported_list


@app.get("/resolveReport")
def resolveReport(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
       

    request_args = dict(req.query_params)
    ids = request_args['id']
    comment = request_args['comment']
    print("ids:", ids)
    reported_lights = list(ids.split(','))

    for reported_light in reported_lights:
        print(reported_light)
        resolved_light_data = db['reports'].find_one({'id': reported_light})
        if not resolved_light_data:
            print(f"Light with id \"{reported_light}\" not found")
            continue
        print("\n\nLight being resolved ", resolved_light_data)
        db['reports'].delete_one({'id': reported_light})
        resolved_light_data['Comments'] = comment
        resolved_light_data['resolved_timestamp'] = str(datetime.now(IST))
        db['resolved-reports'].insert_one(resolved_light_data)
    
        
    reported_list = {report['unique_pole_no']: {'timestamp': report['timestamp'], 'id':report['id'], 'Phone No': report['phone_no'], 'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['reports'].find()}
    reported_list = [{'lng': reported_light['lng'], 'lat': reported_light['lat'], 'timestamp': reported_list[reported_light['Unique Pole No.']]['timestamp'], 'id':reported_list[reported_light['Unique Pole No.']]['id'],  'CCMS_no': reported_light['CCMS_no'], 'zone':reported_light['zone'], 'Type_of_Light':reported_light['Type of Light'], 'No_Of_Lights':reported_light['No. Of Lights'], 'Wattage':reported_light['Wattage'], 'Ward_No': reported_light['Ward No.'], 'Connected Load':reported_light['Connected Load'], 'Actual Load':reported_light['Actual Load'], 'unique_pole_no':reported_light['Unique Pole No.'], 'agency': reported_light['agency'], 'Phone No': reported_list[reported_light['Unique Pole No.']]['Phone No'], 'Report Type': reported_list[reported_light['Unique Pole No.']]['Report Type'],'unique_no': reported_light['unique_no']} for reported_light in all_lights if reported_light['Unique Pole No.'] in reported_list.keys()]
    return reported_list

@app.get("/getResolvedReport")
async def getResolvedReport(user: _schemas.User = Depends(_services.get_current_user)):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
       

    resolved_lights = {report['unique_pole_no']: {'id':report['id'], 'Phone No': report['phone_no'],'timestamp': report['timestamp'], 'resolved_timestamp': report['resolved_timestamp'] ,'Comments': report['Comments'],'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['resolved-reports'].find()}
    resolved_lights = [{'lng': lights['lng'], 'lat': lights['lat'], 'timestamp': resolved_lights[lights['Unique Pole No.']]['timestamp'],'resolved_timestamp': resolved_lights[lights['Unique Pole No.']]['resolved_timestamp'],'resolved_timestamp': resolved_lights[lights['Unique Pole No.']]['resolved_timestamp'], 'Comments': resolved_lights[lights['Unique Pole No.']]['Comments'],'id':resolved_lights[lights['Unique Pole No.']]['id'],  'CCMS_no': lights['CCMS_no'], 'zone': lights['zone'], 'Type_of_Light': lights['Type of Light'], 'No_Of_Lights': lights['No. Of Lights'], 'Wattage': lights['Wattage'], 'Ward_No': lights['Ward No.'], 'Connected Load':lights['Connected Load'], 'Actual Load': lights['Actual Load'], 'unique_pole_no': lights['Unique Pole No.'], 'agency': lights['agency'], 'Phone No': resolved_lights[lights['Unique Pole No.']]['Phone No'], 'Report Type': resolved_lights[lights['Unique Pole No.']]['Report Type'],'unique_no': lights['unique_no']} for lights in all_lights if lights['Unique Pole No.'] in resolved_lights.keys()]
    return resolved_lights


@app.post("/addLightsFile")
def addLightsFile(file: UploadFile = File(...)):
    global light_coordinates
    df = pd.read_csv(file.file)
    lampposts = []
    df_final_latlng = df[['Longitude', 'Latitude', 'CCMS NO', 'Zone', 'Type of Light', 'No. Of Lights', 'Ward No.' , 'Wattage.1', 'Unique Pole No.']]
    df_final_latlng = df_final_latlng.drop_duplicates(keep= 'last')
    df_final_latlng = df_final_latlng.dropna()
    temp = df_final_latlng.values.tolist()
    temp = map(lambda x : {'lat':x[1], 'lng':x[0], 'CCMS_no': x[2], 'zone': x[3], 'Type of Light':x[4], 'No. Of Lights':x[5], 'Ward No.':x[6], 'wattage': x[7],'Connected Load':-1, 'Actual Load':-1, '_id':x[8] }, temp)
    lampposts += temp
    db_list = []
    for pole in lampposts:
        if pole not in all_lights:
            all_lights.append({'lng':pole['lng'], 'lat':pole['lat'], 'CCMS_no':pole['CCMS_no'], 'zone':pole['Unique Pole No.'][2:4], 'Type of Light':pole['Type of Light'], 'No. Of Lights':pole['No. Of Lights'], 'Ward No.': pole['Unique Pole No.'][4:7] , 'Wattage':pole['wattage'], 'Connected Load':pole['Connected Load'], 'Actual Load':pole['Actual Load'], 'Unique Pole No.':pole['Unique Pole No.'], 'agency': pole['Unique Pole No.'][0:2], 'unique_no': pole['Unique Pole No.'][7:]})
            light_coordinates = np.append(light_coordinates, [[pole['lng'], pole['lat']]], axis = 0)
            light_data[(pole['lng'], pole['lat'])]={'CCMS_no':pole['CCMS_no'], 'zone':pole['zone'], 'Type of Light':pole['Type of Light'], 'No. Of Lights':pole['No. Of Lights'], 'Ward No.':pole['Ward No.'] , 'Wattage':pole['Wattage'], 'Connected Load':pole['Connected Load'], 'Actual Load':pole['Actual Load'], 'Unique Pole No.':pole['Unique Pole No.']}
            db_list.append(pole)
    if(len(db_list)!=0):
        db['streetlights'].insert_many(db_list)
    with open("../street-lights-db/data/Added Lights.csv") as f_object:
        text = f_object.read()
        f_object.close()
    with open("../street-lights-db/data/Added Lights.csv", "a") as f_object:
        if not text.endswith('\n'):
            f_object.write('\n')
        writer1=writer(f_object)
        for light in db_list:
            writer1.writerow([light['lat'], light['lng']])
        f_object.close()
    return
 

@app.post("/deleteLightsFile")
def deleteLightsFile(file: UploadFile = File(...)):
    global light_coordinates
    df = pd.read_csv(file.file)
    lampposts = []
    df_final_latlng = df[['Longitude', 'Latitude', 'CCMS NO', 'Zone', 'Type of Light', 'No. Of Lights', 'Ward No.' , 'Wattage.1', 'Unique Pole No.']]
    df_final_latlng = df_final_latlng.drop_duplicates(keep= 'last')
    df_final_latlng = df_final_latlng.dropna()
    temp = df_final_latlng.values.tolist()
    temp = map(lambda x : {'lat':x[1], 'lng':x[0], 'CCMS_no': x[2], 'zone': x[3], 'Type of Light':x[4], 'No. Of Lights':x[5], 'Ward No.':x[6], 'wattage': x[7],'Connected Load':-1, 'Actual Load':-1, '_id':x[8] }, temp)
    lampposts += temp
    db_list = []

    try:
        for pole in lampposts:
            if pole in all_lights:
                all_lights.remove({'lng':pole['lng'], 'lat':pole['lat'], 'CCMS_no':pole['CCMS_no'], 'zone':pole['Unique Pole No.'][2:4], 'Type of Light':pole['Type of Light'], 'No. Of Lights':pole['No. Of Lights'], 'Ward No.': pole['Unique Pole No.'][4:7] , 'Wattage':pole['wattage'], 'Connected Load':pole['Connected Load'], 'Actual Load':pole['Actual Load'], 'Unique Pole No.':pole['Unique Pole No.'], 'agency': pole['Unique Pole No.'][0:2], 'unique_no': pole['Unique Pole No.'][7:]})
                light_coordinates = np.delete(light_coordinates, np.argwhere(light_coordinates == [[pole['lng'], pole['lat']]]))
                light_data.pop((pole['lng'], pole['lat']))
                db_list.append(pole)
        if(len(db_list)!=0):
            for pole in db_list:
                db['streetlights'].delete_one(pole)
        with open("../street-lights-db/data/Deleted Lights.csv") as f_object:
            text = f_object.read()
            f_object.close()
        with open("../street-lights-db/data/Deleted Lights.csv", "a") as f_object:
            if not text.endswith('\n'):
                f_object.write('\n')
            writer1=writer(f_object)
            for light in db_list:
                writer1.writerow([light['lat'], light['lng']])
            f_object.close()
    
    except Exception as e:
        print("error message: ", e)

    return



@app.get("/place")
def get_latlng(req: Request):
    request_args = dict(req.query_params)
    place = request_args['query']
    latlng = maps.directions(place, place)[0]['bounds']['northeast']
    return latlng

@app.get("/icon")
def get_icon():
    return FileResponse("lamp-glow.png")

@app.get("/icon_red")
def get_icon():
    return FileResponse("red.png")

@app.get("/icon_green")
def get_icon():
    return FileResponse("green.png")

@app.get("/icon_yellow")
def get_icon():
    return FileResponse("yellow.png")

@app.get("/icon2")
def get_icon2():
    return FileResponse("light.png")
