import Button from '@mui/material/Button';
import { Checkbox, CircularProgress, FormControlLabel, Slider, TextField, Typography, IconButton, Radio, RadioGroup, Input, Label } from "@mui/material";
import { useState } from "react";
import env from "react-dotenv";
import '../App.scss';




function Admin({setLights}) {    
    const axios = require('axios');

    function addLight(){
        if(!addLightLat || !addLightLong) return;
        axios.get(env.BACKEND + `/addLight`, {
            params: {
              latitude: addLightLat,
              longitude: addLightLong
            },
          })
          setLights([]);
    }

    function deleteLight(){
        if(!deleteLightLat || !deleteLightLong) return;
        axios.get(env.BACKEND + `/deleteLight`, {
            params: {
              latitude: deleteLightLat,
              longitude: deleteLightLong
            },
          })
          setLights([]);
    }

    const [addLightLat, setAddLightLat] = useState();
    const [addLightLong, setAddLightLong] = useState();
    const [deleteLightLat, setDeleteLightLat] = useState();
    const [deleteLightLong, setDeleteLightLong] = useState();

    const [addStreetLight, setAddStreetLight] = useState(false);
    const [deleteStreetLight, setDeleteStreetLight] = useState(false);

    const [selectedFileAdd, setSelectedFileAdd] = useState();
    const [isFilePickedAdd, setIsFilePickedAdd] = useState(false);
    const [selectedFileDelete, setSelectedFileDelete] = useState();
    const [isFilePickedDelete, setIsFilePickedDelete] = useState(false);

    const [showReports, setShowReports] = useState(false);
    const [showResolvedReports, setShowResolvedReports] = useState(false);

    const changeHandlerAdd = (event) => {
        setSelectedFileAdd(event.target.files[0]);
        event.target.files[0] && setIsFilePickedAdd(true);
        
    };
    const changeHandlerDelete = (event) => {
        setSelectedFileDelete(event.target.files[0]);
        event.target.files[0] && setIsFilePickedDelete(true);
        
    };

    const handleSubmissionAdd = () => {
        if (!isFilePickedAdd) return;
        const formData = new FormData();
        formData.append("file", selectedFileAdd);
        fetch(env.BACKEND + `/addLightsFile`, {
            method:"POST",
            body: formData
          }).then(setLights([]));
         
          
    };

    const handleSubmissionDelete = () => {
        if (!isFilePickedDelete) return;
        const formData = new FormData();
        formData.append("file", selectedFileDelete);
        fetch(env.BACKEND + `/deleteLightsFile`, {
            method:"POST",
            body: formData
          }).then(setLights([]));
         
          
    };

    return (
        <div className='App-body'>
        <div className="Input">
            <div className="Layers">
            <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
               
                name="radio-buttons-group">
                <FormControlLabel value = "addStreetLight" control={<Radio  /> } onChange={(e) => {setAddStreetLight(e.target.checked); setDeleteStreetLight(!e.target.checked); setShowReports(!e.target.checked); setShowResolvedReports(!e.target.checked)}} label="Add streetlight" />
                <FormControlLabel value = "deleteStreetLight" control={<Radio  />} onChange={(e) => {setDeleteStreetLight(e.target.checked); setAddStreetLight(!e.target.checked); setShowReports(!e.target.checked); setShowResolvedReports(!e.target.checked)}}  label="Delete streetlight" />
                <FormControlLabel value = "showReports" control={<Radio  />} onChange={(e) => {setShowReports(e.target.checked); setAddStreetLight(!e.target.checked); setDeleteStreetLight(!e.target.checked); setShowResolvedReports(!e.target.checked)}}  label="Show Reports" />
                <FormControlLabel value = "showResolvedReports" control={<Radio  />} onChange={(e) => {setShowResolvedReports(e.target.checked); setAddStreetLight(!e.target.checked); setDeleteStreetLight(!e.target.checked); setShowReports(!e.target.checked)}}  label="Show Resolved Reports" />
            </RadioGroup>
                
    
            </div>
        </div>
        {addStreetLight?
        (   
            <div className="LayersAdmin">
            <div>
            <TextField className="Input-Field" variant="standard" label="Latitude"  type = "text" onChange={(e) => setAddLightLat(e.target.value)}/>  
            <TextField className="Input-Field" variant="standard" label="Longitude"  type = "text" onChange={(e) => setAddLightLong(e.target.value)}/>
            </div>
            
            <div>
            <Typography variant="h6" className = "AdminOr">Or</Typography>
            <Input
                type="file"
                style={{ display: 'none' }}
                id="contained-button-file"
                onChange={changeHandlerAdd}
            />
            
            <label htmlFor="contained-button-file">
                <Button variant="contained"  component="span" className = "AdminUpload" >
                Upload
                </Button>
                
            </label>
            {isFilePickedAdd ? <Typography variant="h7" className = "AdminOr">{selectedFileAdd.name}</Typography>:"No file chosen."}
          
            </div>
            <Button className="buttonAdmin" onClick={()=>{
                        isFilePickedAdd?handleSubmissionAdd():addLight()
                    }}>Add Light</Button>
               
            
            </div>
        ) : ""}
        {deleteStreetLight?
        (   
            <div className="LayersAdmin">
            <div>
            <TextField className="Input-Field" variant="standard" label="Latitude"  type = "text" onChange={(e) => setDeleteLightLat(e.target.value)}/>  
            <TextField className="Input-Field" variant="standard" label="Longitude"  type = "text" onChange={(e) => setDeleteLightLong(e.target.value)}/>
            </div>
            <div>
            <Typography variant="h6" className = "AdminOr">Or</Typography>
            <Input
                type="file"
                style={{ display: 'none' }}
                id="contained-button-file"
                onChange={changeHandlerDelete}
            />
            
            <label htmlFor="contained-button-file">
                <Button variant="contained"  component="span" className = "AdminUpload" >
                Upload
                </Button>
                
            </label>
            {isFilePickedDelete ? <Typography variant="h7" className = "AdminOr">{selectedFileDelete.name}</Typography>:"No file chosen."}
           
            </div>
            <Button className="buttonAdmin" onClick={()=>{
                       isFilePickedDelete?handleSubmissionDelete():deleteLight()
                    }}>Delete Light</Button>
            </div>
        ) : ""}
        

        </div>
       

    )
}

export default Admin;