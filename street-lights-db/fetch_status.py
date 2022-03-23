from time import sleep
import requests
import json
import pymongo
import socket
import requests.packages.urllib3.util.connection as urllib3_cn

urllib3_cn = socket.AF_INET6


myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]
ccms = db["ccms"]


URL = 'http://103.42.91.251:32210/eesl/api/getBsesRecords'
def fetch():
    data = requests.get(URL).content
    data = json.loads(data)
    data = data['data']
    return data

def insert(data):
    for i in range(len(data)):
        ccms_id = data[i]['ccms_no'][0:8]+"W"+data[i]['ccms_no'][9:]

        data[i]['ccms_no'] = ccms_id
    ccms.insert_many(data)

while True:
    data = fetch()
    ccms.drop()
    insert(data)

    print('updated')
    sleep(1000)
