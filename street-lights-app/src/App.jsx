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
  const zoom = 18;
  const center = {lat: 28.5455,lng: 77.2731};
  const [lights, setLights] = useState([]);


  React.useEffect(() => {
    if(lights.length === 0) {
      const axios = require('axios');
      axios.get(`http://localhost:8000/streetlights`).then((response) => {
        if(response.status === 200) {
          setLights(response.data)
        }
      })
    }
  }, [lights])

  const [routeLights, setRouteLights] = useState([]);
  const [route, setRoute] = useState([]);
  const [src, setSrc] = useState("");
  const [dest, setDest] = useState("");
  const [plot, setPlot] = useState(0);
  const [counter, setCounter] = useState(0);
  const [directions, setDirections] = useState();


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
            setRouteLights(response.data['route_lights']);
            setDirections(1);
            setRoute(response.data['route']);
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
      >
        <Input 
          src = {src}
          setSrc = {setSrc}
          dest = {dest}
          setDest = {setDest}
          plot = {plot}
          setPlot = {setPlot}
          counter = {counter}
        />

          <Map 
          center={center}
          zoom={zoom}
          className="Map"
          markerPositions={routeLights}
          src = {src}
          dest = {dest}
          route = {route}
          plot = {plot}
          setCounter = {setCounter}
          directions = {directions}

        >
        </Map>

        <Map 
          center={center}
          zoom={zoom}
          className="Map"
          markerPositions={lights}
          plot = {plot}
          setCounter = {setCounter}
        >
        </Map>
      </Wrapper>
    </div>
  );
}

export default App;
