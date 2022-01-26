import React from "react";

function Input({setSrc, setDest, plot, setPlot, counter}){
    const source_ref = React.useRef(null);
    const destination_ref = React.useRef(null);

    return (<div>
            <label>Source: </label>
            <input ref = {source_ref} type = "text" className = "Source_Text" placeholder="Source..."/>
            <label>Destination: </label>
            <input ref = {destination_ref} type = "text" className = "Destination_Text" placeholder="Destination.."/>
            <button onClick={()=>{
                setSrc(source_ref.current.value);
                setDest(destination_ref.current.value)
                setPlot(plot+1);
            }}>Plot</button>
            <br />
           
        </div>  
    );

}


export default Input;
