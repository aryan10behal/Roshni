from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]

app = FastAPI()

origins = [
    "http://localhost:3000",
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