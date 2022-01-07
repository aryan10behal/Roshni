import React from 'react';
import {GridAlgorithm, KmeansAlgorithm, MarkerClusterer} from '@googlemaps/markerclusterer'
import Clusterer from './Clusterer';


function Map({children, style, className, markerPositions, center, zoom}) {

    const ref = React.useRef(null);
    const [map, setMap] = React.useState();

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
        var markers = markerPositions.map(position => new window.google.maps.Marker({position, icon: "http://localhost:8000/icon", style: {height: "10px", width: "10px"}}));
        new MarkerClusterer({map, markers, algorithm: new KmeansAlgorithm({maxZoom: 25, numberOfClusters: (count, zoom) => count < 200 ? count : Math.max(1, zoom - 8)})})
    }, [map, markerPositions])
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