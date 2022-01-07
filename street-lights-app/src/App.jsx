import logo from './logo.svg';
import './App.css';
import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import Map from './Components/Map';
import React, { useState } from 'react';



function App() {
  const render = (status) => {
    return <h1>{status}</h1>;
  };
  const zoom = 18;
  const center = {lat: 28.595304,lng: 77.088783};
  const [lights, setLights] = useState([]);

  React.useEffect(() => {
    if(lights.length === 0) {
      const axios = require('axios');
      axios.get(`http://localhost:8000/streetlights`).then((response) => {
        if(response.status === 200) {
          setLights(response.data)
          // setLights(response.data.slice(0, 10000))
        }
      })
    }
  }, [lights])

  return (
    <div className="App">
      <header className="App-header">
        Delhi Street Lights Map
      </header>
      <Wrapper  
        className="Wrapper"
        apiKey={env.GOOGLE_MAPS_API_KEY} render={render}
      >
        <Map 
          center={center}
          zoom={zoom}
          className="Map"
          markerPositions={lights}
        >
        </Map>
      </Wrapper>
    </div>
  );
}

export default App;
