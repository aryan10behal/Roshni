import React from "react";

function Input({setSrcDest, plot, setPlot, counter}){
    const sLatRef = React.useRef(null);
    const sLongRef = React.useRef(null);
    const dLatRef = React.useRef(null);
    const dLongRef = React.useRef(null);

    return (<div className = "Input">
            <label>Enter Source</label>
            <input ref={sLatRef} type = "text" className = "SrcLat" placeholder="Latitude"/>
            <input ref = {sLongRef} type = "text" className = "SrcLong" placeholder="Longitude"/>
            <br /> <br />
            <label>Enter Destination</label>
            <input ref = {dLatRef} type = "text" className = "DestLat" placeholder="Latitude"/>
            <input ref = {dLongRef} type = "text" className = "DestLong" placeholder="Longitude"/>
            <br /> <br />
            <button onClick={()=>{
                setSrcDest({srcLat:sLatRef.current.value, srcLong:sLongRef.current.value, destLat:dLatRef.current.value, destLong:dLongRef.current.value });
                setPlot(plot+1);
            }}>Plot</button>
            <br /> <br />
            <label>Total Lights: </label>
            <label>{counter}</label>
            <br /> <br />
        </div>  
    );

}


export default Input;
