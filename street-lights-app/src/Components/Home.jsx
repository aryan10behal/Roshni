import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import Map from './Map';
import Input from "./Input"

import React, { useState, useRef } from 'react';
import { Checkbox, CircularProgress, FormControlLabel, Slider, TextField, Typography, Radio, FormControl, Select, InputLabel, MenuItem, Box } from "@mui/material";


function Home({lights, poleData}) {
  const render = (status) => {
    return <h1>{status}</h1>;
  };



  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState({lat: 28.6,lng: 77.15});

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

  //For seeing current pole data
  const [poleInfo, setPoleInfo]= useState([]);

  function fetchRouteData() {

    function positionData(position){

      var latLng = new window.google.maps.LatLng({'lng':position['lng'], 'lat':position['lat']});
      var positionData = {'LatLng': latLng, 'CCMS NO':position['CCMS_no'], 'Zone':position['zone'], 'Type of Light':position['Type of Light'], 'No. Of Lights':position['No. Of Lights'], 'Ward No.':position['Ward No.'] ,'Wattage':position['Wattage'],'Connected Load':position['Connected Load'], 'Actual Load':position['Actual Load'], 'Unique Pole No.':position['Unique Pole No.']};
      return positionData;
  }

    if(!src || !dest) return;
    const axios = require('axios');
    setLoading(true);
    fetch(env.BACKEND + `/route?source=${src}&destination=${dest}&darkRouteThreshold=${100}&distanceFromPath=${distanceFromStreet}`)
    .then(response => response.json())
    .then((data) => {
      setLoading(false);   
      let routeLights = [];
      let routes = [];
      for(let i = 0; i< data['num']; i++){
        data['route_'+String(i)]['route_lights'] = data['route_'+String(i)]['route_lights'].map(position => positionData(position));  
        data['route_'+String(i)]['route'] = data['route_'+String(i)]['route'].map(position => new window.google.maps.LatLng(position));
        routeLights.push(data['route_'+String(i)]['route_lights']);
        routes.push(data['route_'+String(i)]['route'])
      }
    
      setRouteData({
        
        routeLights: routeLights,
        bounds: data['route_'+String(data['best_route_index'])]['bounds'],
        route: routes,
        best_route_index: data['best_route_index']
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
        console.log(response.data)
          let best_route = response.data[`route_${response.data['best_route_index']}`]
          setPerpendiculars(best_route['perpendiculars'].map(position => new window.google.maps.LatLng(position)));
          setDarkDistances(best_route['dark_spot_distances']);
          setDarkbounds(best_route['dark_route_bounds'])
          setDarkroutes(best_route['dark_routes']);
      }
    })

  }

  window.poleInfoHandler=function(poleId){



    setPoleInfo(poleData[poleId][0])
    

  }

  function markerPoleHandler(marker, positions, map){

    

    let pole_ids = []
    for(let i=0; i<positions.length; i++){
  
      pole_ids.push('<button class="poleIdButton" onClick="poleInfoHandler('+"'"+(positions[i]["Unique Pole No."])+"'"+')">' + positions[i]["Unique Pole No."] + '</button><br>')

      
    }
    return pole_ids.join("");
  }
  

  function onMarkerClickPre(marker, positions, map){


    const infowindow = new window.google.maps.InfoWindow({

        content: `<div>
            <h4> Pole Ids: </h4>
            <div class = "PoleIds">
            ${markerPoleHandler(marker, positions, map)}
            </div>
               
        </div>`
    });
  

    infowindow.open({
      anchor: marker,
      map,
      shouldFocus: false,
  })
  
   
  };

  //To remove light info box
 React.useEffect(()=>{
  if(!showAllStreetLights || !showRoute){
    setPoleInfo([]);
  }
 }, [showAllStreetLights, showRoute])


  return (
    <div className='App-body'>
      <div className = "LeftBar"> 
      <Input 
        setShowAllStreetlights={setShowAllStreetLights}
        showAllStreetLights={showAllStreetLights}
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
      {poleInfo.length!=0?(
                            
        <div className="Selected-Light">
            <div className="PoleInfoHeader">Light Info</div>
            
            <div>Latitude: {poleInfo['LatLng'].lat()}</div>
            <div>Longitude: {poleInfo['LatLng'].lng()}</div>
            <div>CCMS No.: {poleInfo['CCMS NO']}</div>
            <div>Type of Light: {poleInfo['Type of Light']}</div>
            <div>No. Of Lights: {poleInfo['No. Of Lights']}</div>
            <div>Wattage: {parseInt(poleInfo['Wattage'])}</div>
            <div>Connected Load: {poleInfo['Connected Load']!=-1?poleInfo['Connected Load']:0}</div>
            <div>Actual Load: {poleInfo['Actual Load']!=-1?poleInfo['Actual Load']:0}</div>
            <div>Unique Pole No.: {poleInfo['Unique Pole No.']}</div>
            <div>Agency: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(0,2):''}</div>
            <div>Zone: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(2,4):poleInfo['Zone']}</div>
            <div>Ward No.: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(4,7):poleInfo['Ward No.']}</div>
            <div>Unique No.: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(7,):""}</div>
            
            </div>):""}

      </div>
      <Wrapper
        className="Wrapper"
        apiKey={env.GOOGLE_MAPS_API_KEY} render={render}
        libraries={['visualization', 'drawing']}
  
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
          darkbounds = {showDarkRoute?darkbounds:[]}
          onMarkerClickPre={onMarkerClickPre}

       
        />
      </Wrapper>
    </div>
  );
}

export default Home;
