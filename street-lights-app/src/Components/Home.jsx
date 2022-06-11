import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import Map from './Map';
import Input from "./Input"

import React, { useState } from 'react';

function Home({lights, poleData}) {
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
  const [showLiveData, setShowLiveData] = useState(false);
  const [showOtherData, setShowOtherData] = useState(false);
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
  const[poleInfo, setPoleInfo] = useState(null);

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
      console.log(data);
      console.log(routeLights);
      console.log(routes);

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
     
          setPerpendiculars(response.data['perpendiculars'].map(position => new window.google.maps.LatLng(position)));
          setDarkDistances(response.data['dark_spot_distances']);
          setDarkbounds(response.data['dark_route_bounds'])
          setDarkroutes(response.data['dark_routes']);
      }
    })

  }

  window.sayHello=function(poleId){
    console.log(poleId);
    console.log(poleData[poleId])
    setPoleInfo(poleData[poleId][0])

  }

  function markerPoleHandler(marker, positions, map){

    

    let pole_ids = []
    for(let i=0; i<positions.length; i++){
      pole_ids.push('<button class="poleIdButton" onmouseover="sayHello(' + positions[i]["Unique Pole No."]+')">' + positions[i]["Unique Pole No."] + '</button><br>')
      
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

  function onMarkerClick(marker, position, map) {

    console.log(typeof(position['Unique Pole No.']))
    let id = `${marker.position.lat()},${marker.position.lng()}`;
    const infowindow = new window.google.maps.InfoWindow({
        content: `<div>
            <div>Latitude: ${marker.position.lat()}</div>
            <div>Longitude: ${marker.position.lng()}</div>
            <div>CCMS No.: ${position['CCMS NO']}</div>
            <div>Type of Light: ${position['Type of Light']}</div>
            <div>No. Of Lights: ${position['No. Of Lights']}</div>
            <div>Wattage: ${parseInt(position['Wattage'])}</div>
            <div>Connected Load: ${position['Connected Load']!=-1?position['Connected Load']:0}</div>
            <div>Actual Load: ${position['Actual Load']!=-1?position['Actual Load']:0}</div>
            <div>Unique Pole No.: ${position['Unique Pole No.']}</div>
            <div>Agency: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(0,2):''}</div>
            <div>Zone: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(2,4):position['Zone']}</div>
            <div>Ward No.: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(4,7):position['Ward No.']}</div>
            <div>Unique No.: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(7,):""}</div>
            
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
        showAllStreetLights={showAllStreetLights}
        setShowLiveData={setShowLiveData}
        showLiveData={showLiveData}
        setShowOtherData = {setShowOtherData}
        showOtherData = {showOtherData}
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
        poleInfo = {poleInfo}
      />
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
          onMarkerClick={onMarkerClick}
          onMarkerClickPre={onMarkerClickPre}
          showLiveData={showLiveData}
          showOtherData={showOtherData}
        />
      </Wrapper>
    </div>
  );
}

export default Home;
