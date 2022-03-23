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
  const [distanceFromStreetDark, setDistanceFromStreetDark] = React.useState(MIN_THRESH_ROUTE)

  function fetchRouteData() {

  //   function positionData(position){

  //     var latLng = new window.google.maps.LatLng({'lng':position['lng'], 'lat':position['lat']});
  //     var positionData = {'LatLng': latLng, 'CCMS NO':position['CCMS NO'], 'Zone':position['Zone'], 'Type of Light':position['Type of Light'], 'No. Of Lights':position['No. Of Lights'], 'Ward No.':position['Ward No.'] ,'Connected Load':position['Connected Load']};
  //     return positionData;
  // }

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
        distanceFromPath: distanceFromStreetDark,
       
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

  function onMarkerClick(marker, position, map) {
    let id = `${marker.position.lat()},${marker.position.lng()}`;
    const infowindow = new window.google.maps.InfoWindow({
        content: `<div>
            <div>Latitude: ${marker.position.lat()}</div>
            <div>Longitude: ${marker.position.lng()}</div>
            <div>CCMS No.: ${position['CCMS NO']}</div>
            <div>Zone: ${position['Zone']}</div>
            <div>Type of Light: ${position['Type of Light']}</div>
            <div>No. Of Lights: ${position['No. Of Lights']}</div>
            <div>Wattage: ${parseInt(position['Connected Load']/position['No. Of Lights'])}</div>
            <div>Connected Load: ${position['Connected Load']}</div>
            <div>status: ${marker.status ? "Not Working" : "Working"}</div>
        </div>`,
    });
    infowindow.open({
        anchor: marker,
        map,
        shouldFocus: false,
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
        distanceFromStreetDark={distanceFromStreetDark}
        setDistanceFromStreet={setDistanceFromStreet}
        setDarkStretchThreshold={setDarkStretchThreshold}
        setDistanceFromStreetDark={setDistanceFromStreetDark}
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
          onMarkerClick={onMarkerClick}
        />
      </Wrapper>
    </div>
  );
}

export default Home;
