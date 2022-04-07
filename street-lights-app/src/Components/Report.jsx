
import { Alert, Button, Checkbox, IconButton, TextField, FormControlLabel } from "@mui/material";
import { useEffect, useState } from "react";
import Search from "@mui/icons-material/Search";
import Map from "./Map";
import { Wrapper } from "@googlemaps/react-wrapper";
import env from "react-dotenv";
import '../App.scss';


function Report({lights}) {    

    const [locality, setLocality] = useState(null);
    const [zoom, setZoom] = useState(11);
    const [center, setCenter] = useState({lat: 28.6,lng: 77.15});
    const [selectedLight, setSelectedLight] = useState(null);
    const [reports, setReports] = useState(null)

    useEffect(() => {
        if(reports == null) {
            fetch(`${env.BACKEND}/reports`)
            .then((response) => response.json())
            .then((data) => setReports(data)) 
        }
    }, [reports])

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

    function onMarkerClick(marker, position, map) {
        let id = `${marker.position.lat()},${marker.position.lng()}`;
        const infowindow = new window.google.maps.InfoWindow({
            content: `<div>
            <div>Latitude: ${marker.position.lat()}</div>
            <div>Longitude: ${marker.position.lng()}</div>
            <div>CCMS No.: ${position['CCMS NO']}</div>
            <div>Zone: ${position['Zone']}</div>
            <div>Ward No.: ${position['Ward No.']}</div>
            <div>Type of Light: ${position['Type of Light']}</div>
            <div>No. Of Lights: ${position['No. Of Lights']}</div>
            <div>Wattage: ${parseInt(position['Wattage'])}</div>
            <div>Connected Load: ${position['Connected Load']!=-1?position['Connected Load']:0}</div>
            <div>Actual Load: ${position['Actual Load']!=-1?position['Actual Load']:0}</div>
            <div>status: ${marker.status ? "Not Working" : "Working"}</div>
            </div>`,
        });
        infowindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
        })
        setSelectedLight({lat: marker.position.lat(), lng: marker.position.lng(), CCMS_NO:position['CCMS NO'], Zone:position['Zone'], Type_of_light:position['Type of Light'], No_of_lights:position['No. Of Lights'], Wattage:position['Wattage'], connected_load:position['Connected Load'], actual_load:position['Actual Load'], ward_no:position['Ward No.'] });
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
                <SelectedLight light={selectedLight} reports={reports} setReports={setReports} />
                {/* <ReportList reports={reports} /> */}
            </div>
        </div>
        <Wrapper  
            className="Wrapper"
            apiKey={env.GOOGLE_MAPS_API_KEY}
            libraries={['visualization']}
        >
            <Map 
                className="Map"
                center={center}
                zoom={zoom}
                clustererData={lights}
                onMarkerClick={onMarkerClick}
                showLiveData={true}
                showOtherData={true}
            />
        </Wrapper>
    </div>
    )
}


function SelectedLight({light, reports, setReports}) {
    const [status, setStatus] = useState(false);
    const [Toast, setToast] = useState("");
    const [report_1, setReport_1] = useState(false);
    const [report_2, setReport_2] = useState(false);
    const [report_3, setReport_3] = useState(false);
    const [report_4, setReport_4] = useState("");
    const [report_5, setReport_5] = useState("");
    if(light == null) {
        return "";
    }
    const REPORT = false;
    const REPORTING = true;

    let Report_1_Checkbox = (<FormControlLabel control={<Checkbox variant="standard" onChange={(e) => setReport_1(e.target.value)}/>} label="Report: not working" />)
    let Report_2_Checkbox = (<FormControlLabel control={<Checkbox variant="standard" onClick={(e) => setReport_2(e.target.value)} />} label="Report: dim" />)
    let Report_3_Checkbox = (<FormControlLabel control={<Checkbox variant="standard" onClick={(e) => setReport_3(e.target.value)} />} label="Report: Pole is tilted" />)
    let Report_4_Textbox = (<TextField variant="standard" label="Other" onChange={(e) => setReport_4(e.target.value)} type = "text" />)
    let Report_5_Textbox = (<TextField variant="standard" label="Contact Number" onChange={(e) => setReport_5(e.target.value)} type = "text" />)

    let Report_Button = (<Button onClick={() => reportLight(report_1, report_2, report_3, report_4, report_5)}>Report Light</Button>)
    let Reporting_Button = (<Button disabled={true}>Reporting Light</Button>)
    let ReportedButton = (<Button disabled={true}>Reported</Button>)
    
    let FailToast = (<Alert severity="error">Failed to Report</Alert>)
    let CheckFormToast = (<Alert severity="error">Please choose the problem or specify in other</Alert>)
    let SuccessToast = (<Alert severity="success">Thank you for reporting!</Alert>)

    function reportLight(option_1, option_2, option_3, option_4, option_5) {
        if(!option_1 && !option_2 && !option_3 && option_4 == "") {
            setToast(CheckFormToast);
            return;
        }
        let report_type=""
        if(option_1){
            report_type+="Not Working "
        }
        if(option_2){
            report_type+="Dim Light "
        }
        if(option_3){
            report_type+="Pole is Tilted "
        }
        report_type+=option_4


        setStatus(REPORTING)
        fetch(`${env.BACKEND}/report?lat=${light.lat}&lng=${light.lng}&CCMS_no=${light.CCMS_NO}&zone=${light.Zone}&Type_of_Light=${light.Type_of_light}&No_Of_Lights=${light.No_of_lights}&Ward_No=${light.ward_no}&Wattage=${light.Wattage}&Connected_Load=${light.connected_load}&Actual_load=${light.actual_load}&phone_no=${option_5}&report_type=${report_type}`)
        .then((response) => {
            setStatus(REPORT);
            if(response.status == 200) {
                setToast(SuccessToast)
                response.json().then((data) => {
                    setReports(data);
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
    if(reports.find((report) => report.lng == light.lng && report.lat == light.lat)) {
        Report = ReportedButton
    } else if(status == REPORTING) {
        Report = Reporting_Button
    } else {
        Report = Report_Button
    }

    return (<div className="Selected-Light">
        <div>Latitude: {light.lat}</div>
        <div>Longitude: {light.lng}</div>
        <div>Current Status: {light.status ? "Not Working" : "Working"}</div>
        <div className="Layers">
            {Report_1_Checkbox}
            {Report_2_Checkbox}
            {Report_3_Checkbox}
            {Report_4_Textbox}
            {Report_5_Textbox}
        </div>
        <div className="Report-Button">
            {Report}
        </div>
        {Toast}
    </div>)
}


function ReportList({reports}) {
    return <div>
        {reports?.map((report) => <div>{report.lat} {report.lng} {Date(report.datetime)}</div>)}
    </div>
}


export default Report;