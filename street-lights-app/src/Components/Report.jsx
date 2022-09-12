
import { Alert, Button, Checkbox, IconButton, TextField, FormControlLabel } from "@mui/material";
import { useState } from "react";
import Search from "@mui/icons-material/Search";
import CancelIcon from '@mui/icons-material/Cancel';
import Map from "./Map";
import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import '../App.scss';
import WrongLocation from "@mui/icons-material/WrongLocation";
import { GridCheckCircleIcon } from "@mui/x-data-grid";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


function Report({lights, poleData}) {    

    const [locality, setLocality] = useState(null);
    const [zoom, setZoom] = useState(11);
    const [center, setCenter] = useState({lat: 28.6,lng: 77.15});
    const [selectedLight, setSelectedLight] = useState([]);
    const [reportRegion, setReportRegion] = useState(false);
    const [reportedCircle, setReportedCircle] = useState(null);
    const [reports, setReports] = useState([]);
      //For seeing current pole data
    const [poleInfo, setPoleInfo]= useState([]);
    const [reportFlag, setReportFlag] = useState(false);



    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState("");

  

    function zoomToLocality() {
        fetch(`${env.BACKEND}/place?query=${locality}`)
        .then((response) => response.json())
        .then((data) => {
            setCenter({lat: data.lat, lng: data.lng})
            setZoom(15);
        }).catch((err) => {
            console.log(err);
        });
    }

    window.poleInfoHandlerReport=function(poleId){

      
        setPoleInfo(poleData[poleId][0])
        setReportFlag(false);
        setSelectedLight(poleData[poleId][0]);
        
    
      }
    
      function markerPoleHandler(marker, positions, map){
    
        let pole_ids = []
        for(let i=0; i<positions.length; i++){
          pole_ids.push('<button class="poleIdButton" onClick="poleInfoHandlerReport('+"'"+positions[i]["Unique Pole No."]+"'"+')">' + positions[i]["Unique Pole No."] + '</button><br>')
          
        }
        return pole_ids.join("");
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

  


    function selectRegion(circle) {
        setReportedCircle(circle);
    }

    function report(issue, contact) {
        let request = `${env.BACKEND}/report_region?center=${reportedCircle.getCenter()}&radius=${reportedCircle.getRadius()}&phone_no=${contact}&report_type=${issue}`;
        console.log(request)
        fetch(request).then(() => {
            setReportRegion(false);
        })
    }

    return (
    <div className='App-body'>

        <div className="Input">
            <div className="Layers">
                <div className="Input-Field">
                    <TextField 
                        className="Input"
                        variant="standard" 
                        label="Locality" 
                        onChange={(e) => setLocality(e.target.value)} 
                        type = "text"
                    />
                    <IconButton className="Button" onClick={zoomToLocality}>
                        <Search />
                    </IconButton>
                </div>
                <div>
                    {!reportRegion ?  <Button style={{marginRight:'4px'}} variant="outlined" onClick={() => setReportRegion(true)}> <WrongLocation /> Report Region</Button> : ""}
                    {reportRegion ? <Button style={{marginRight:'4px'}} variant="outlined" color="success" disabled={!reportedCircle} onClick={() => setOpen(true)}> <GridCheckCircleIcon /> </Button> : ""}
                    {reportRegion ? <Button style={{marginRight:'4px'}} variant="outlined" color="error" onClick={() => {setReportRegion(false);setReportedCircle(null)}}> <CancelIcon /> </Button> : ""}
                </div>
                <SelectedLight light={selectedLight} reportFlag={reportFlag} setReportFlag={setReportFlag} reports={reports} setReports={setReports} />

                {open ? <ReportForm report={report} open={open} setOpen={setOpen} setToast={toast} /> : ""}
            </div>
            {toast}
        </div>
        <Wrapper  
            className="Wrapper"
            apiKey={env.GOOGLE_MAPS_API_KEY}
            libraries={['visualization', 'drawing']}
        >
            <Map 
                className="Map"
                center={center}
                zoom={zoom}
                clustererData={lights}
                onMarkerClickPre={onMarkerClickPre}
                showLiveData={true}
                showOtherData={true}
                allowReportRegion={reportRegion}
                selectRegion={selectRegion}
                reportCircle={reportedCircle}
            />
        </Wrapper>
    </div>
    )
}


function SelectedLight({light, reports, reportFlag, setReportFlag, setReports}) {

    const [status, setStatus] = useState(false);
    const [toast, setToast] = useState("");
    const [open, setOpen] = useState(false);

    if(light.length == 0) {
        return "";
    }
    const REPORT = false;
    const REPORTING = true;

    let Report_Button = (<Button onClick={() => setOpen(true)}> <WrongLocation />  Report Light</Button>)
    let Reporting_Button = (<Button disabled={true}>Reporting Light</Button>)
    let ReportedButton = (<Button disabled={true}>Reported</Button>)
    
    let FailToast = (<Alert severity="error">Failed to Report</Alert>)
    let CheckFormToast = (<Alert severity="error">Please choose the problem or specify in other</Alert>)
    let SuccessToast = (<Alert severity="success">Thank you for reporting!</Alert>)

    function reportLight(issue, contact) {
        setStatus(REPORTING)
        let request = `${env.BACKEND}/report?pole_id=${light['Unique Pole No.']}&phone_no=${contact}&report_type=${issue}`
        console.log(request)
        fetch(request)
        .then((response) => {
            setStatus(REPORT);
            if(response.status == 200) {
                setToast(SuccessToast)
                response.json().then((data) => {
                    setReports(data);
                    setReportFlag(true);
                })
            } else {
                setToast(FailToast)
            }
        }).catch(() => {
            setStatus(REPORT);
            setToast(FailToast)
        })
    }

    let Report = "";
   
    if(reportFlag){
        Report = ReportedButton;
    }
    else if(status == REPORTING) {
        Report = Reporting_Button
    } else {
        Report = Report_Button
    }

    return (<div className="Selected-Light">
        <div>Latitude: {light['LatLng'].lat()}</div>
            <div>Longitude: {light['LatLng'].lng()}</div>
            <div>CCMS No.: {light['CCMS NO']}</div>
            <div>Type of Light: {light['Type of Light']}</div>
            <div>No. Of Lights: {light['No. Of Lights']}</div>
            <div>Wattage: {light['Wattage']}</div>
            <div>Connected Load: {light['Connected Load']!=-1?light['Connected Load']:0}</div>
            <div>Actual Load: {light['Actual Load']!=-1?light['Actual Load']:0}</div>
            <div>Unique Pole No.: {light['Unique Pole No.']}</div>
            <div>Agency: {light['Unique Pole No.']?light['Unique Pole No.'].toString().slice(0,2):''}</div>
            <div>Zone: {light['Unique Pole No.']?light['Unique Pole No.'].toString().slice(2,4):light['Zone']}</div>
            <div>Ward No.: {light['Unique Pole No.']?light['Unique Pole No.'].toString().slice(4,7):light['Ward No.']}</div>
            <div>Unique No.: {light['Unique Pole No.']?light['Unique Pole No.'].toString().slice(7,):""}</div>
        <div className="Report-Button">
            {Report}
        </div>
        {open ? <ReportForm report={reportLight}  open={open} setOpen={setOpen} setToast={setToast} /> : ""}
        {reportFlag?toast:""}
    </div>)
}


function ReportList({reports}) {
    return <div>
        {reports?.map((report) => <div>{report.lat} {report.lng} {Date(report.datetime)}</div>)}
    </div>
}

function ReportForm({report, open, setOpen, setToast}) {
    const [report_1, setReport_1] = useState(false);
    const [report_2, setReport_2] = useState(false);
    const [report_3, setReport_3] = useState(false);
    const [report_4, setReport_4] = useState("");
    const [report_5, setReport_5] = useState("");

    let Report_1_Checkbox = (<FormControlLabel control={<Checkbox variant="standard" onChange={(e) => setReport_1(e.target.value)}/>} label="Report: not working" />)
    let Report_2_Checkbox = (<FormControlLabel control={<Checkbox variant="standard" onClick={(e) => setReport_2(e.target.value)} />} label="Report: dim" />)
    let Report_3_Checkbox = (<FormControlLabel control={<Checkbox variant="standard" onClick={(e) => setReport_3(e.target.value)} />} label="Report: Pole is tilted" />)
    let Report_4_Textbox = (<TextField variant="standard" label="Other" onChange={(e) => setReport_4(e.target.value)} type = "text" />)
    let Report_5_Textbox = (<TextField variant="standard" label="Contact Number" onChange={(e) => setReport_5(e.target.value)} type = "text" />)



    let CheckFormToast = (<Alert severity="error">Please choose the problem or specify in other. Mention the mail id</Alert>)

    function getIssueAndContact() {
       
        if(!report_1 && !report_2 && !report_3 && report_4 == "") {
            setToast(CheckFormToast);
            return;
        }
        let report_type=""
        if(report_1){
            report_type+="Not Working "
        }
        if(report_2){
            report_type+="Dim Light "
        }
        if(report_3){
            report_type+="Pole is Tilted "
        }
        report_type+=report_4

     

        return {issue: report_type, contact: report_5}
    }

    return (
    <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Report</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Please select one of the following issues in this region:
                <DialogActions className="Input">
                <div className="Layers">
                    {Report_1_Checkbox}
                    {Report_2_Checkbox}
                    {Report_3_Checkbox}
                    {Report_4_Textbox}
                    {Report_5_Textbox}
                </div>
                </DialogActions>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={()=>{let issueAndContact = getIssueAndContact();report(issueAndContact['issue'], issueAndContact['contact']);setOpen(false)}}>Report</Button>
        </DialogActions>
    </Dialog>)
}


export default Report;