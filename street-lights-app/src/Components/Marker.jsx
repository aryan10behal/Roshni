import React from "react";
import glow from '../glow.png';
import lamp from '../lamppost.png';

class Marker extends React.Component {
    getPosition() {
      return this.props.position
    }
    render() {
        return (<div className="lamp-marker">
            <img
              text='My Marker'
              src={glow}
              alt='lamp'
            />
            <img
              text='My Marker'
              src={lamp}
              alt='lamp'
            />
        </div>);
    }
}

export default Marker;