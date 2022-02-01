
import React from 'react';
import {KmeansAlgorithm, MarkerClusterer} from '@googlemaps/markerclusterer'
import env from "react-dotenv";

function Map({children, className, center, zoom, clustererData, routeData, route, heatmapData, bounds, darkroutes, darkbounds, darkDistances, plot}) {

    const ref = React.useRef(null);
    const [map, setMap] = React.useState();
    const clusterer = React.useRef();
    const heatmap = React.useRef();
    const routePlot = React.useRef();
    const darkRef = React.useRef();
    const darkPlot = React.useRef();
    


    React.useEffect(() => {
        if (ref.current && !map) {
            setMap(new window.google.maps.Map(ref.current, {mapTypeId: 'roadmap'}));          
        }
    }, [ref, map]);

    React.useEffect(() => {
        if(map) {
            map.setOptions({center, zoom})
        }
    }, [map, center, zoom])

    // plot heatmap if heatmapData supplied
    React.useEffect(() => {
        if(heatmap.current) heatmap.current.setMap(null);
        if(!heatmapData) return;
        heatmap.current = new window.google.maps.visualization.HeatmapLayer({map, data: heatmapData});
    }, [map, heatmapData])

    // plot clusterer if clustererData supplied
    React.useEffect(() => {
        if(clusterer.current) clusterer.current.setMap(null);
        if(!clustererData) return;
            var markers = clustererData.map(position => new window.google.maps.Marker({position, icon: env.BACKEND+"/icon"}));
            clusterer.current = new MarkerClusterer({
                map, 
                markers, 
                algorithm: new KmeansAlgorithm({
                    maxZoom: 25, 
                    numberOfClusters: (count, zoom) => count < 200 ? count : Math.max(1, zoom - 8)
                })
            });
    }, [map, clustererData])
    
    //plot route, neighbourin streetlights and dark regions if routeData supplied
    React.useEffect(() => {
        if(routePlot.current) {
            routePlot.current.polyline.setMap(null);
            routePlot.current.A.setMap(null);
            routePlot.current.B.setMap(null);
            routePlot.current.routeLights.forEach(routeLight => {
                routeLight.setMap(null);
            });
        }
        if(!routeData) return;
        routePlot.current = {
            polyline: new window.google.maps.Polyline({map, path: routeData.route, strokeColor: 'DodgerBlue'}),
            A: new window.google.maps.Marker({map, position: routeData.route[0], label: 'A'}),
            B: new window.google.maps.Marker({map, position: routeData.route[routeData.route.length - 1], label: 'B'}),
            routeLights: routeData.routeLights.map(position => new window.google.maps.Marker({map, position, icon: env.BACKEND+"/icon"}))        
        };
        map.fitBounds(
            new window.google.maps.LatLngBounds(
                routeData.bounds.southwest, 
                routeData.bounds.northeast
            )
        );
        
        
  
    }, [map, routeData])


    React.useEffect(() => {
        if(darkPlot.current){
            darkPlot.current.paths.forEach(path=> {
                path.setMap(null);
            });
            darkPlot.current.darkSpots.forEach(darkSpot => {
                darkSpot.setMap(null);
            });
        }
        if(!darkroutes){
            
            return;
        } 
        var darkRoutesFinal = []
        for(let i=0;i<darkroutes.length;i++){
            var darkRoutesTemp = []
            for(let j=0; j<darkroutes[i].length; j++){
                darkRoutesTemp[j] = new window.google.maps.LatLng(darkroutes[i][j])
            }
            darkRoutesFinal[i]=darkRoutesTemp;
        }

        darkPlot.current = {
            paths :[],
            darkSpots: []
        }
        
        for(let i = 0; i<darkRoutesFinal.length;i++){

           
            var darkPath = new window.google.maps.Polyline({
                path: darkRoutesFinal[i],
                geodesic: true,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 4,
                });
        
                darkPath.setMap(map);
            darkPlot.current.paths.push(darkPath);

        }
       
        for(let i=0; i<darkroutes.length; i++){
            const marker1 = new window.google.maps.Marker({
                position: darkroutes[i][0],
                icon: env.BACKEND+"/icon2",
                map
              });
              const marker2 = new window.google.maps.Marker({
                position: darkroutes[i][darkroutes[i].length-1],
                icon: env.BACKEND+"/icon2",
                map
              });

             
            const contentString = `<div id="content"><p>Distance to the next pole <br><h1>${darkDistances[i].toFixed(2)}m </h1></div>`;;
            const infowindow = new window.google.maps.InfoWindow({
                content: contentString

                });
                
                new window.google.maps.event.addListener(marker1, 'click', function () {
                infowindow.open(map, marker1);

            });
           

            darkPlot.current.darkSpots.push(marker1);
            darkPlot.current.darkSpots.push(marker2);
          
    
            

        }


    }, [map, darkroutes])

    return (
        <>
        <div ref={ref} className={className} />
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                return React.cloneElement(child, { map });
                }
            })}
        </>
    );
};

export default Map;

//Testing polylines
// 28.595233929736626 77.08882146289189
// 28.59586331072582 77.08783862983469
// 28.59610935666011 77.08881740159825
