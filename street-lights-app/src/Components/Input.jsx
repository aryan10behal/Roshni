import React from "react";
import Button from '@mui/material/Button';
import { Checkbox, CircularProgress, FormControlLabel, Slider, TextField, Typography } from "@mui/material";

function Input({setShowAllStreetlights, setShowHeatmap, showRoute, setShowRoute, setSrc, setDest, setSrcDark, setDestDark, fetchRouteData, fetchDarkRouteData, loading, showDarkRoute, setDarkRoute,
    distanceFromStreet,
    darkStretchThreshold,
    setDistanceFromStreet,
    setDarkStretchThreshold,
    MIN_THRESH_DARK,
    MAX_THRESH_DARK,
    MIN_THRESH_ROUTE,
    MAX_THRESH_ROUTE}){
    

    return (
        <div className="Input">
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>Layers</Typography>
            <div className="Layers">
                <FormControlLabel control={<Checkbox onChange={(e) => setShowHeatmap(e.target.checked)} />} label="Heatmap" />
                <FormControlLabel control={<Checkbox onChange={(e) => setShowAllStreetlights(e.target.checked)} />} label="All Street Lights" />
                <FormControlLabel control={<Checkbox onChange={(e) => setShowRoute(e.target.checked)} />} label="Street Lights on Route" />
                
            
            {showRoute? (
                <div className="Layers">
                    <TextField className="Input-Field" variant="standard" label="Source" onChange={(e) => setSrc(e.target.value)} type = "text"/>
                    <TextField className="Input-Field" variant="standard" label="Destination" onChange={(e) => setDest(e.target.value)} type = "text"/>
                    <Typography className="Input-Field" component="div">
                        Distance from the street: {distanceFromStreet}m
                    </Typography>
                    <Slider valueLabelDisplay="auto" min={MIN_THRESH_ROUTE} max={MAX_THRESH_ROUTE} onChange={(event) => setDistanceFromStreet(event.target.value)}/>
                    <Button className="Input-Field" onClick={()=>{
                        fetchRouteData()
                    }}>Load</Button>
                </div>
            ) : ""}
            <FormControlLabel control={<Checkbox onChange={(e) => setDarkRoute(e.target.checked)} />} label="Dark Stretches on Route" />
            {showDarkRoute? (
                <div className="Layers">
                    <TextField className="Input-Field" variant="standard" label="Source_Dark" onChange={(e) => setSrcDark(e.target.value)} type = "text"/>
                    <TextField className="Input-Field" variant="standard" label="Destination_Dark" onChange={(e) => setDestDark(e.target.value)} type = "text"/>
                    <Typography className="Input-Field" component="div">
                        Dark Stretch Threshold: {darkStretchThreshold}m
                    </Typography>
                    <Slider valueLabelDisplay="auto" min={MIN_THRESH_DARK} max={MAX_THRESH_DARK} onChange={(event) => setDarkStretchThreshold(event.target.value)}/>
                    <Button className="Input-Field" onClick={()=>{
                        fetchDarkRouteData()
                    }}>Load</Button>
                </div>
            ) : ""}
            
            </div>     
            <div style={{display: loading ? "flex" :  "none"}} className="Loading">
                <CircularProgress />
            </div>      
        </div>  
    );

}


export default Input;
