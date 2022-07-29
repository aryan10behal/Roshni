import React, { useState, useContext } from "react";
import Button from '@mui/material/Button';
import {  TextField, Typography, Input, Card, CardContent } from "@mui/material";
import { DataGrid, GridToolbarExport, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector } from "@mui/x-data-grid";
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
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
const theme = createTheme();

function Admin({setLights, poleData}) {    

    const [zoom, setZoom] = useState(11);
    const [center, setCenter] = useState({lat: 28.6,lng: 77.15});

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [token, setToken] = useContext(UserContext);

    const [registerUser, setRegisterUser] = useState(null);
    const [registered, setRegistered] = useState(null);



    const [addSingleLightData, setAddSingleLightData] = useState({ccms_no:"", unique_pole_no:"", ward_no:"", zone:"", lat:"", lng:"",type_of_light:"", no_of_lights:"", wattage:""});
    const [deleteSingleLightData, setDeleteSingleLightData] = useState("");

    const [selectedFileAdd, setSelectedFileAdd] = useState();
    const [isFilePickedAdd, setIsFilePickedAdd] = useState(false);
    const [selectedFileDelete, setSelectedFileDelete] = useState();
    const [isFilePickedDelete, setIsFilePickedDelete] = useState(false);

    const [showReports, setShowReports] = useState(true);
    const [showResolvedReports, setShowResolvedReports] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [reports, setReports] = useState(null);
    const [resolvedReports, setResolvedReports] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [adminComment, setAdminComment] = useState(null);

    const [selectionModel, setSelectionModel] = React.useState([]);

    const [selectedLight, setSelectedLight] = useState(null);

    const [options, setOptions] = useState(1);
    const [poleInfo, setPoleInfo]= useState([]);
    //1: Show reports
    //2: Show reports on map
    //3: Show Resolved reports
    //4: Add Streetlights
    //5: Delete Streetlights
    //6: Register New user



    React.useEffect(()=>{
        setToken(localStorage.getItem("User_Token"))
        if(options!=3){
            setShowReports(false);
        }
        if(options!==4){
            setShowResolvedReports(false);
        }

    }, [options])

    //Setting Values for single light data
    const handleChangeSingleLight = (prop) => (event) => {
        setAddSingleLightData({ ...addSingleLightData, [prop]: event.target.value });
        console.log(addSingleLightData);
      };


    //Dialog box
    const [open, setOpen] = React.useState(false);

    // Login Admin
    const submitLogin = async () => {
        if(!email || !password)
        {
            console.log("Email/Password missing")
            return;
        }
        console.log(localStorage.getItem("User_Token"))
        const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: JSON.stringify(
            `grant_type=&username=${email}&password=${password}&scope=&client_id=${1234}&client_secret=${localStorage.getItem("User_Token")}`
        ),
        };

        const response = await fetch(env.BACKEND + "/api/token", requestOptions);
        const data = await response.json();

        if (!response.ok) {
            setErrorMessage(data.detail);
        }
        else if(data.status_code === 401)
        {
            console.log("Already user logged in.. So returning")
            // add some field saying another user already logged-in.
            // add some mechanism to display content as the other admin.. Or let them perform no task...
            return;
        } 
        else {
            console.log("HELLOOO")
            setToken(data.access_token);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submitLogin();
    };

    React.useEffect(()=>{
        if(!token)
        {
            setEmail("");
            setPassword("");
            setErrorMessage("");
            setRegisterUser(null);
            setRegistered(null);
            setSelectedFileAdd();
            setIsFilePickedAdd(false);
            setSelectedFileDelete();
            setIsFilePickedDelete(false);
            setShowReports(false);
            setShowResolvedReports(false);
            setShowMap(false);
            setReports(null);
            setResolvedReports(null)
            setShowDialog(false)
            setAdminComment(null)
        }
    }, [token])

    // Logout Admin
    const handleLogOut = async () => {
        const requestOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
    };

        if(email=="" || password=="") 
        {
            setToken(null)
            return
        }
        const response = await fetch(env.BACKEND + "/logout", requestOptions);
        const data = await response.json();

        if (!response.ok) {
        setErrorMessage(data.detail);
        } else {
        localStorage.setItem("User_Token", null);
        setToken(data.access_token)
        console.log(data.access_token)
        }
    };

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
      
        if(!addSingleLightData) return;

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json",
            Authorization: "Bearer " + token,},
            body: JSON.stringify(
                {
                    ccms_no: addSingleLightData.ccms_no,
                    unique_pole_no: addSingleLightData.unique_pole_no,
                    ward_no: addSingleLightData.ward_no,
                    zone: addSingleLightData.zone,
                    lat: addSingleLightData.lat,
                    lng: addSingleLightData.lng,
                    type_of_light: addSingleLightData.type_of_light,
                    no_of_lights: addSingleLightData.no_of_lights,
                    wattage: addSingleLightData.wattage
                  },
            )
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
       
        if(!deleteSingleLightData) return;

        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json",
            Authorization: "Bearer " + token,},
            body: JSON.stringify(
                { 
                    unique_pole_no: deleteSingleLightData, 
                    more_data: "trying to delete light",
                },
            )
          };   
          const response = await fetch(env.BACKEND + `/deleteLight`, requestOptions);
          const data = await response.json();
      
          if (!response.ok) {
            setErrorMessage(data.detail);
          } else {
            setLights([])
          }
    }


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

    const handleSubmissionAdd = async() => {
        if (!isFilePickedAdd) return;
        const formData = new FormData();
        formData.append("file", selectedFileAdd);
        const requestOptions = {
            method: "POST",
            headers: {
            Authorization: "Bearer " + token,
            },
            body: formData,
          };   
          const response = await fetch(env.BACKEND + `/addLightsFile`, requestOptions);
          const data = await response.json();
          console.log(response)
          console.log(data)
      
          if (!response.ok) {
            setErrorMessage(data.detail);
          } else {
            setLights([])
          }
    }

    // const handleSubmissionDelete = () => {
    //     if (!isFilePickedDelete) return;
    //     const formData = new FormData();
    //     formData.append("file", selectedFileDelete);
    //     fetch(env.BACKEND + `/deleteLightsFile`, {
    //         method:"POST",
    //         body: formData
    //       }).then(setLights([]));  
    // };
    const handleSubmissionDelete = async() => {
        if(!isFilePickedDelete) return;
        const formData = new FormData();
        formData.append("file", selectedFileDelete);
        const requestOptions = {
            method: "POST",
            headers: {
            Authorization: "Bearer " + token,
            },
            body: formData,
          };   
          const response = await fetch(env.BACKEND + `/deleteLightsFile`, requestOptions);
          const data = await response.json();
      
          if (!response.ok) {
            setErrorMessage(data.detail);
          } else {
            setLights([])
          }
    }


    const handleDialog=(reports_to_resolve)=>{
        console.log(reports_to_resolve)
        if(reports_to_resolve.length==0) return;
        setShowDialog(true);
        handleClickOpen();
    }

    const handleResolveReports = async(reports_to_resolve) => {
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json",
            Authorization: "Bearer " + token,},
            body: JSON.stringify({
                id: reports_to_resolve,
                comment: adminComment,
              },
            )
          };    
          const response = await fetch(env.BACKEND + `/resolveReport`, requestOptions);
          const data = await response.json();
      
          if (!response.ok) {
            setErrorMessage(data.detail);
          } else {
            setReports(data);
          }
    }
    
    // const handleResolveReports=(reports_to_resolve)=>{
    //     console.log(encodeURIComponent(reports_to_resolve))
    //     fetch(`${env.BACKEND}/resolveReport?id=${encodeURIComponent(reports_to_resolve)}&comment=${adminComment}`)
    //     .then((response) => {
    //         if(response.status == 200) {
    //             response.json().then((data) => {
    //                 setReports(data);
    //             })
    //         } else {
    //             console.log("Unable to resolve");
    //         }
    //     })
    // }


    
    //Fetching reports
    React.useEffect(()=>{
        if(showReports || options==1 || token)
        {

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
      }

    }, [showReports, options, token])

     //Fetching Resolved reports
     React.useEffect(()=>{
      if(showResolvedReports || options==2)
      {
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
    }

    }, [showResolvedReports, options])



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
        { field: 'date', headerName: 'Date', width:130 },
        { field: 'time', headerName: 'Time', width:130 },
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
        { field: 'id', headerName: 'Report ID', width:230 },
        
        
      ];
      const columns_resolved = [
        { field: 'lat', headerName: 'Latitude', width: 130 },
        { field: 'lng', headerName: 'Longitude', width: 130 },
        { field: 'date', headerName: 'Reported on Date', width:130 },
        { field: 'time', headerName: 'Reported at Time', width:130 },
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
        { field: 'resolved_date', headerName: 'Resolved on Date', width: 130 },
        { field: 'resolved_time', headerName: 'Resolved at Time', width: 130 },
        { field: 'Report Type', headerName: 'Report Type', width:500 },
        { field: 'Comments', headerName: 'Comments', width:500 },
      
      ];
    
      function reportedLightsTableOptions() {
        return (
          <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport 
            csvOptions={{
                fileName: 'Reported_Lights_Report',
              }}/>
          </GridToolbarContainer>
        );
      }
      function resolvedReportTableOptions() {
        return (
          <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport 
            csvOptions={{
                fileName: 'Resolved_Lights_Report',
              }}/>
          </GridToolbarContainer>
        );
      }
      
    
    function positionData(position){

        var latLng = new window.google.maps.LatLng({'lng':position['lng'], 'lat':position['lat']});
        var positionData = {'LatLng': latLng, 'CCMS NO':position['CCMS_no'], 'Zone':position['zone'], 'Type of Light':position['Type_of_Light'], 'No. Of Lights':position['No_Of_Lights'], 'Ward No.':position['Ward_No'] , 'Wattage':position['Wattage'], 'Connected Load':position['Connected Load'], 'Actual Load':position['Actual Load'], 'Unique Pole No.':position['unique_pole_no']};
        return positionData;
    }

    


    //For showing reports on map

     //For grouping data
     function groupData(data){
        let grouped = data.reduce((result, obj) => {
            if (result[obj.LatLng]) {
              result[obj.LatLng].push(obj) 
            } else {
              result[obj.LatLng] = [obj]
            }
            return result
          }, {});
  
        var groups = Object.keys(grouped).map(function (key) {
           
            return {LatLng: grouped[key][0]['LatLng'], poles: grouped[key]};
        });
        
        return groups;
  
    }
    window.poleInfoHandlerAdmin=function(poleId){

        setPoleInfo(poleData[poleId][0])

      }
    
        function markerPoleHandler(marker, positions, map){
    
        
    
        let pole_ids = []


        const pos = positions;
        //const unique_reports = positions.map( (value) => value['Unique Pole No.']).filter( (value, index, _arr) => _arr.indexOf(value) == index);
        const key = 'Unique Pole No.';
        const unique_reports = positions.filter((a, i) => positions.findIndex((s) => a['Unique Pole No.'] === s['Unique Pole No.']) === i)
        for(let i=0; i<unique_reports.length; i++){
          pole_ids.push('<button class="poleIdButton" onClick="poleInfoHandlerAdmin('+"'"+unique_reports[i]['Unique Pole No.']+"'"+')">' + unique_reports[i]['Unique Pole No.']+ '</button><br>')
          
        }
        return pole_ids.join("");
      }

      function removeDuplicatePoleIds(data){

        data.forEach((obj)=>{obj['poles']=obj['poles'].filter((a, i) => obj['poles'].findIndex((s) => a['Unique Pole No.'] === s['Unique Pole No.']) === i)})
   
        return data;
      }
      
    
      function onMarkerClickPre(marker, positions, map){
      
    
        const infowindow = new window.google.maps.InfoWindow({
    
            content: `<div>
                <h4> Pole Ids: </h4>
                <div class = "PoleIds">
                ${markerPoleHandler(marker, positions, map)}
                </div>
                   
            </div>`
        });
      
    
        infowindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
      })
      
       
      };


    return (
        <div>
        {!token? 
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
                        }}>
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
                        sx={{ mt: 3, mb: 2 }} >
                        Sign In
                        </Button>
                    </Box>
                    <ErrorMessage message={errorMessage} />
                 </Box>
                </Container>
            </ThemeProvider>
        </div>
        )
        :
        (
        <div className='App-body' id='Admin-App-Body'>
        <div className="InputAdmin">
            <div className="LayersAdmin">
            <Button className="button is-primary adminButton" onClick={() => {setOptions(1); setShowReports(true);}} >Show Reports</Button>
            <Button className="button is-primary adminButton" onClick={() => setOptions(2)}>Show Reports on Map</Button>
            <Button className="button is-primary adminButton" onClick={() => {setOptions(3); setShowResolvedReports(true);}}>Show Resolved Reports</Button>
            <Button className="button is-primary adminButton" onClick={() => setOptions(4)}>Add Streetlight</Button>
            <Button className="button is-primary adminButton" onClick={() => setOptions(5)}>Delete StreetLight</Button>
            <Button className="button is-primary adminButton" onClick={(e)=>{handleRegisterUser(e); setOptions(6);}} >Register New Admin</Button>
            
            <Button className="button is-primary adminButton" onClick={handleLogOut}>
                LogOut
            </Button>  
    
            </div>
        </div>
        {token && options==6?(
             <div className="AdminRightWrapper">
                 {console.log(token)}
             <Register registered = {registered} setRegistered={setRegistered}/>
             {/* <br />
             <Button className="button is-primary" onClick={handleDoneRegisteration}>Back</Button> */}
            
     </div>
        ):""}
        {token && options==4?
            (   
                <div className="AdminRightWrapper">
                   
                    <Card variant="outlined">
                        <CardContent>
                        <h5 className = "AdminHeadings">Add Single Light</h5>    
                        <div className = "LayersAdminSingleLight">
                        <TextField className="Input-Field" variant="standard" label="CCMS No."  type = "text" onChange={handleChangeSingleLight('ccms_no')}/>  
                        <TextField className="Input-Field" variant="standard" label="Unqiue Pole No."  type = "text" onChange={handleChangeSingleLight('unique_pole_no')}/>
                        <TextField className="Input-Field" variant="standard" label="Ward No."  type = "text" onChange={handleChangeSingleLight('ward_no')}/>
                        <TextField className="Input-Field" variant="standard" label="Zone"  type = "text" onChange={handleChangeSingleLight('zone')}/>
                        </div>
                        <div className = "LayersAdminSingleLight">
                        <TextField className="Input-Field" variant="standard" label="Latitude"  type = "text" onChange={handleChangeSingleLight('lat')}/>
                        <TextField className="Input-Field" variant="standard" label="Longitude"  type = "text" onChange={handleChangeSingleLight('lng')}/>
                        <TextField className="Input-Field" variant="standard" label="Type of Light"  type = "text" onChange={handleChangeSingleLight('type_of_light')}/>
                        <TextField className="Input-Field" variant="standard" label="No. of Lights"  type = "text" onChange={handleChangeSingleLight('no_of_lights')}/>
                        <TextField className="Input-Field" variant="standard" label="Wattage"  type = "text" onChange={handleChangeSingleLight('wattage')}/>
                        </div>
                <div className="ButtonAdminCrud"><Button variant = "contained" onClick={addLight}>Add Single Light</Button></div>
                        </CardContent>
                    </Card>

            <Card variant="outlined">
             <CardContent>
                    
            <h5 className = "AdminHeadings">Add Multiple Lights (CSV)</h5>       
              <div className = "LayersAdminCSV">
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
                <Button variant="contained" onClick={handleSubmissionAdd}>Add Lights</Button>
              
                </div>
                </CardContent>
                    </Card>

           
                
                </div>
            ) : ""}
            {token && options==5? 
            (   
                <div className="AdminRightWrapper">
                   
                    <Card variant="outlined">
                        <CardContent>
                        <h5 className = "AdminHeadings">Delete Single Light</h5>    

                        <TextField className="Input-Field" variant="standard" label="Unique Pole No."  type = "text" onChange={(e)=>setDeleteSingleLightData(e.target.value)}/>  

                      
                <div className="ButtonAdminCrud"><Button variant = "contained" onClick={deleteLight}>Delete Single Light</Button></div>
                        </CardContent>
                    </Card>

            <Card variant="outlined">
             <CardContent>
                    
            <h5 className = "AdminHeadings">Delete Multiple Lights (CSV)</h5>       
              <div className = "LayersAdminCSV">
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
                <Button variant="contained" onClick={handleSubmissionDelete}>Delete Lights</Button>
              
                </div>
                </CardContent>
                    </Card>
                </div>
            ) : ""}
    
            {token && options==1?      
               (<div className = "AdminRightWrapper">
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
                        
                        components={
                            {
                                Toolbar: reportedLightsTableOptions, 
                            }
                        }
                        />
                        <Button variant="contained"  onClick={()=>{
                            handleDialog(selectionModel);
                            }}component="span" className = "AdminUpload" >
                            Resolve
                        </Button>
                    </div>
                </div>   
            ):""}
    
            {token && options==3?(
                <div className = "AdminRightWrapper">
                <div className="ReportsTable">
                    <DataGrid 
                    rows={resolvedReports}
                    columns={columns_resolved}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    components={
                        {
                            Toolbar: resolvedReportTableOptions, 
                        }
                    }
                    />
                </div>
                </div>
            ):""}
            {token && options==2? 
            (
            <Wrapper  
                className="Wrapper"
                apiKey={env.GOOGLE_MAPS_API_KEY}
                libraries={['visualization', 'drawing']}>
                <Map 
                    className="Map"
                    center={center}
                    zoom={zoom}
                    clustererData={!reports?[]:removeDuplicatePoleIds(groupData(reports.map(position=>positionData(position))))}
                    showLiveData={true}
                    showOtherData={true}
                    onMarkerClickPre={onMarkerClickPre}
                />
            </Wrapper>
            ) : ""}
            
            {token && showDialog?(
                <div>
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogContent>
              <DialogContentText>
               Reports with the following report ID will get resolved:  {selectionModel.map(val=><p>{val.split(" ")[0]}</p>)}
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
              <Button onClick={()=>{handleResolveReports(String(selectionModel));handleClose()}}>Resolve</Button>
            </DialogActions>
          </Dialog>
        </div>):""}
    </div>)
        }
    </div>
  )
 
  
}

export default Admin;
