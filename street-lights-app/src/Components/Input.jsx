import React from "react";
import Button from '@mui/material/Button';
import { Checkbox, CircularProgress, FormControlLabel, Slider, TextField, Typography, Radio } from "@mui/material";

function Input({setShowAllStreetlights, showAllStreetLights, setShowLiveData, showLiveData, setShowOtherData, showOtherData, setShowHeatmap, showRoute, setShowRoute, setSrc, setDest, setSrcDark, setDestDark, fetchRouteData, fetchDarkRouteData, loading, showDarkRoute, setDarkRoute,
    distanceFromStreet,
    darkStretchThreshold,
    distanceFromStreetDark,
    setDistanceFromStreet,
    setDarkStretchThreshold,
    setDistanceFromStreetDark,
    MIN_THRESH_DARK,
    MAX_THRESH_DARK,
    MIN_THRESH_ROUTE,
    MAX_THRESH_ROUTE,
poleInfo}){
    
   

    return (
        <div className="Input">
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>Layers</Typography>
            <div className="Layers">
                <FormControlLabel control={<Checkbox onChange={(e) => setShowHeatmap(e.target.checked)} />} label="Heatmap" />
                <FormControlLabel control={<Checkbox onChange={(e) => {setShowAllStreetlights(e.target.checked); if(!e.target.checked){setShowLiveData(false); setShowOtherData(false)} }} />} label="All Street Lights" />
                {showAllStreetLights? (
                    <div className="InputOp">
                    <FormControlLabel control={<Checkbox onChange={(e) => setShowLiveData(e.target.checked)} />} label="Live Data" />
                    <FormControlLabel control={<Checkbox onChange={(e) => setShowOtherData(e.target.checked)} />} label="Other Data" />
                    </div>
                ):""}
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
                    <Typography className="Input-Field" component="div">
                        Distance from the street: {distanceFromStreetDark}m
                    </Typography>
                    <Slider valueLabelDisplay="auto" min={MIN_THRESH_ROUTE} max={MAX_THRESH_ROUTE} onChange={(event) => setDistanceFromStreetDark(event.target.value)}/>
                    <Button className="Input-Field" onClick={()=>{
                        fetchDarkRouteData()
                    }}>Load</Button>
                </div>
            ) : ""}
            
            </div>     
            <div style={{display: loading ? "flex" :  "none"}} className="Loading">
                <CircularProgress />
            </div>   
            {poleInfo?(
            
                <div className="Selected-Light">
                    <div className="PoleInfoHeader">Light Info</div>
                <div>Latitude: {poleInfo['LatLng'].lat()}</div>
            <div>Longitude: {poleInfo['LatLng'].lng()}</div>
            <div>CCMS No.: {poleInfo['CCMS NO']}</div>
            <div>Type of Light: {poleInfo['Type of Light']}</div>
            <div>No. Of Lights: {poleInfo['No. Of Lights']}</div>
            <div>Wattage: {parseInt(poleInfo['Wattage'])}</div>
            <div>Connected Load: {poleInfo['Connected Load']!=-1?poleInfo['Connected Load']:0}</div>
            <div>Actual Load: {poleInfo['Actual Load']!=-1?poleInfo['Actual Load']:0}</div>
            <div>Unique Pole No.: {poleInfo['Unique Pole No.']}</div>
            <div>Agency: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(0,2):''}</div>
            <div>Zone: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(2,4):poleInfo['Zone']}</div>
            <div>Ward No.: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(4,7):poleInfo['Ward No.']}</div>
            <div>Unique No.: {poleInfo['Unique Pole No.']?poleInfo['Unique Pole No.'].toString().slice(7,):""}</div>
            </div>
            ):""}
        </div>  
    );

}


export default Input;
