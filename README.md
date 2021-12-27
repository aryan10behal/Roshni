# womensafetyweb
The frontend and backend for the women safety project

## Database
Install mongodb and start a mongodb instance using 
```sudo mongod --fork --config /etc/mongod.conf```

To load the data into the mongodb instance, run 
```
cd street-lights-db
python3 load.py
```

## Backend
Start the backend by running 
```
cd street-lights-backend
uvicorn main:app --reload
```

## Frontend
To run the frontend in development mode use
```
cd street-lights-app
npm start
```