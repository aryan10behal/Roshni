
import React from 'react';
import {KmeansAlgorithm, MarkerClusterer} from '@googlemaps/markerclusterer'
  

function Map({children, style, className, center, zoom, markerPositions, route, heatmapData, bounds, darkroutes, darkbounds, darkDistances}) {

    const ref = React.useRef(null);
    const [map, setMap] = React.useState();
    const clusterer = React.useRef();
    const heatmap = React.useRef();
    const routePlot = React.useRef();
    
    // const darkRoutePlot = React.useRef([]);

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

    React.useEffect(() => {
        if(!darkDistances){
            var markers = markerPositions.map(position => new window.google.maps.Marker({position, icon: "http://localhost:8000/icon"}));
            if(clusterer.current) clusterer.current.setMap(null);
            clusterer.current = new MarkerClusterer({
            map, 
            markers, 
            algorithm: new KmeansAlgorithm({
                maxZoom: 25, 
                numberOfClusters: (count, zoom) => count < 200 ? count : Math.max(1, zoom - 8)
            })
        });

        }
        
    }, [map, markerPositions])

    React.useEffect(() => {
        if(!heatmapData) return;
        if(heatmap.current) heatmap.current.setMap(null);
        heatmap.current = new window.google.maps.visualization.HeatmapLayer({map, data: heatmapData});
    }, [map, heatmapData])

    
    React.useEffect(() => {
        if(!darkroutes || !darkroutes.length || !darkbounds) return;
      
       
        var darkRoutesFinal = []
        for(let i=0;i<darkroutes.length;i++){
            var darkRoutesTemp = []
            for(let j=0; j<darkroutes[i].length; j++){
                darkRoutesTemp[j] = new window.google.maps.LatLng(darkroutes[i][j])
            }
            darkRoutesFinal[i]=darkRoutesTemp;
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

        }
       
       
        for(let i=0; i<darkroutes.length; i++){
            const marker1 = new window.google.maps.Marker({
                position: darkroutes[i][0],
                icon: "http://localhost:8000/icon",
                map
              });
              const marker2 = new window.google.maps.Marker({
                position: darkroutes[i][darkroutes[i].length-1],
                icon: "http://localhost:8000/icon",
                map
              });

             
                const contentString = `<div id="content"><p>Distance to the next pole <br><h1>${darkDistances[i]} </h1></div>`;;
                const infowindow = new window.google.maps.InfoWindow({
                    content: contentString
    
                  });
                  
                  new window.google.maps.event.addListener(marker1, 'click', function () {
                    infowindow.open(map, marker1);
                });

              
            

        }

  
    }, [map, darkroutes, darkbounds, markerPositions])


    React.useEffect(() => {
        if(!route || !route.length || !bounds) return;
        if(routePlot.current) {
            routePlot.current.polyline.setMap(null);
            routePlot.current.A.setMap(null);
            routePlot.current.B.setMap(null);
        }

        routePlot.current = {
            polyline: new window.google.maps.Polyline({map, path: route, strokeColor: 'DodgerBlue'}),
            A: new window.google.maps.Marker({map, position: route[0], label: 'A'}),
            B: new window.google.maps.Marker({map, position: route[route.length - 1], label: 'B'}),
        };
        map.fitBounds(
            new window.google.maps.LatLngBounds(
                bounds.southwest, 
                bounds.northeast
            )
        );
    }, [map, route, bounds])

    return (
        <>
        <div ref={ref} className={className} style={style} />
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
