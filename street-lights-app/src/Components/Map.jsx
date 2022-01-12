import React from 'react';
import {KmeansAlgorithm, MarkerClusterer} from '@googlemaps/markerclusterer'

function distance(lat1,
    lat2, lon1, lon2)
{

    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    lon1 =  lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    // Haversine formula
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)
    + Math.cos(lat1) * Math.cos(lat2)
    * Math.pow(Math.sin(dlon / 2),2);

    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956
    // for miles
    let r = 6371;

    // calculate the result in meters
    return(c * r * 1000);
}

  

function Map({children, style, className, markerPositions, center, zoom, srcDest, plot, setCounter}) {

    const directionsRenderer = new window.google.maps.DirectionsRenderer({routes: []});
    const directionsService = new window.google.maps.DirectionsService();

    const ref = React.useRef(null);
    const [map, setMap] = React.useState();
    const [path, setPath] = React.useState([]);


    // const [infoWindow, setInfowindow] = React.useState(new window.google.maps.InfoWindow({
    //     content: "Click the map to get Lat/Lng!",
    //     position: {lat: 28.595304,lng: 77.088783},
    //   }));

    
    //   // Configure the click listener.
    
    //infoWindow.open(map);
    directionsRenderer.setMap(map);
    

    // function initMap(e) {
    //         // Close the current InfoWindow.
    //         infoWindow.close();
    //         // Create a new InfoWindow.
    //         infoWindow = new window.google.maps.InfoWindow({
    //           position: e.latLng,
    //         });
    //         infoWindow.setContent(
    //           JSON.stringify(e.latLng.toJSON(), null, 2)
    //         );
    //         infoWindow.open(map);
        
    //   }

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
        new MarkerClusterer({
            map, 
            markers, 
            algorithm: new KmeansAlgorithm({
                maxZoom: 25, 
                numberOfClusters: (count, zoom) => count < 200 ? count : Math.max(1, zoom - 8)
            })
        })
    }, [map, markerPositions])

    React.useEffect(()=>{
        
        if(plot){
            

        directionsService.route({
            origin:srcDest.srcLat+','+srcDest.srcLong,
            destination:srcDest.destLat+','+srcDest.destLong,
            travelMode:'DRIVING'
        }).then((response)=>{
            var result = response.routes[0].overview_path.map(function(e) {
                return {lng: e.lng(), lat: e.lat()};
              })
            setPath(result);
            
            const points = new Set();

            for(let i = 0; i<markerPositions.length; i++)
                {
                    var x = markerPositions[i].lng;
                    var y = markerPositions[i].lat;
                    for(let j = 0; j < result.length; j++)
                    {
                        var a = result[j].lng;
                        var b = result[j].lat;
                    
                        // if ditance is less than 25m then its counted
                        if(distance(y, b, x, a) <= 25)
                        {
                            console.log(distance(y, b, x, a));
                            points.add(y.toString()+","+x.toString());
                        }
                    }
                }

            console.log(points);
            directionsRenderer.setDirections(response);
            setCounter(points.size);
        }).catch((e)=> window.alert("Directions request failed due to "+e));

        }  
    }, [srcDest])
  
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



