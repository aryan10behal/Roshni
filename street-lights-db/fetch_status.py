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


# Add all APIs for live data here
URLs = ['http://103.42.91.251:32210/eesl/api/getBsesRecords', ' ']
def fetch():
    all_data = []
    for url in URLs:
        data = requests.get(url).content
        data = json.loads(data)
        all_data.extend(data['data'])
    return all_data

def insert(data):
    for i in range(len(data)):
        ccms_id = data[i]['ccms_no'][0:7]+"\\"+data[i]['ccms_no'][7:]
        data[i]['ccms_no'] = ccms_id
 
    ccms.insert_many(data)

while True:
    try:
        data = fetch()
        ccms.drop()
        insert(data)
       
        print('updated')
    except Exception as exception:
        print(exception)
    finally:
        sleep(1000)
