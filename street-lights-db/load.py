import pandas
import pymongo
import numpy as np

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]
streetlights = db["streetlights"]
ccms = db["ccms"]
reports = db["reports"]
resolved_report = db['resolved-reports']
streetlights.drop()
reports.drop()
resolved_report.drop()
ccms.drop()

for x in streetlights.find()[:10]:
    print(x)
print(sum([1 for x in streetlights.find()]))

csv_files = ['./data/Najafgarh-1.csv', './data/Najafgarh-2.csv', './data/South-1.csv', './data/South-2.csv', './data/West-1.csv', './data/West-2.csv', './data/West-3.csv', './data/West-4.csv','./data/Central-1.csv', './data/Central-2.csv', './data_new/Najafgarh-1.csv', './data_new/Najafgarh-2.csv', './data_new/South-1.csv', './data_new/South-2.csv', './data_new/West-1.csv', './data_new/West-2.csv', './data_new/West-3.csv', './data_new/West-4.csv','./data_new/Central-1.csv', './data_new/Central-2.csv', './data_new/West-12.csv','./data_new/West-22.csv', './data/Added Lights.csv'] 
excel_files = ['./data_final/Final_Merged_Data_Zone_wise_Najafgarh.xlsx', './data_final/Final_Merged_Data_Zone_wise_South.xlsx', './data_final/Final_Merged_Data_Zone_wise_West.xlsx']

lampposts = []
streetlights_dfs = []

deletedLights = pandas.read_csv('./data/Deleted Lights.csv')


for file in csv_files:
    streetlights_dfs.append(pandas.read_csv(file))

for file in excel_files:
    dfs = pandas.read_excel(file, sheet_name = None) # read all sheets
    for sheet in dfs.keys():
        streetlights_dfs.append(dfs[sheet])


df_final = pandas.concat(streetlights_dfs)
df_final_latlng = df_final[['Longitude', 'Latitude', 'CCMS NO', 'Zone', 'Type of Light', 'No. Of Lights', 'Ward No.' , 'Wattage.1', 'Connected Load']]
df_final_latlng = df_final_latlng.drop_duplicates(subset=['Longitude', 'Latitude'], keep= 'last')
df_final_latlng = df_final_latlng.dropna(subset=['Longitude', 'Latitude'])


df_final_latlng = pandas.concat([df_final_latlng, deletedLights, deletedLights]).drop_duplicates(keep=False)
df_final_latlng = df_final_latlng.dropna(subset=['Longitude', 'Latitude'])

df_final_latlng = df_final_latlng.fillna('')

temp = df_final_latlng.values.tolist()
temp = map(lambda x : {'lat':x[1], 'lng':x[0], 'CCMS_no': x[2], 'zone': x[3], 'Type of Light':x[4], 'No. Of Lights':x[5], 'Ward No.':x[6], 'wattage': x[7],'Connected Load':-1, 'Actual Load':-1 }, temp)
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

