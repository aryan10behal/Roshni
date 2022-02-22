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

Go to backend folder

```
cd street-lights-backend
```

To create database for Users (authentication), Run the following in python console
```
import services
services.create_database()
exit()
```

Start the backend in development mode by running 
```
uvicorn main:app --reload --host 0.0.0.0
```
Start the backend in production mode using
```
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind=0.0.0.0
```

## Frontend
To run the frontend in development mode use
```
cd street-lights-app
npm start
```
To run the frontend in production mode, use
```
npm run build
serve -s build -p 8080
```
