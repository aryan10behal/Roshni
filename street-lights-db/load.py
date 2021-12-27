import pandas
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

db = myclient["street-lights-db"]
streetlights = db["streetlights"]
streetlights.drop()

for x in streetlights.find()[:10]:
    print(x)
print(sum([1 for x in streetlights.find()]))

files = ['./data/Najafgarh-1.csv', './data/Najafgarh-2.csv', 
	'./data/South-1.csv', './data/South-2.csv', 
	'./data/West-1.csv', './data/West-2.csv', './data/West-3.csv', './data/West-4.csv',
	'./data/Central-1.csv', './data/Central-2.csv'
	]

lampposts = []

for file in files:
    df = pandas.read_csv(file)
    df = df[['Longitude', 'Latitude']]
    df = df.dropna()
    temp = df.values.tolist()
    temp = map(lambda x : {'lng': x[0], 'lat': x[1]}, temp)
    lampposts += temp
streetlights.insert_many(lampposts)
print(sum([1 for x in streetlights.find()]))

for x in streetlights.find()[:10]:
    print(x)
