import logo from './logo.svg';
import './App.scss';
import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import Map from './Components/Map';
import Input from "./Components/Input"

import React, { useState } from 'react';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

function App() {
  const render = (status) => {
    return <h1>{status}</h1>;
  };
  const zoom = 11;
  const center = {lat: 28.6,lng: 77.15};
  const [lights, setLights] = useState([]);
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(false)

  const [perpendiculars, setPerpendiculars] = useState([]);
  const [darkroutes, setDarkroutes] = useState([]);
  const [darkbounds, setDarkbounds] = useState({});
  const [showAllStreetLights, setShowAllStreetLights] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [src, setSrc] = useState("");
  const [dest, setDest] = useState("");
  const [darkDistances, setDarkDistances] = useState([]);

  React.useEffect(() => {
    if(lights.length === 0) {
      const axios = require('axios');
      setLoading(true);
      axios.get(`http://localhost:8000/streetlights`).then((response) => {
        setLoading(false);
        if(response.status === 200) {
          setLights(response.data.map(position => new window.google.maps.LatLng(position)))
          console.log(response.data.length);
        }
      })
    }
  }, [lights])


  function fetchRouteData() {
    if(!src || !dest) return;
    const axios = require('axios');
    setLoading(true);
    axios.get(`http://localhost:8000/route`, {
      params: {
        source: src,
        destination: dest,
      },
    }).then((response) => {
      setLoading(false);
      if(response.status === 200) {
        // setDarkroutes(response.data['dark_routes'].map(position => new window.google.maps.LatLng(position)))
          setDarkroutes(response.data['dark_routes']);
          setPerpendiculars(response.data['perpendiculars'].map(position => new window.google.maps.LatLng(position)));
          setDarkDistances(response.data['dark_spot_distances']);
        setDarkbounds(response.data['dark_route_bounds'])
        setRouteData({
          routeLights: response.data['route_lights'].map(position => new window.google.maps.LatLng(position)),
          bounds: response.data['bounds'],
          route: response.data['route'].map(position => new window.google.maps.LatLng(position))
        })
        
      }
    })
  }

  return (
    <div className="App">
      <AppBar>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Roshni: Women's Safety
          </Typography>
        </Toolbar>
      </AppBar>
      <div className='App-body'>
        <Input 
          setShowAllStreetlights={setShowAllStreetLights}
          setShowHeatmap={setShowHeatmap}
          setShowRoute={setShowRoute}
          showRoute={showRoute}
          setSrc = {setSrc}
          setDest = {setDest}
          fetchRouteData={fetchRouteData}
          loading={loading}
        />
        <Wrapper  
          className="Wrapper"
          apiKey={env.GOOGLE_MAPS_API_KEY} render={render}
          libraries={['visualization']}
        >
          <Map 
            center={center}
            zoom={zoom}
            className="Map"
            heatmapData={showHeatmap ? lights : null}
            clustererData={showAllStreetLights ? lights : []}
            routeData={showRoute? routeData: null}
          />
        </Wrapper>

      </div>
    </div>
  );
}

export default App;
