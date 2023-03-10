# womensafetyweb
The frontend and backend for the women safety project

## Database
Install mongodb and start a mongodb instance using 
```sudo mongod --fork --config /etc/mongod.conf```
For mac:
```
sudo pkill -f mongod
sudo mongod --config /usr/local/etc/mongod.conf --fork
```

To load the data into the mongodb instance, run 
```
cd street-lights-db
python3 load.py
python3 fetch_status.py
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

Current mode of Starting the backend in production mode using
```
sudo gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind=:8000 --certfile=/etc/letsencrypt/live/chcc.iiitd.ac.in/fullchain.pem --keyfile=/etc/letsencrypt/live/chcc.iiitd.ac.in/privkey.pem
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
cd street-lights-app
npm run build
sudo rm -r /var/www/html/projects/roshni/*
sudo cp -r build/* /var/www/html/projects/roshni/
sudo service apache2 restart
