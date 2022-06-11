import React, { useState, useContext } from "react";
import Button from '@mui/material/Button';
import { FormControlLabel,  TextField, Typography, Radio, RadioGroup, Input } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import env from "react-dotenv";
import '../App.scss';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Wrapper } from "@googlemaps/react-wrapper";
import Map from "./Map";
import { UserContext } from "../context/UserContext";
import ErrorMessage from "./ErrorMessage";
import Register from "./Register";


//Importing for login
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
const theme = createTheme();

function Admin({setLights}) {    

    const [zoom, setZoom] = useState(11);
    const [center, setCenter] = useState({lat: 28.6,lng: 77.15});

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [token, setToken] = useContext(UserContext);

    const [registerUser, setRegisterUser] = useState(null);
    const [registered, setRegistered] = useState(null);

    // Login Admin
    const submitLogin = async () => {
        const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: JSON.stringify(
            `grant_type=&username=${email}&password=${password}&scope=&client_id=&client_secret=`
        ),
        };

        const response = await fetch(env.BACKEND + "/api/token", requestOptions);
        const data = await response.json();

    
        if (!response.ok) {
        setErrorMessage(data.detail);
        } else {
        setToken(data.access_token);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submitLogin();
    };

    // Logout Admin
    const submitLogout = async () => {
        const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: JSON.stringify(
            `grant_type=&username=${email}&password=${password}&scope=&client_id=&client_secret=`
        ),
        };

        const response = await fetch(env.BACKEND + "/api/token", requestOptions);
        const data = await response.json();

    
        if (!response.ok) {
        setErrorMessage(data.detail);
        } else {
        setToken(data.access_token);
        }
    };


    const handleLogOut = (e) => {
        e.preventDefault();
        console.log("Yeah I am in!!")
        setToken(null)
        setReports(null)
        setRegisterUser(null)
        setAddStreetLight(false) 
        setDeleteStreetLight(false)
        setShowReports(false)
        setShowResolvedReports(false)
        setShowMap(false)
    }

    const handleRegisterUser = (e) => {
        e.preventDefault();
        console.log("Yeah I am in for Register!!")
        setRegisterUser("Registering new User")
    }
    
    const handleDoneRegisteration = (e) => {
        e.preventDefault();
        setRegisterUser(null)
        setRegistered(null)
    }

     const addLight = async() => {
        if(!addLightLat || !addLightLong) return;

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json",
            Authorization: "Bearer " + token,},
            params: {
                latitude: addLightLat,
                longitude: addLightLong
              },
          };   
          const response = await fetch(env.BACKEND + `/addLight`, requestOptions);
          const data = await response.json();
      
          if (!response.ok) {
            setErrorMessage(data.detail);
          } else {
            setLights([])
          }

        // axios.get(env.BACKEND + `/addLight`, {
        //     params: {
        //       latitude: addLightLat,
        //       longitude: addLightLong
        //     },
        //   })
        //   setLights([]);
    };

    const deleteLight = async() => {
        if(!deleteLightLat || !deleteLightLong) return;
        // axios.get(env.BACKEND + `/deleteLight`, {
        //     params: {
        //       latitude: deleteLightLat,
        //       longitude: deleteLightLong
        //     },
        //   })
        //   setLights([]);

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json",
            Authorization: "Bearer " + token,},
            params: {
                latitude: deleteLightLat,
                longitude: deleteLightLong
              },
          };   
          const response = await fetch(env.BACKEND + `/deleteLight`, requestOptions);
          const data = await response.json();
      
          if (!response.ok) {
            setErrorMessage(data.detail);
          } else {
            setLights([])
          }
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
    const [showMap, setShowMap] = useState(false);
    const [reports, setReports] = useState(null);
    const [resolvedReports, setResolvedReports] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [adminComment, setAdminComment] = useState(null);

    const [selectionModel, setSelectionModel] = React.useState([]);

    const [selectedLight, setSelectedLight] = useState(null);


    //Dialog box
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    }

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
        console.log(encodeURIComponent(reports_to_resolve))
        fetch(`${env.BACKEND}/resolveReport?id=${encodeURIComponent(reports_to_resolve)}&comment=${adminComment}`)
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
        const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
        };
        const fetchReport = async () => {
            const reportData = await fetch(`${env.BACKEND}/reports`, requestOptions)
            const reportDataJson = await reportData.json()
            setReports(reportDataJson)
        }

        fetchReport().catch(console.error);

    }, [showReports, token])

     //Fetching Resolved reports
     React.useEffect(()=>{
      
        const requestOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
        };
        const fetchResolvedReport = async () => {
            const resolveReportData = await fetch(`${env.BACKEND}/getResolvedReport`, requestOptions)
            const resolveReportDataJson = await resolveReportData.json()
            setResolvedReports(resolveReportDataJson)
        }

        fetchResolvedReport().catch(console.error);

    }, [showResolvedReports, token])



    function onMarkerClick(marker, position, map) {
        let id = `${marker.position.lat()},${marker.position.lng()}`;
        const infowindow = new window.google.maps.InfoWindow({
            content: `<div>
            <div>Latitude: ${marker.position.lat()}</div>
            <div>Longitude: ${marker.position.lng()}</div>
            <div>CCMS No.: ${position['CCMS NO']}</div>
            <div>Type of Light: ${position['Type of Light']}</div>
            <div>No. Of Lights: ${position['No. Of Lights']}</div>
            <div>Wattage: ${parseInt(position['Wattage'])}</div>
            <div>Connected Load: ${position['Connected Load']!=-1?position['Connected Load']:0}</div>
            <div>Actual Load: ${position['Actual Load']!=-1?position['Actual Load']:0}</div>
            <div>Unique Pole No.: ${position['Unique Pole No.']}</div>
            <div>Agency: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(0,2):''}</div>
            <div>Zone: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(2,4):position['Zone']}</div>
            <div>Ward No.: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(4,7):position['Ward No.']}</div>
            <div>Unique No.: ${position['Unique Pole No.']?position['Unique Pole No.'].toString().slice(7,):""}</div>

            </div>`,
        });
        infowindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
        })
        // setSelectedLight({lat: marker.position.lat(), lng: marker.position.lng(), CCMS_NO:position['CCMS NO'], Zone:position['Zone'], Type_of_light:position['Type of Light'], No_of_lights:position['No. Of Lights'], Wattage:position['Wattage'], connected_load:position['Connected Load'], actual_load:position['Actual Load'], ward_no:position['Ward No.'] });
    }



    const columns = [
        { field: 'lat', headerName: 'Latitude', width: 130 },
        { field: 'lng', headerName: 'Longitude', width: 130 },
        { field: 'timestamp', headerName: 'Time Stamp', width:260 },
        { field: 'CCMS_no', headerName: 'CCMS No.', width: 230 },
        { field: 'unique_pole_no', headerName: 'Unique Pole No.', width: 130 },
        { field: 'agency', headerName: 'Agency', width: 130 },
        { field: 'zone', headerName: 'Zone', width: 130 },
        { field: 'Ward_No', headerName: 'Ward No.', width: 130 },
        { field: 'unique_no', headerName: 'Unique No.', width: 130 },
        { field: 'Type_of_Light', headerName: 'Type of Light', width:130 },
        { field: 'Wattage', headerName: 'Wattage', width: 130 },
        { field: 'Connected Load', headerName: 'Connected Load', width:130 },
        { field: 'Actual Load', headerName: 'Actual Load', width: 130 },
        { field: 'Phone No', headerName: 'Phone No.', width: 130 },
        { field: 'Report Type', headerName: 'Report Type', width:500 },
        
        
      ];
      const columns_resolved = [
        { field: 'lat', headerName: 'Latitude', width: 130 },
        { field: 'lng', headerName: 'Longitude', width: 130 },
        { field: 'timestamp', headerName: 'Time Stamp', width:260 },
        { field: 'CCMS_no', headerName: 'CCMS No.', width: 230 },
        { field: 'unique_pole_no', headerName: 'Unique Pole No.', width: 130 },
        { field: 'agency', headerName: 'Agency', width: 130 },
        { field: 'zone', headerName: 'Zone', width: 130 },
        { field: 'Ward_No', headerName: 'Ward No.', width: 130 },
        { field: 'unique_no', headerName: 'Unique No.', width: 130 },
        { field: 'Type_of_Light', headerName: 'Type of Light', width:130 },
        { field: 'Wattage', headerName: 'Wattage', width: 130 },
        { field: 'Connected Load', headerName: 'Connected Load', width:130 },
        { field: 'Actual Load', headerName: 'Actual Load', width: 130 },
        { field: 'Phone No', headerName: 'Phone No.', width: 130 },
        { field: 'resolved_timestamp', headerName: 'Resolved Timestamp', width: 260 },
        { field: 'Report Type', headerName: 'Report Type', width:500 },
        { field: 'Comments', headerName: 'Comments', width:500 },
      ];
    
    function positionData(position){

        var latLng = new window.google.maps.LatLng({'lng':position['lng'], 'lat':position['lat']});
        var positionData = {'LatLng': latLng, 'CCMS NO':position['CCMS_no'], 'Zone':position['zone'], 'Type of Light':position['Type_of_Light'], 'No. Of Lights':position['No_Of_Lights'], 'Ward No.':position['Ward_No'] , 'Wattage':position['Wattage'], 'Connected Load':position['Connected Load'], 'Actual Load':position['Actual Load'], 'Unique Pole No.':position['unique_pole_no']};
        return positionData;
    }

    return (
        <div className='App-body'>
        {token?
        (<div className="Input">
            <div className="Layers">
            <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
               
                name="radio-buttons-group">
                <FormControlLabel value = "addStreetLight" control={<Radio  /> } onChange={(e) => {setAddStreetLight(true); setDeleteStreetLight(false); setShowReports(false); setShowResolvedReports(false); setShowMap(false)}} label="Add streetlight" />
                <FormControlLabel value = "deleteStreetLight" control={<Radio  />} onChange={(e) => {setDeleteStreetLight(true); setAddStreetLight(false); setShowReports(false); setShowResolvedReports(false); setShowMap(false)}}  label="Delete streetlight" />
                <FormControlLabel value = "showReports" control={<Radio  />} onChange={(e) => {setShowReports(true); setAddStreetLight(false); setDeleteStreetLight(false); setShowResolvedReports(false); setShowMap(false)}}  label="Show Reports" />
                <FormControlLabel value = "showResolvedReports" control={<Radio  />} onChange={(e) => {setShowResolvedReports(true); setAddStreetLight(false); setDeleteStreetLight(false); setShowReports(false); setShowMap(false)}}  label="Show Resolved Reports" />
                <FormControlLabel value = "showMap" control={<Radio  />} onChange={(e) => {setShowMap(true); setShowResolvedReports(false); setAddStreetLight(false); setDeleteStreetLight(false); setShowReports(false);}}  label="Reported Lights on Map" />
            </RadioGroup>

            {registerUser?
                 (<div>
                         <Register registered = {registered} setRegistered={setRegistered}/>
                         <br />
                         <Button className="button is-primary" onClick={handleDoneRegisteration}>Back</Button>
                        
                 </div>
                )
              :(<Button className="button is-primary" onClick={handleRegisterUser} >
                Register New Admin
                </Button>)}
            <br />
            <Button className="button is-primary" onClick={handleLogOut}>
                LogOut
            </Button>  
    
            </div>
        </div>):
        (
            
            <div className="LoginCard">
                <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#24a0ed' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
          
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
           
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
          <ErrorMessage message={errorMessage} />
        </Box>
      </Container>
    </ThemeProvider>
    </div>
        )}
        {addStreetLight && token?
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
        {deleteStreetLight && token?
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

        {showReports && token?        
           (<div>
                <div className="ReportsTable">
                    <DataGrid 
                    rows={reports}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                    onSelectionModelChange={(newSelection) => {
                    setSelectionModel(newSelection);
                    console.log(selectionModel);
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

        {showResolvedReports && token?(
            <div className="ReportsTable">
                <DataGrid 
                rows={resolvedReports}
                columns={columns_resolved}
                pageSize={10}
                rowsPerPageOptions={[10]}
                />
            </div>
        ):""}

        {showMap && token? (
        <Wrapper  
            className="Wrapper"
            apiKey={env.GOOGLE_MAPS_API_KEY}
            libraries={['visualization', 'drawing']}
        >
            <Map 
                className="Map"
                center={center}
                zoom={zoom}
                clustererData={reports.map(position=>positionData(position))}
                showLiveData={true}
                showOtherData={true}
                onMarkerClick={onMarkerClick}
            />
        </Wrapper>
    ) : ""}
        
        {showDialog && token?(
            <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Resolve Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
           Reports with the following location and time will get resolved:  {selectionModel.map(val=><p>{val.split(" ")[0]+', '+val.split(" ")[1]}</p>)}
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
