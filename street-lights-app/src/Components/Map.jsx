import React from 'react';
import {KmeansAlgorithm, MarkerClusterer} from '@googlemaps/markerclusterer'
  

function Map({children, style, className, markerPositions, center, zoom, src, dest, plot, setCounter, directions}) {

    const directionsRenderer = new window.google.maps.DirectionsRenderer({routes: []});
    const directionsService = new window.google.maps.DirectionsService();

    const ref = React.useRef(null);
    const [map, setMap] = React.useState();
    const [path, setPath] = React.useState([]);
    const clusterer = React.useRef();

    directionsRenderer.setMap(map);

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
        var markers = markerPositions.map(position => new window.google.maps.Marker({position, icon: "http://localhost:8000/icon"}));
        if(clusterer.current) {
            console.log('removing')
            clusterer.current.setMap(null)
        }
        clusterer.current = new MarkerClusterer({
            map, 
            markers, 
            algorithm: new KmeansAlgorithm({
                maxZoom: 25, 
                numberOfClusters: (count, zoom) => count < 200 ? count : Math.max(1, zoom - 8)
            })
        })
    }, [map, markerPositions, directions])

    React.useEffect(()=>{

        if(plot && directions){


        directionsService.route({
            origin:src,
            destination:dest,
            travelMode:'DRIVING'
        }).then((response)=>{
            console.log(directions);
            console.log(markerPositions);
            console.log(response);
            directionsRenderer.setDirections(response);
        }).catch((e)=> window.alert("Directions request failed due to "+e));
        }  


    }, [plot, directions])

    // React.useEffect(() => {
    //     console.log('route')
    //     console.log(route)
    //     directionsRenderer.setDirections(route);
    // }, [route])

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



