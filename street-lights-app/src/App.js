import logo from './logo512.png';
import './App.scss';
import env from "react-dotenv";
import GoogleMapReact from 'google-map-react';
import MarkerClusterer from '@google/markerclusterer'
import React from 'react';
import Marker from './Components/Marker';

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      center: {lat: 28.595304,lng: 77.088783},
      zoom: 18,
      streetlights: []
    }

    this.fetchstreetlights();
  }

  setGoogleMapRef (map, maps) {
    this.googleMapRef = map
    this.googleRef = maps

    const axios = require('axios');
    axios.get(`${env.BACKEND}/streetlights`).then((response) => {
      if(response.status !== 200) {
        console.log(response)
      }
      let locations = response.data.slice(100)
      console.log(locations.length)

      let markers = locations && locations.map((location) => {
        return new this.googleRef.Marker({position: location})
      })
      new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        gridSize: 100,
        minimumClusterSize: 5
      })
    });
  }

  fetchstreetlights() {
    const axios = require('axios');
    axios.get(`${env.BACKEND}/streetlights`).then((response) => {
      if(response.status === 200) {
        this.setState({streetlights: response.data.slice(0, 100)})
      }
    })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          Delhi Street Lights
        </header>
        <div className='Map'>
        <GoogleMapReact
            bootstrapURLKeys={{ key: env.GOOGLE_MAPS_API_KEY }}
            defaultCenter={this.state.center}
            defaultZoom={this.state.zoom}
            onGoogleApiLoaded={({map, maps}) => this.setGoogleMapRef(map, maps)}
          >
          {this.state.streetlights.slice(0, 2).map((lamp) => <Marker lat={lamp.lat} lng={lamp.lng} />)}
          </GoogleMapReact>
        </div>
      </div>
    );
  }
}

export default App;
