import React from "react";
import Button from '@mui/material/Button';
import { Checkbox, CircularProgress, FormControlLabel, Slider, TextField, Typography } from "@mui/material";

function Input({setShowAllStreetlights, setShowHeatmap, showRoute, setShowRoute, setSrc, setDest, fetchRouteData, loading}){
    const MIN_THRESH = 50;
    const MAX_THRESH = 1000;
    const [darkStretchThreshold, setDarkStretchThreshold] = React.useState(MIN_THRESH)

    return (
        <div className="Input">
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>Layers</Typography>
            <div className="Layers">
                <FormControlLabel control={<Checkbox onChange={(e) => setShowHeatmap(e.target.checked)} />} label="Heatmap" />
                <FormControlLabel control={<Checkbox onChange={(e) => setShowAllStreetlights(e.target.checked)} />} label="All Street Lights" />
                <FormControlLabel control={<Checkbox onChange={(e) => setShowRoute(e.target.checked)} />} label="Street Lights on Route" />
            </div>
            {showRoute? (
                <div className="Layers">
                    <TextField className="Input-Field" variant="standard" label="Source" onChange={(e) => setSrc(e.target.value)} type = "text"/>
                    <TextField className="Input-Field" variant="standard" label="Destination" onChange={(e) => setDest(e.target.value)} type = "text"/>
                    {/* <Typography className="Input-Field" component="div">
                        Dark Stretch Threshold: {darkStretchThreshold}m
                    </Typography>
                    <Slider valueLabelDisplay="auto" min={MIN_THRESH} max={MAX_THRESH} onChange={(event) => setDarkStretchThreshold(event.target.value)}/> */}
                    <Button className="Input-Field" onClick={()=>{
                        fetchRouteData()
                    }}>Load</Button>
                </div>
            ) : ""}     
            <div style={{display: loading ? "flex" :  "none"}} className="Loading">
                <CircularProgress />
            </div>      
        </div>  
    );

}


export default Input;
