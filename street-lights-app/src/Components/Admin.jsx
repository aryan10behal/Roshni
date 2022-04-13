import React from "react";
import Button from '@mui/material/Button';
import { Checkbox, CircularProgress, FormControlLabel, Slider, TextField, Typography, IconButton, Radio, RadioGroup, Input, Label } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState } from "react";
import env from "react-dotenv";
import '../App.scss';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';




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
    const [reports, setReports] = useState(null);
    const [resolvedReports, setResolvedReports] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [adminComment, setAdminComment] = useState(null);

    const [selectionModel, setSelectionModel] = React.useState([]);


    //Dialog box
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

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


    const handleDialog=(reports_to_resolve)=>{
        console.log(reports_to_resolve)
        if(reports_to_resolve.length==0) return;
        setShowDialog(true);
        handleClickOpen();

         
    }

    const handleResolveReports=(reports_to_resolve)=>{
        fetch(`${env.BACKEND}/resolveReport?id=${reports_to_resolve}&comment=${adminComment}`)
        .then((response) => {
            if(response.status == 200) {
                response.json().then((data) => {
                    setReports(data);
                })
            } else {
                console.log("Unable to resolve");
            }
        })
    }

    
    //Fetching reports
    React.useEffect(()=>{
        if(!reports){
        fetch(`${env.BACKEND}/reports`)
        .then((response) => response.json())
        .then((data) => setReports(data)) ;
      
        }

    }, [showReports])

     //Fetching Resolved reports
     React.useEffect(()=>{
        
        fetch(`${env.BACKEND}/getResolvedReport`)
        .then((response) => response.json())
        .then((data) => setResolvedReports(data)) ;
      
        

    }, [showResolvedReports])




    const columns = [
        { field: 'lat', headerName: 'Latitude', width: 130 },
        { field: 'lng', headerName: 'Longitude', width: 130 },
        { field: 'timestamp', headerName: 'Time Stamp', width:230 },
        { field: 'CCMS_no', headerName: 'CCMS No.', width: 230 },
        { field: 'zone', headerName: 'Zone', width: 130 },
        { field: 'Type_of_Light', headerName: 'Type of Light', width:130 },
        { field: 'Wattage', headerName: 'Wattage', width: 130 },
        { field: 'Ward_No', headerName: 'Ward No.', width: 130 },
        { field: 'Connected Load', headerName: 'Connected Load', width:130 },
        { field: 'Actual Load', headerName: 'Actual Load', width: 130 },
        { field: 'Phone No', headerName: 'Phone No.', width: 130 },
        { field: 'Report Type', headerName: 'Report Type', width:500 },
      ];
      const columns_resolved = [
        { field: 'lat', headerName: 'Latitude', width: 130 },
        { field: 'lng', headerName: 'Longitude', width: 130 },
        { field: 'reported_timestamp', headerName: 'Reported Time Stamp', width:230 },
        { field: 'resolved_timestamp', headerName: 'Resolved Time Stamp', width:230 },
        { field: 'CCMS_no', headerName: 'CCMS No.', width: 230 },
        { field: 'zone', headerName: 'Zone', width: 130 },
        { field: 'Type_of_Light', headerName: 'Type of Light', width:130 },
        { field: 'Wattage', headerName: 'Wattage', width: 130 },
        { field: 'Ward_No', headerName: 'Ward No.', width: 130 },
        { field: 'Connected Load', headerName: 'Connected Load', width:130 },
        { field: 'Actual Load', headerName: 'Actual Load', width: 130 },
        { field: 'Phone No', headerName: 'Phone No.', width: 130 },
        { field: 'Report Type', headerName: 'Report Type', width:130 },
        { field: 'Comments', headerName: 'Comments', width:500 },
      ];
    

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

        {showReports?        
       
           (
               
            <div>
            <div className="ReportsTable">
                <DataGrid 
                rows={reports}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                checkboxSelection
                onSelectionModelChange={(newSelection) => {
                setSelectionModel(newSelection);
                }}
                selectionModel={selectionModel}
                 
                />
                 <Button variant="contained"  onClick={()=>{
                      handleDialog(selectionModel);
                    }}component="span" className = "AdminUpload" >
                    Resolve
                </Button>
            </div>
           
            </div>

            
            
            

        ):""}
        {showResolvedReports?(
            <div className="ReportsTable">
                <DataGrid 
                rows={resolvedReports}
                columns={columns_resolved}
                pageSize={10}
                rowsPerPageOptions={[10]}

                 
                />
                
            </div>
            
            
        ):""}
        
        {showDialog?(
            <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Resolve Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
           Reports with the following location will get resolved:  {selectionModel.map(val=><p>{val}</p>)}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Comments"
            type="email"
            fullWidth
            variant="standard"
            onChange={(e)=>setAdminComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={()=>{handleResolveReports(selectionModel);handleClose()}}>Resolve</Button>
        </DialogActions>
      </Dialog>
    </div>):""}

        </div>
       

    )
}

export default Admin;
