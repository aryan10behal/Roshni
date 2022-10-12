from audioop import mul
from cgi import print_environ
from enum import unique
from fileinput import close
from logging import exception, raiseExceptions
import re
from time import time
from turtle import distance
from datetime import datetime, timedelta
from urllib import request
from warnings import filters
from fastapi import FastAPI, Request, File, UploadFile, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse, HTMLResponse
import numpy as np
import googlemaps
from math import radians, cos, sin, asin, sqrt, acos, atan2, pow, degrees, dist, pi
from timeit import default_timer as timer
from csv import writer
import pandas as pd
from typing import List
import fastapi.security as _security
from sqlalchemy import null
import sqlalchemy.orm as _orm
import services as _services, schemas as _schemas
import pytz
# for email 
import smtplib, ssl
from bson import ObjectId
import firebase_admin
from firebase_admin import credentials, messaging

# from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form
# from starlette.responses import JSONResponse
# from starlette.requests import Request
# from fastapi_mail import FastMail, MessageSchema,ConnectionConfig
# from pydantic import BaseModel, EmailStr
# from typing import List



# class EmailSchema(BaseModel):
#     email: List[EmailStr]


# conf = ConnectionConfig(
#     MAIL_USERNAME = "YourUsername",
#     MAIL_PASSWORD = "strong_password",
#     MAIL_FROM = "your@email.com",
#     MAIL_PORT = 587,
#     MAIL_SERVER = "your mail server",
#     MAIL_TLS = True,
#     MAIL_SSL = False,
#     USE_CREDENTIALS = True,
#     VALIDATE_CERTS = True
# )

# app = FastAPI()


# html = """
# <p>Thanks for using Fastapi-mail</p> 
# """


# @app.post("/email")
# async def simple_send(email: EmailSchema) -> JSONResponse:

#     message = MessageSchema(
#         subject="Fastapi-Mail module",
#         recipients=email.dict().get("email"),  # List of recipients, as many as you can pass 
#         body=html,
#         subtype="html"
#         )
#     fm = FastMail(conf)
#     await fm.send_message(message)



# /////////////////////////
# All utility functions for finding street light and dark stretches on route

def haversine(lat1, lon1, lat2, lon2):
    # finds distance between any 2 points when lat, lng for the 2 points given
    # distance returned in metres

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


# //////////////////////////////////////////////////////////////////////////////////////////
# Global initialisations

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
BACKEND = os.getenv('BACKEND')

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



# ///////////////////////////////
# All APIs

@app.post("/api/users")
async def create_user(new_user: _schemas.UserCreate, db: _orm.Session = Depends(_services.get_db), user: _schemas.User = Depends(_services.get_current_user)):
    authenticate_user(user.email)
    db_user = await _services.get_user_by_email(new_user.email, db)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    new_user = await _services.create_user(new_user, db)
    return dict(status_code=200, detail="New User Created!!")



@app.post("/api/token")
async def generate_token(
    form_data: _security.OAuth2PasswordRequestForm = Depends(),
    db: _orm.Session = Depends(_services.get_db),
):
    user = await _services.authenticate_user(form_data.username, form_data.password, db)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    token = await _services.create_token(user)

    if form_data.client_secret and form_data.client_secret[0:4] != "null":
            return dict(status_code=401, detail="Another Admin already Logged in another tab!! Please use that user")

    street_light_db = mongodb["street-lights-db"]
    if not street_light_db['LoggedIn-Users'].find_one({'email':str(form_data.username)}):
        street_light_db['LoggedIn-Users'].insert_one({'email':str(form_data.username), 'token':str(token['access_token'].decode("utf-8")), 'timestamp': datetime.now(IST),'FCMRegistrationToken': str(form_data.client_id)})
    return token

@app.get("/logout")
async def logout(user: _schemas.User = Depends(_services.get_current_user)):
    authenticate_user(user.email)
    email = user.email
    print("Email to be logged out: ", email)
    street_light_db = mongodb["street-lights-db"]
    street_light_db['LoggedIn-Users'].delete_many({'email':email})
    street_light_db['LoggedIn-Users'].delete_many({'timestamp':{'$lte': datetime.now(IST) - timedelta(minutes=30)}})
    logged_in_user_list = [{'email': logged_in_user['email'],'token':logged_in_user['token'], 'timestamp': logged_in_user['timestamp'], 'FCMRegistrationToken': logged_in_user['FCMRegistrationToken']} for logged_in_user in street_light_db['LoggedIn-Users'].find()]
    print("Currently Logged In users are: ", logged_in_user_list)
    return {'access_token': None, 'detail':'User Logged Out..'}


@app.get("/api/users/me", response_model=_schemas.User)
async def get_user(user: _schemas.User = Depends(_services.get_current_user)):
    return user



@app.get("/api")
async def root():
    return {"message": "Awesome Login mechanism"}    
    

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

    page_size = 15000
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

    start = timer()
    request_args = dict(req.query_params)

    print("get streetlights args: ", request_args)
    if 'live' in request_args:
        only_live = int(request_args['live'])
    else:
        only_live = False
    begin_index = 0
    end_index = 0
    if 'page_no' in request_args:
        page_no = int(request_args['page_no'])
        page_size = 15000
        if 'page_size' in request_args:
            page_size = int(request_args['page_size'])
        begin_index = page_no * page_size
        end_index = (page_no + 1) * page_size
        print('page_no', begin_index, end_index, 'page_size', page_size)
    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    response = []
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights[begin_index: end_index]:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
        if not only_live or light['Unique Pole No.'] != '':
            response.append(light)
                          
    end = timer()
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

    if 'source' not in request_args or request_args['source'] == "":
        raise HTTPException(status_code=401, detail="source missing")
    source = request_args['source']

    if 'destination' not in request_args or request_args['destination'] == "":
        raise HTTPException(status_code=401, detail="destination missing")
    destination = request_args['destination']

    # in meter
    light_distance_from_path = float(request_args['distanceFromPath'])
    dark_route_threshold = float(request_args['darkRouteThreshold'])


    distance_from_path = (9.000712452*light_distance_from_path + 11.43801869731)/1000000
    directions_api_response = dict()

    try:
        directions_api_response = maps.directions(source, destination, alternatives=True)
    except:
        raise HTTPException(status_code=401, detail=" Oops!! Some error occurred. Please check the source/destination..")

    print("number of response = ", len(directions_api_response))

    all_routes = {'num':len(directions_api_response)}

    if len(directions_api_response) == 0:
        raise HTTPException(status_code=401, detail="No route found. Please check the source/destination! ")

    try:
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
    except Exception as e:
        print("Route error", e)
        raise HTTPException(status_code=401, detail=" Oops!! Some error occurred..")

    return all_routes


@app.post("/addLight")
async def addLight(req: Request,  user: _schemas.User = Depends(_services.get_current_user)):
    authenticate_user(user.email)
    request_args = await req.json()
    print(request_args)
    if 'lat' not in request_args or 'lng' not in request_args or request_args['lat'] == "" or request_args['lng'] == "":
        raise HTTPException(status_code=401, detail="lat/lng missing")
    if 'ccms_no' not in request_args or request_args['ccms_no'] == "":
        raise HTTPException(status_code=401, detail="CCMS no missing")
    if 'unique_pole_no' not in request_args or request_args['unique_pole_no'] == "":
        raise HTTPException(status_code=401, detail="Pole ID missing")

    light_added = db['streetlights'].insert_one({'lng': float(request_args['lng']), 'lat':float(request_args['lat']), 'CCMS_no':str(request_args['ccms_no']), 'zone':str(request_args['zone']), 'Type of Light':str(request_args['type_of_light']), 'No. Of Lights': str(request_args['no_of_lights']),'Ward No.': str(request_args['ward_no']), 'wattage': str(request_args['wattage']), 'Connected Load': -1, 'Actual Load': -1, '_id': str(request_args['unique_pole_no'])})
    if not light_added:
        raise HTTPException(status_code=401, detail="Could not insert light! Some error occurred")
    return {'response': "successfully added light"}



@app.post("/deleteLight")
async def deleteLight(req: Request, user: _schemas.User = Depends(_services.get_current_user)):
    
    authenticate_user(user.email)
    request_args = await req.json()

    print("to delete: ", request_args)
    if 'unique_pole_no' not in request_args or request_args['unique_pole_no'] == "":
        raise HTTPException(status_code=401, detail="pole no missing")
    unique_pole_no = str(request_args['unique_pole_no'])
    light_deleted = db['streetlights'].delete_many({'_id':unique_pole_no})
    if light_deleted.deleted_count == 0:
        raise HTTPException(status_code=401, detail="No light found with the Pole ID")
    return {'response': "successfully deleted light"}


@app.get("/reportLight")
async def report(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']     

    admin_credentials = {admin['agency']: {'Name': admin['Name'], 'Email': admin['Email'], 'agency': admin['agency'],'Ward_No': admin['Ward_No'], 'zone':admin['zone']} for admin in db["administration-details"].find() if admin['Email']}
    FCMRegistrationTokenList = list(set([admin['FCMRegistrationToken'] for admin in db['LoggedIn-Users'].find()]))
    
    request_args = dict(req.query_params)
    print(request_args)

    if 'unique_pole_no' in request_args.keys():
        unique_pole_no = str(request_args['unique_pole_no'])
    else:
        raise HTTPException(status_code=401, detail="Pole ID missing")

    phone_no = request_args['phone_no']
    report_type = request_args['report_type']

    try:
        rows = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['zone'], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.':streetlight['Ward No.'] , 'Wattage':streetlight['Wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights if streetlight['Unique Pole No.']==unique_pole_no]
        record = rows[0]
        date, time = get_date_time()
        db['reports'].insert_one({'date': date,'time': time, 'phone_no': phone_no, 'report_type': report_type, 'unique_pole_no' : unique_pole_no})
        sender_mail_id = "superuser.roshni.0.0.0@gmail.com"
        password = "superuser123"

        # initialised to universal mail id
        concerned_authority_mail = "superuser.receiver.roshni.0.0.0@gmail.com"
        # password_receiver = "superuser456"

        agency = record['Unique Pole No.'][0:2]

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
        date, time = get_date_time
        report_message = "A light pole has been reported with following details: [Lat, Lng]: " + str(lat) +", "+ str(lng) + ', date: ' + date + 'time: '+ time + ', CCMS_no: '+  str(CCMS_no) + ', Zone: '+ Zone+ ', Type_of_Light: '+  Type_of_Light + ', No_Of_Lights: ' + str(No_Of_Lights) + ', Wattage: ' + Wattage + ', Ward_No: ' + Ward_No + ', agency: ' + agency + ', unique_no: ' + unique_pole_no  + ', Connected Load: ' + str(Connected_Load) + ', Actual Load: '+ str(Actual_Load) + '|| Reported by: Phone No: ' + phone_no + 'Report Type: ' + report_type
        subject = "Light Reported"
        message = 'Subject: {}\n\n\n{}'.format(subject, report_message)
        port = 587 # For starttls
        smtp_server = "smtp.gmail.com"

        context = ssl.create_default_context()
        # with smtplib.SMTP(smtp_server, port) as server:
        #     server.ehlo()
        #     server.starttls(context = context)
        #     server.ehlo()
        #     server.login(sender_mail_id, password)
        #     server.sendmail(sender_mail_id, concerned_authority_mail, message)
        #     print("Admin notified by mail!")

        send_message(subject, report_message, FCMRegistrationTokenList)
        

    except Exception as e:
        print(e)
    finally:
        return get_all_reported_light()
 


@app.get("/report")
async def report(req: Request):

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']
        
    admin_credentials = {admin['agency']: {'Name': admin['Name'], 'Email': admin['Email'], 'agency': admin['agency'],'Ward_No': admin['Ward_No'], 'zone':admin['zone']} for admin in db["administration-details"].find() if admin['Email']}

    FCMRegistrationTokenList = list(set([admin['FCMRegistrationToken'] for admin in db['LoggedIn-Users'].find()]))
    
    
    request_args = dict(req.query_params)
    print(request_args)


    if 'pole_id' in request_args.keys():
        unique_pole_no = str(request_args['pole_id'])
    else:
        raise HTTPException(status_code=401, detail="Pole ID missing")

    if 'pole_id' in request_args.keys() and 'report_type' not in request_args.keys() and 'phone_no' not in request_args.keys():
        return generate_html_response(unique_pole_no)

    phone_no = str(request_args['phone_no'])
    report_type = str(request_args['report_type'])

    try:
        rows = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['zone'], 'agency':streetlight['agency'], 'unique_no':streetlight['unique_no'], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.':streetlight['Ward No.'] , 'Wattage':streetlight['Wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights if streetlight['Unique Pole No.']==unique_pole_no]
        record = rows[0]
        print("Reporting: ", record)
        date, time = get_date_time()
        # record = [{ 'Unique Pole No.':streetlight['Unique Pole No.']} for streetlight in all_lights if streetlight['Unique Pole No.']==unique_pole_no][0]
        db['reports'].insert_one({'date': date,'time': time, 'phone_no': phone_no, 'report_type': report_type, 'unique_pole_no' : unique_pole_no})

        sender_mail_id = "superuser.roshni.0.0.0@gmail.com"
        password = "superuser123"

        # initialised to universal mail id
        concerned_authority_mail = "superuser.receiver.roshni.0.0.0@gmail.com"
        # password_receiver = "superuser456"

        agency = record['Unique Pole No.'][0:2]

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
        date, time = get_date_time()
        report_message = "A light pole has been reported with following details: [Lat, Lng]: " + str(lat) +", "+ str(lng) + ', date: '+ date + ' time: '+ time + ', CCMS_no: '+  str(CCMS_no) + ', Zone: '+ Zone+ ', Type_of_Light: '+  Type_of_Light + ', No_Of_Lights: ' + str(No_Of_Lights) + ', Wattage: ' + Wattage + ', Ward_No: ' + Ward_No + ', agency: ' + agency + ', unique_no: ' + unique_pole_no  + ', Connected Load: ' + str(Connected_Load) + ', Actual Load: '+ str(Actual_Load) + '|| Reported by: Phone No: ' + phone_no + ' Report Type: ' + report_type
        subject = "Light Reported"
        message = 'Subject: {}\n\n\n{}'.format(subject, report_message)
        port = 587 # For starttls
        smtp_server = "smtp.gmail.com"

        print("reporting message: ", report_message)
        # context = ssl.create_default_context()
        # with smtplib.SMTP(smtp_server, port) as server:
        #     server.ehlo()
        #     server.starttls(context = context)
        #     server.ehlo()
        #     server.login(sender_mail_id, password)
        #     server.sendmail(sender_mail_id, concerned_authority_mail, message)
        #     print("Admin notified by mail!")

        send_message(subject, report_message, FCMRegistrationTokenList)
        

    except Exception as e:
        print(e)
        raise HTTPException(status_code=401, detail="Error in Reporting Light")

    return get_all_reported_light()


@app.get("/reports")
async def get_reports(user: _schemas.User = Depends(_services.get_current_user)):
    authenticate_user(user.email)
    return get_all_reported_light()


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
    FCMRegistrationTokenList = list(set([admin['FCMRegistrationToken'] for admin in db['LoggedIn-Users'].find()]))

    request_args = dict(req.query_params)

    if 'center' not in request_args or request_args['center'] == "":
        raise HTTPException(status_code=401, detail=" Centre of Region not defined!! ")

    center = request_args['center']
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
        date_of_reporting, time_of_reporting = get_date_time()
        for x in lights:
            db['reports'].insert_one({'date': date_of_reporting,'time': time_of_reporting, 'unique_pole_no' : light_data[(x[1],x[0])]['Unique Pole No.'], 'phone_no': phone_no, 'report_type': report_type})
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
            report_message = "\n Light poles have been reported in the agency at: " + ' date: '+ date_of_reporting + ' time: ' + time_of_reporting +'|| by: Phone No: ' + phone_no + 'Report Type: ' + report_type
            subject = "Light(s) Reported"
            message = 'Subject: {}\n\n{}'.format(subject, report_message)
            port = 587 # For starttls
            smtp_server = "smtp.gmail.com"

            context = ssl.create_default_context()
            # with smtplib.SMTP(smtp_server, port) as server:
            #     server.ehlo()
            #     server.starttls(context = context)
            #     server.ehlo()
            #     server.login(sender_mail_id, password)
            #     server.sendmail(sender_mail_id, concerned_authority_mail, message)

        print("Device IDs: ", FCMRegistrationTokenList)
        report_message = "Total "+ str(len(lights))+" lights have been reported at time: "+ date_of_reporting + ' ' + time_of_reporting
        send_message(subject, report_message, FCMRegistrationTokenList)

        print("Admin(s) notified!")

    except Exception as e:
        print("error message: ", e)
        raise HTTPException(status_code=401, detail="Error in Reporting Region")

    return get_all_reported_light()


@app.post("/resolveReport")
async def resolveReport(req: Request, user: _schemas.User = Depends(_services.get_current_user)):

    authenticate_user(user.email)
    request_args = await req.json()

    all_lights = [{'lng': streetlight['lng'], 'lat': streetlight['lat'], 'CCMS_no':streetlight['CCMS_no'], 'zone':streetlight['_id'][2:4], 'Type of Light':streetlight['Type of Light'], 'No. Of Lights':streetlight['No. Of Lights'], 'Ward No.': streetlight['_id'][4:7] , 'Wattage':streetlight['wattage'], 'Connected Load':streetlight['Connected Load'], 'Actual Load':streetlight['Actual Load'], 'Unique Pole No.':streetlight['_id'], 'agency': streetlight['_id'][0:2], 'unique_no': streetlight['_id'][7:]} for streetlight in db["streetlights"].find() if streetlight['_id']]
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    for light in all_lights:
        if light['CCMS_no'] in ccms_arr.keys():
            light['Connected Load'] = ccms_arr[light['CCMS_no']]['connected_load']
            light['Actual Load'] = ccms_arr[light['CCMS_no']]['actual_load']

    print("arguments: ", request_args, not request_args)

    if 'id' not in request_args or request_args['id'] == "":
        raise HTTPException(status_code=401, detail="No Pole selected to be resolved")
    
    ids = request_args['id']   
    comment = request_args['comment']

    try:
        print("ids:", ids)
        reported_lights = list(ids.split(','))

        for reported_light in reported_lights:
            resolved_light_data = db['reports'].find_one({'_id': ObjectId(reported_light)})
            
            if not resolved_light_data:
                print(f"Light with id \"{reported_light}\" not found")
                raise HTTPException(status_code=401, detail="All lights not reported..")
            print("\n\nLight being resolved ", resolved_light_data)
            db['reports'].delete_one({'_id': ObjectId(reported_light)})

            print("resolved_light_Data: ", resolved_light_data)
            resolved_light_data['Comments'] = comment
            date, time = get_date_time()
            resolved_light_data['resolved_date'] = date
            resolved_light_data['resolved_time'] = time
            del resolved_light_data['_id']
            print(resolved_light_data)
            db['resolved-reports'].insert_one(resolved_light_data)
    except Exception as e:
        print("error message: ", e)
        raise HTTPException(status_code=401, detail=" Oops!! Some error occurred while resolving report. ")

    return get_all_reported_light()

@app.get("/getResolvedReport")
async def getResolvedReport(user: _schemas.User = Depends(_services.get_current_user)):

    authenticate_user(user.email)
    return get_all_resolved_reported_light()


@app.post("/addLightsFile")
async def addLightsFile(file: UploadFile = File(...), user: _schemas.User = Depends(_services.get_current_user)):

    authenticate_user(user.email)
    try:
        df = pd.read_csv(file.file, dtype={'Unique Pole No.':str, 'Wattage':str})
        lampposts = []
        df_final_latlng = df[['Longitude', 'Latitude', 'CCMS NO', 'Zone', 'Type of Light', 'No. Of Lights', 'Ward No.' , 'Wattage', 'Unique Pole No.']]
        df_final_latlng = df_final_latlng.drop_duplicates(keep= 'last')
        df_final_latlng = df_final_latlng.dropna(subset=['Unique Pole No.','CCMS NO','Latitude','Longitude'])
        df_final_latlng = df_final_latlng.fillna('')
        temp = df_final_latlng.values.tolist()
        temp = map(lambda x : {'lat':x[1], 'lng':x[0], 'CCMS_no': x[2], 'zone': x[3], 'Type of Light':x[4], 'No. Of Lights':x[5], 'Ward No.':x[6], 'wattage': x[7],'Connected Load':-1, 'Actual Load':-1, '_id':x[8] }, temp)
        lampposts += temp
    except Exception as e:
        print("error message: ", e)
        raise HTTPException(status_code=401, detail=str(e))

    if(len(lampposts)!=0):
        db['streetlights'].insert_many(lampposts)
    else:
        raise HTTPException(status_code=401, detail="Oops! Could not add sheet data")

    return {'response': "successfully added csv"}
 

@app.post("/deleteLightsFile")
async def deleteLightsFile(file: UploadFile = File(...), user: _schemas.User = Depends(_services.get_current_user)):
    
    authenticate_user(user.email)
    try:
        df = pd.read_csv(file.file, dtype={'Unique Pole No.':str, 'Wattage':str})
        lampposts = []
        df_final_latlng = df[['Longitude', 'Latitude', 'CCMS NO', 'Zone', 'Type of Light', 'No. Of Lights', 'Ward No.' , 'Wattage', 'Unique Pole No.']]
        df_final_latlng = df_final_latlng.drop_duplicates(keep= 'last')
        df_final_latlng = df_final_latlng.dropna(subset=['Unique Pole No.'])
        df_final_latlng = df_final_latlng.fillna('')
        temp = df_final_latlng.values.tolist()
        temp = map(lambda x : {'lat':x[1], 'lng':x[0], 'CCMS_no': x[2], 'zone': x[3], 'Type of Light':x[4], 'No. Of Lights':x[5], 'Ward No.':x[6], 'wattage': x[7],'Connected Load':-1, 'Actual Load':-1, '_id':x[8] }, temp)
        lampposts += temp
        undeleted_poles_in_csv = []
        for pole in lampposts:
            d = db['streetlights'].delete_many({'_id':pole['_id']})
            if d.deleted_count == 0:
                undeleted_poles_in_csv.append(pole['_id'])
        
        if len(undeleted_poles_in_csv) > 0:
            error_detail = "Could not find poles with following IDs: " + str(undeleted_poles_in_csv)
            raise HTTPException(status_code=401, detail=error_detail)
        
    except Exception as e:
        print("error message: ", e)
        raise HTTPException(status_code=401, detail="Oops! Could not delete sheet data")

    return {'response': "successfully deleted all csv poles"}


@app.get("/place")
def get_latlng(req: Request):
    request_args = dict(req.query_params)
    if 'query' not in request_args or request_args['query'] == "":
        raise HTTPException(status_code=401, detail="No place defined")
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

@app.get("/icon_blue")
def get_icon():
    return FileResponse("blue.png")

@app.get("/icon2")
def get_icon2():
    return FileResponse("light.png")


# Utility functions for APIs

def send_message(title, message, FCMRegistrationTokenList, dataObj = None):
    # For mobile notifications to logged-in users!!

    try:
        print("Device ID List: ", FCMRegistrationTokenList)
        notification_message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title = title,
                body = message
            ),
        data=dataObj,
        tokens=FCMRegistrationTokenList,
        )
        response = messaging.send_multicast(notification_message)
        print('{0} messages were sent successfully'.format(response.success_count))
    except:
        raise HTTPException(status_code=401, detail="Some error occurred while sending notifications!")

def get_date_time():
    date_time = datetime.now(IST) 
    date, time = date_time.strftime("%d-%m-%Y"), date_time.strftime("%H:%M:%S")
    return date, time


def authenticate_user(email):
    db['LoggedIn-Users'].delete_many({'timestamp':{'$lte': datetime.now(IST) - timedelta(minutes=30)}})
    authenticated = db['LoggedIn-Users'].find_one({'email':email})
    # {'email':str(form_data.username), 'token':str(token['access_token'].decode("utf-8")), 'timestamp': datetime.now(IST),'FCMRegistrationToken': str(form_data.client_id)}
    li = [{'email': ccms_d['email'], 'timestamp': ccms_d['timestamp']} for ccms_d in db['LoggedIn-Users'].find()]
    print("\n\n\n"+str(datetime.now(IST))+"\n\n")
    for l in li:
        print(l)
    if not authenticated:
        raise HTTPException(status_code=401, detail="User not authenticated")


def get_all_reported_light():
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    reported_list = [{'date': report['date'],'time': report['time'], 'id':str(report['_id']), 'Phone No': report['phone_no'], 'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['reports'].find()]
    for report in reported_list:
        light_record = db['streetlights'].find_one({'_id':report['unique_pole_no']})
        report['lng'] = light_record['lng']
        report['lat'] = light_record['lat']
        report['CCMS_no']=  light_record['CCMS_no']
        report['zone']= light_record['_id'][2:4]
        report['Type_of_Light'] = light_record['Type of Light'] 
        report['No_Of_Lights'] = light_record['No. Of Lights']
        report['Wattage'] = light_record['wattage']
        report['Ward_No'] = light_record['_id'][4:7]
        if light_record['CCMS_no'] in ccms_arr.keys():
            report['Connected Load'] = ccms_arr[light_record['CCMS_no']]['connected_load']
            report['Actual Load'] = ccms_arr[light_record['CCMS_no']]['actual_load']
        report['agency'] = light_record['_id'][0:2]
        report['unique_no'] = light_record['_id'][7:]

    return reported_list

def get_all_resolved_reported_light():
    ccms_arr={ccms_d['ccms_no']: {'s_no': ccms_d['s_no'], 'ccms_no': ccms_d['ccms_no'], 'actual_load': ccms_d['actual_load'], 'ZONE': ccms_d['ZONE'], 'vendor_name': ccms_d['vendor_name'], 'connected_load': ccms_d['connected_load'], 'address': ccms_d['address']} for ccms_d in db["ccms"].find() if ccms_d['ccms_no']} 
    
    resolved_report_list = [{'id':str(report['_id']), 'Phone No': report['phone_no'],'date': report['date'], 'time': report['time'], 'resolved_time': report['resolved_time'] ,'resolved_date': report['resolved_date'], 'Comments': report['Comments'],'Report Type': report['report_type'], 'unique_pole_no' : report['unique_pole_no']} for report in db['resolved-reports'].find()]
    for report in resolved_report_list:
        light_record = db['streetlights'].find_one({'_id':report['unique_pole_no']})
        report['lng'] = light_record['lng']
        report['lat'] = light_record['lat']
        report['CCMS_no']=  light_record['CCMS_no']
        report['zone']= light_record['_id'][2:4]
        report['Type_of_Light'] = light_record['Type of Light'] 
        report['No_Of_Lights'] = light_record['No. Of Lights']
        report['Wattage'] = light_record['wattage']
        report['Ward_No'] = light_record['_id'][4:7]
        if light_record['CCMS_no'] in ccms_arr.keys():
            report['Connected Load'] = ccms_arr[light_record['CCMS_no']]['connected_load']
            report['Actual Load'] = ccms_arr[light_record['CCMS_no']]['actual_load']
        report['agency'] = light_record['_id'][0:2]
        report['unique_no'] = light_record['_id'][7:]  
    return resolved_report_list


def generate_html_response(unique_pole_no):
    html_content = """
    <html>
        <head>
            <title>Reporting Light</title>
                <script type="text/javascript">
                function reportLight() {
                    var issue = ''
                    if(document.getElementById('not working').checked)
                    {
                        issue += document.getElementById('not working').value
                    }
                    if(document.getElementById('dim').checked)
                    {
                        issue += document.getElementById('dim').value
                    }
                    if(document.getElementById('pole_tilted').checked)
                    {
                        issue += document.getElementById('pole_tilted').value
                    }
                    issue += document.getElementById('Other').value
                    var contact = document.getElementById('Contact_Number').value
                    let request = `/report?pole_id=""" + unique_pole_no+ """&phone_no=${contact}&report_type=${issue}`
                    fetch(request)
                        .then((response) => {
                            if(response.status == 200) {
                                console.log("reported light from html page...")
                                console.log(response)
                                console.log(issue)
                                document.getElementById('reporting_status').innerHTML = 'Light has been reported succesfully!! ';
                            }
                        }).catch(() => {
                            document.getElementById('reporting_status').innerHTML = 'Some error occurred!! ';
                        })
                }
            </script>
        </head>
        <body>
            <form action="javascript:checking() name=reportform">
                <label>Pole ID: </label>
                <label>&nbsp;""" + unique_pole_no+ """</label><br><br>
                <input type="checkbox" id="not working" value=" Not Working ">
                <label for="not working"> Report: not working</label><br>
                <input type="checkbox" id="dim" value=" Dim ">
                <label for="dim">Report: dim</label><br>
                <input type="checkbox" value=" Pole is tilted " id="pole_tilted">
                <label for="Pole is tilted"> Report: Pole is tilted</label><br><br>
                <input type="text" id="Other" name="Other" placeholder="Other">
                <input type="text" id="Contact_Number" name="Contact_Number" placeholder="Contact Number"><br><br>
                <button onclick="reportLight()">Report Light</button><br><br>
                <label id="reporting_status"></label>
            </form>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)
