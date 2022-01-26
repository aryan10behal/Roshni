import pandas
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]
streetlights = db["streetlights"]
streetlights.drop()

for x in streetlights.find()[:10]:
    print(x)
print(sum([1 for x in streetlights.find()]))

# files = ['./data/Najafgarh-1.csv', './data/Najafgarh-2.csv', 
# 	'./data/South-1.csv', './data/South-2.csv', 
# 	'./data/West-1.csv', './data/West-2.csv', './data/West-3.csv', './data/West-4.csv',
# 	'./data/Central-1.csv', './data/Central-2.csv'
# 	]

files = ['./data/Najafgarh-1.csv', './data/Najafgarh-2.csv', 
	'./data/South-1.csv', './data/South-2.csv', 
	'./data/West-1.csv', './data/West-2.csv', './data/West-3.csv', './data/West-4.csv',
	'./data/Central-1.csv', './data/Central-2.csv', './data_new/Najafgarh-1.csv', './data_new/Najafgarh-2.csv', 
	'./data_new/South-1.csv', './data_new/South-2.csv', 
	'./data_new/West-1.csv', './data_new/West-2.csv', './data_new/West-3.csv', './data_new/West-4.csv',
	'./data_new/Central-1.csv', './data_new/Central-2.csv', './data_new/West-12.csv','./data_new/West-22.csv']

lampposts = []
streetlights_dfs = []

for file in files:
    streetlights_dfs.append(pandas.read_csv(file))

df_final = pandas.concat(streetlights_dfs)
df_final_latlng = df_final[['Longitude', 'Latitude']]
df_final_latlng = df_final_latlng.drop_duplicates(keep= 'last')
df_final_latlng = df_final_latlng.dropna()
temp = df_final_latlng.values.tolist()
temp = map(lambda x : {'lng': x[0], 'lat': x[1]}, temp)
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


