import React from "react";
import { KmeansAlgorithm, ClusterStats, MarkerClusterer } from "@googlemaps/markerclusterer";
import { interpolateRgb } from "d3-interpolate";
import env from "react-dotenv";

function Map({
  children,
  className,
  center,
  zoom,
  clustererData,
  routeData,
  heatmapData,
  darkroutes,
  darkDistances,
  darkbounds,
  onMarkerClickPre,
  showLiveData,
  showOtherData,
  allowReportRegion,
  selectRegion
}) {

  const ref = React.useRef(null);
  const [map, setMap] = React.useState();
  const clusterer = React.useRef();
  const heatmap = React.useRef();
  const routePlot = React.useRef();
  const darkRef = React.useRef();
  const darkPlot = React.useRef();
  const reportDrawingManager = React.useRef();
  const selectedRegion = React.useRef();

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(
        new window.google.maps.Map(ref.current, {
          mapTypeId: "roadmap",
        })
      );
    }
  }, [ref, map]);

  React.useEffect(() => {

   
    if (map) {
      map.setOptions({
        center,
        zoom,
      });
    }
  }, [map, center, zoom]);

  

  React.useEffect(() => {
    if(map) {
      if(allowReportRegion) {
        reportDrawingManager.current = new window.google.maps.drawing.DrawingManager({
          drawingMode: window.google.maps.drawing.OverlayType.CIRCLE,
          circleOptions: {
            fillColor: "#ff0000",
            fillOpacity: 0.2,
            strokeWeight: 1,
            clickable: false,
            editable: true,
            zIndex: 1,
          },
          drawingControl: false
        });
        reportDrawingManager.current.setMap(map);

        window.google.maps.event.addListener(reportDrawingManager.current, 'circlecomplete', (circle) => {
          if(selectedRegion.current) {
            selectedRegion.current.setMap(null)
          }
          selectedRegion.current = circle
          selectRegion(circle)
        });
        
      } else {
        reportDrawingManager.current?.setMap(null);
        selectedRegion.current?.setMap(null);
      }
    }
  }, [map, allowReportRegion])






  // plot heatmap if heatmapData supplied
  React.useEffect(() => {
    
    if (heatmap.current) heatmap.current.setMap(null);
    if (!heatmapData) return;
    console.log(heatmapData[0]["LatLng"])
    var heatMapNewData = heatmapData.map(
      (position) => position["LatLng"]
    );
    console.log(heatMapNewData[0])
    heatmap.current = new window.google.maps.visualization.HeatmapLayer({
      map,
      data: heatMapNewData,
      maxIntensity: 10

    });
  }, [map, heatmapData]);







  //CLusters and All Street Lights
  React.useEffect(() => {
    if (clusterer.current) clusterer.current.setMap(null);

    if (!clustererData) return;
    var markers = [];


    for (var i = 0; i < clustererData.length; i++) {
      
      let entry = clustererData[i]['poles'].length;
      let position = clustererData[i]['poles'][0];
      let positions = clustererData[i]['poles'];
      let marker;
    
      if(entry>1){

           
           
            marker = new window.google.maps.Marker({
            position: position["LatLng"],
            icon: env.BACKEND + "/icon_blue",
          });
      }
      else{
        

        //Data not available
        if (position["Connected Load"] == -1 && position["Actual Load"] == -1) {
          marker = new window.google.maps.Marker({
            position: position["LatLng"],
            icon: env.BACKEND + "/icon",
          });

        } 
        //Almost Not working
        else if (parseFloat(position["Actual Load"]) ===0 ||
          parseFloat(position["Actual Load"]) /
            parseFloat(position["Connected Load"]) <=
          0.25
        ) {

          marker = new window.google.maps.Marker({
            position: position["LatLng"],
            icon: env.BACKEND + "/icon_red",
          });
        } 
        //Almost Working
        else if (
          parseFloat(position["Actual Load"]) /
            parseFloat(position["Connected Load"]) >=
          0.75
        ) {
          marker = new window.google.maps.Marker({
            position: position["LatLng"],
            icon: env.BACKEND + "/icon_green",
          });
        } 

        //Partially working
        else {
          
            marker = new window.google.maps.Marker({
              position: position["LatLng"],
              icon: env.BACKEND + "/icon_yellow",
            });
          
        }
       
    }
    marker.addListener("click", () => onMarkerClickPre(marker, positions, map));
    markers.push(marker);
  }
    

   
    const interpolatedRenderer = {
      palette: interpolateRgb("red", "green"),
      render: function ({ count, position }, stats) {
        // use d3-interpolateRgb to interpolate between red and blue
        const color = this.palette(count / stats.clusters.markers.max);
    
        // create svg url with fill color
        const svg = window.btoa(`
      <svg fill="${color}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
        <circle cx="120" cy="120" opacity=".8" r="70" />    
      </svg>`);
    
        // create marker using svg icon
        return new window.google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml;base64,${svg}`,
            scaledSize: new window.google.maps.Size(75, 75),
          },
          label: {
            text: String(count),
            color: "rgba(255,255,255,0.9)",
            fontSize: "12px",
          },
          // adjust zIndex to be above other markers
          zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
        });
      },
    };

    clusterer.current = new MarkerClusterer({
      renderer: interpolatedRenderer,
      map,
      markers,
      algorithm: new KmeansAlgorithm({
        maxZoom: 25,
        numberOfClusters: (count, zoom) =>
          count < 200 ? count : Math.max(1, zoom - 8),
      }),
    });
  }, [map, clustererData, showLiveData, showOtherData]);





  //plot route, neighbouring streetlights
  React.useEffect(() => {
    if (routePlot.current) {
      routePlot.current.polylines.forEach((polyline) => {
        polyline.setMap(null);
      });
      routePlot.current.A.setMap(null);
      routePlot.current.B.setMap(null);
      routePlot.current.routeLights.forEach((routeLightArr) => {
        routeLightArr.forEach((routeLight) =>routeLight.setMap(null));
      });
    }
    if (!routeData) return;

    //For grouping data
    function groupData(data){
      let grouped = data.reduce((result, obj) => {
          if (result[obj.LatLng]) {
            result[obj.LatLng].push(obj) 
          } else {
            result[obj.LatLng] = [obj]
          }
          return result
        }, {});

      var groups = Object.keys(grouped).map(function (key) {
         
          return {LatLng: grouped[key][0]['LatLng'], poles: grouped[key]};
      });
      
      return groups;

  }

    routePlot.current = {
      polylines : [],
      routeLights: []
    }
    

    for(let i = 0; i<routeData.route.length; i++){
    
      let polyline = new window.google.maps.Polyline({
        map,
        path: routeData.route[i],
        strokeColor: "Grey",
        strokeWeight: 7,
      });
      let groupedData = groupData(routeData.routeLights[i]);

      let routeLight = groupedData.map((pos) => {
        let entry = pos['poles'].length;
        let position = pos['poles'][0];
        let positions = pos['poles'];
        let marker;

        if(entry>1){

           
           
          marker = new window.google.maps.Marker({
          position: position["LatLng"],
          icon: env.BACKEND + "/icon_blue",
        });
    }
    else{

        if (
          position["Connected Load"] == -1 &&
          position["Actual Load"] == -1
        ) {
          marker = new window.google.maps.Marker({
            map,
            position: position["LatLng"],
            icon: env.BACKEND + "/icon",
          });
        } else if (
          parseFloat(position["Actual Load"]) /
            parseFloat(position["Connected Load"]) <=
          0.25
        ) {
          marker = new window.google.maps.Marker({
            map,
            position: position["LatLng"],
            icon: env.BACKEND + "/icon_red",
          });
        } else if (
          parseFloat(position["Actual Load"]) /
            parseFloat(position["Connected Load"]) >=
          0.75
        ) {
          marker = new window.google.maps.Marker({
            map,
            position: position["LatLng"],
            icon: env.BACKEND + "/icon_green",
          });
        } else {
          marker = new window.google.maps.Marker({
            map,
            position: position["LatLng"],
            icon: env.BACKEND + "/icon_yellow",
          });
        }
      }

        marker.addListener("click", () => onMarkerClickPre(marker, positions, map));

        return marker;
      })

      routePlot.current.polylines.push(polyline);
      routePlot.current.routeLights.push(routeLight);

    }
    routePlot.current.polylines.push(new window.google.maps.Polyline({
      map,
      path: routeData.route[routeData.best_route_index],
      strokeColor: "DodgerBlue",
      strokeWeight: 7,
    }))
    routePlot.current.A = new window.google.maps.Marker({
      map,
      position: routeData.route[0][0],
      label: "A",
    })
    routePlot.current.B = new window.google.maps.Marker({
      map,
      position: routeData.route[0][routeData.route[0].length - 1],
      label: "B",
    })
   
    
    map.fitBounds(
      new window.google.maps.LatLngBounds(
        routeData.bounds.southwest,
        routeData.bounds.northeast
      )
    );
  }, [map, routeData]);


  //Darkroutes
  React.useEffect(() => {
    if (darkPlot.current) {
      darkPlot.current.paths.forEach((path) => {
        path.setMap(null);
      });
      darkPlot.current.darkSpots.forEach((darkSpot) => {
        darkSpot.setMap(null);
      });
    }
    if (!darkroutes || !darkroutes.length) {
      return;
    }
    var darkRoutesFinal = [];
    for (let i = 0; i < darkroutes.length; i++) {
      var darkRoutesTemp = [];
      for (let j = 0; j < darkroutes[i].length; j++) {
        darkRoutesTemp[j] = new window.google.maps.LatLng(darkroutes[i][j]);
      }
      darkRoutesFinal[i] = darkRoutesTemp;
    }

    darkPlot.current = {
      paths: [],
      darkSpots: [],
    };

    for (let i = 0; i < darkRoutesFinal.length; i++) {
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

    for (let i = 0; i < darkroutes.length; i++) {
      const marker1 = new window.google.maps.Marker({
        position: darkroutes[i][0],
        icon: env.BACKEND + "/icon2",
        map,
      });
      const marker2 = new window.google.maps.Marker({
        position: darkroutes[i][darkroutes[i].length - 1],
        icon: env.BACKEND + "/icon2",
        map,
      });

      const contentString = `<div id="content"><p>Distance to the next pole <br><h1>${darkDistances[
        i
      ].toFixed(2)}m </h1></div>`;
      const infowindow = new window.google.maps.InfoWindow({
        content: contentString,
      });

      new window.google.maps.event.addListener(marker1, "click", function () {
        infowindow.open(map, marker1);
      });
      infowindow.addListener("closeclick", () => {
        // Handle focus manually.
      });

      darkPlot.current.darkSpots.push(marker1);
      darkPlot.current.darkSpots.push(marker2);
    }

    darkPlot.current.darkSpots[0].setMap(null);
    darkPlot.current.darkSpots[darkPlot.current.darkSpots.length - 1].setMap(null);

    darkPlot.current.darkSpots = darkPlot.current.darkSpots.slice(1, darkPlot.current.darkSpots.length - 1);

    const marker1 = new window.google.maps.Marker({
      position: darkroutes[0][0],
      map,
    });
    const marker2 = new window.google.maps.Marker({
      position: darkroutes[darkroutes.length - 1][darkroutes[darkroutes.length - 1].length - 1],
      map,
    });

    darkPlot.current.darkSpots.push(marker1);
    darkPlot.current.darkSpots.push(marker2);

    map.fitBounds(
      new window.google.maps.LatLngBounds(
        darkbounds.southwest,
        darkbounds.northeast
      )
    );
  }, [map, darkroutes]);

  return (
    <>
      <div ref={ref} className={className} />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
        }
      })}
    </>
  );
}

export default Map;
