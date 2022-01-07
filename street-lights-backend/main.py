from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse

load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json'

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


@app.get("/streetlights")
def read_item():
    return [{'lng': streetlight['lng'], 'lat': streetlight['lat']} for streetlight in db["streetlights"].find() if streetlight['lng'] and streetlight['lat']]

@app.get("/route")
def get_route(source, destination):
    data = requests.get(DIRECTIONS_API + '?origin=' + source + '&destination=' + destination + '&key=' + GOOGLE_MAPS_API_KEY).json()
    route = [point['start_location'] for point in data['routes'][0]['legs'][0]['steps']]
    return route

@app.get("/icon")
def get_icon():
    return FileResponse("light.png")