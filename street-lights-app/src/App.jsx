import logo from './logo.svg';
import './App.css';
import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import Map from './Components/Map';
import Input from "./Components/Input"

import React, { useState } from 'react';

function App() {
  const render = (status) => {
    return <h1>{status}</h1>;
  };
  const zoom = 11;
  const center = {lat: 28.6,lng: 77.15};
  const [lights, setLights] = useState([]);

  React.useEffect(() => {
    if(lights.length === 0) {
      const axios = require('axios');
      axios.get(`http://localhost:8000/streetlights`).then((response) => {
        if(response.status === 200) {
          setLights(response.data.map(position => new window.google.maps.LatLng(position)))
          console.log(response.data.length);
        }
        
      })
    }
  }, [lights])

  const [routeLights, setRouteLights] = useState([]);
  const [perpendiculars, setPerpendiculars] = useState([]);
  const [route, setRoute] = useState([]);
  const [bounds, setBounds] = useState({});
  const [darkroutes, setDarkroutes] = useState([]);
  const [darkbounds, setDarkbounds] = useState({});
  const [src, setSrc] = useState("");
  const [dest, setDest] = useState("");
  const [plot, setPlot] = useState(0);
  const [darkDistances, setDarkDistances] = useState([]);


  React.useEffect(() => {
    if(plot)
    {
        const axios = require('axios');
        axios.get(`http://localhost:8000/route`, {
          params: {
          source: src,
          destination: dest,
        },
      }).then((response) => {
          if(response.status === 200) {
            setRouteLights(response.data['route_lights'].map(position => new window.google.maps.LatLng(position)));
            setBounds(response.data['bounds']);
            setRoute(response.data['route'].map(position => new window.google.maps.LatLng(position)));
            // setDarkroutes(response.data['dark_routes'].map(position => new window.google.maps.LatLng(position)))
             setDarkroutes(response.data['dark_routes']);
             setPerpendiculars(response.data['perpendiculars'].map(position => new window.google.maps.LatLng(position)));
             setDarkDistances(response.data['dark_spot_distances']);
            setDarkbounds(response.data['dark_route_bounds'])
            
          }
        })
    } 
  }, [plot])



  return (
    <div className="App">
      <header className="App-header">
        Roshni: Women's Safety
      </header>
      <Wrapper  
        className="Wrapper"
        apiKey={env.GOOGLE_MAPS_API_KEY} render={render}
        libraries={['visualization']}
      >
        <Input 
          src = {src}
          setSrc = {setSrc}
          dest = {dest}
          setDest = {setDest}
          plot = {plot}
          setPlot = {setPlot}
        />

          <Map 
          center={center}
          zoom={zoom}
          className="Map"
          markerPositions={routeLights}
          route = {route}
          bounds = {bounds}
        >
        </Map>

        <Map 
          center={center}
          zoom={zoom}
          className="Map"
          markerPositions={lights}
          heatmapData={lights}
        >
        </Map>

        <Map 
          center={center}
          zoom={zoom}
          className="Map"
          markerPositions={perpendiculars}
          darkroutes = {darkroutes}
          darkbounds = {darkbounds}
          darkDistances = {darkDistances}
        >
        </Map>
      </Wrapper>
    </div>
  );
}

export default App;
