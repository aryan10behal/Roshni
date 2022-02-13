import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import Map from './Map';
import Input from "./Input"

import React, { useState } from 'react';

function Home({lights}) {
  const render = (status) => {
    return <h1>{status}</h1>;
  };

  const zoom = 11;
  const center = {lat: 28.6,lng: 77.15};
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(false)

  const [perpendiculars, setPerpendiculars] = useState([]);
  const [darkroutes, setDarkroutes] = useState([]);
  const [darkbounds, setDarkbounds] = useState({});

  const [showAllStreetLights, setShowAllStreetLights] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showDarkRoute, setDarkRoute] = useState(false);

  const [src, setSrc] = useState("");
  const [dest, setDest] = useState("");
  const [srcDark, setSrcDark] = useState("");
  const [destDark, setDestDark] = useState("");
  const [darkDistances, setDarkDistances] = useState([]);

  const MIN_THRESH_DARK = 10;
  const MAX_THRESH_DARK = 1000;
  const [darkStretchThreshold, setDarkStretchThreshold] = React.useState(MIN_THRESH_DARK)

  const MIN_THRESH_ROUTE = 10;
  const MAX_THRESH_ROUTE = 500;
  const [distanceFromStreet, setDistanceFromStreet] = React.useState(MIN_THRESH_ROUTE)

  function fetchRouteData() {
    if(!src || !dest) return;
    const axios = require('axios');
    setLoading(true);
    fetch(env.BACKEND + `/route?source=${src}&destination=${dest}&darkRouteThreshold=${100}&distanceFromPath=${distanceFromStreet}`)
    .then(response => response.json())
    .then((data) => {
      setLoading(false);          
      setRouteData({
        routeLights: data['route_lights'].map(position => new window.google.maps.LatLng(position)),
        bounds: data['bounds'],
        route: data['route'].map(position => new window.google.maps.LatLng(position))
      })
    }).catch((e) => {
      setLoading(false);          
      console.log(e)
    }).catch((e) => {
      setLoading(false);          
      console.log(e)
    })
  }

  function fetchDarkRouteData(){
    if(!srcDark || !destDark) return;
    const axios = require('axios');
    setLoading(true);
    axios.get(env.BACKEND + `/route`, {
      params: {
        source: srcDark,
        destination: destDark,
        darkRouteThreshold: darkStretchThreshold,
        distanceFromPath: distanceFromStreet?distanceFromStreet:20
      },
    }).then((response) => {
      setLoading(false);
      if(response.status === 200) {
     
          

          setPerpendiculars(response.data['perpendiculars'].map(position => new window.google.maps.LatLng(position)));
          setDarkDistances(response.data['dark_spot_distances']);
          setDarkbounds(response.data['dark_route_bounds'])
          setDarkroutes(response.data['dark_routes']);
          
        
      }
    })

  }

  return (
    <div className='App-body'>
      <Input 
        setShowAllStreetlights={setShowAllStreetLights}
        setShowHeatmap={setShowHeatmap}
        setShowRoute={setShowRoute}
        showRoute={showRoute}
        setSrc = {setSrc}
        setDest = {setDest}
        setSrcDark = {setSrcDark}
        setDestDark = {setDestDark}
        fetchRouteData={fetchRouteData}
        fetchDarkRouteData={fetchDarkRouteData}
        loading={loading}
        setDarkRoute={setDarkRoute}
        showDarkRoute={showDarkRoute}
        distanceFromStreet={distanceFromStreet}
        darkStretchThreshold={darkStretchThreshold}
        setDistanceFromStreet={setDistanceFromStreet}
        setDarkStretchThreshold={setDarkStretchThreshold}
        MIN_THRESH_DARK={MIN_THRESH_DARK}
        MAX_THRESH_DARK={MAX_THRESH_DARK}
        MIN_THRESH_ROUTE={MIN_THRESH_ROUTE}
        MAX_THRESH_ROUTE={MAX_THRESH_ROUTE}
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
          darkroutes={showDarkRoute?darkroutes:[]}
          darkDistances = {showDarkRoute?darkDistances:[]}
        />
      </Wrapper>
    </div>
  );
}

export default Home;
