import React from "react";

function Input({setSrc, setDest, plot, setPlot, counter}){
    const source_ref = React.useRef(null);
    const destination_ref = React.useRef(null);

    return (<div className = "Input">
            <label>Enter Source: </label>
            <input ref = {source_ref} type = "text" className = "Source_Text" placeholder="Source..."/>
            <br /> <br />
            <label>Enter Destination: </label>
            <input ref = {destination_ref} type = "text" className = "Destination_Text" placeholder="Destination.."/>
            <br /> <br />
            <button onClick={()=>{
                setSrc(source_ref.current.value);
                setDest(destination_ref.current.value)
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
