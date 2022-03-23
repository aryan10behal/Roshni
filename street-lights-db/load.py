import pandas
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]
streetlights = db["streetlights"]
ccms = db["ccms"]
reports = db["reports"]
streetlights.drop()
reports.drop()
ccms.drop()

for x in streetlights.find()[:10]:
    print(x)
print(sum([1 for x in streetlights.find()]))

files = ['./data_final/Final Merged Data Zone wise-South.csv']

lampposts = []
streetlights_dfs = []

deletedLights = pandas.read_csv('./data/Deleted Lights.csv')


for file in files:
    streetlights_dfs.append(pandas.read_csv(file))

df_final = pandas.concat(streetlights_dfs)
df_final_latlng = df_final[['Longitude', 'Latitude', 'CCMS NO', 'Zone', 'Type of Light', 'No. Of Lights', 'Ward No.' ,'Connected Load']]
df_final_latlng = df_final_latlng.drop_duplicates(keep= 'last')
df_final_latlng = df_final_latlng.dropna(subset=['Longitude', 'Latitude'])

df_final_latlng = pandas.concat([df_final_latlng, deletedLights, deletedLights]).drop_duplicates(keep=False)
df_final_latlng = df_final_latlng.dropna(subset=['Longitude', 'Latitude'])

df_final_latlng = df_final_latlng.fillna('')

temp = df_final_latlng.values.tolist()
temp = map(lambda x : {'lat':x[1], 'lng':x[0], 'CCMS_no': x[2], 'zone': x[3], 'Type of Light':x[4], 'No. Of Lights':x[5], 'Ward No.':x[6], 'wattage': x[7],'Connected Load':0, 'Actual Load':0 }, temp)
lampposts += temp

# for file in files:
#     df = pandas.read_csv(file)
#     df = df[['Longitude', 'Latitude']]
#     df = df.dropna()
#     temp = df.values.tolist()
#     temp = map(lambda x : {'lng': x[0], 'lat': x[1]}, temp)
#     lampposts += temp



streetlights.insert_many(lampposts)
print(sum([1 for x in streetlights.find()]))

for x in streetlights.find()[:10]:
    print(x)


