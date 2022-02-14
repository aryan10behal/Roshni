import { Alert, Button, IconButton, TextField } from "@mui/material";
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

    function onMarkerClick(marker, map) {
        let id = `${marker.position.lat()},${marker.position.lng()}`;
        const infowindow = new window.google.maps.InfoWindow({
            content: `<div>
                <div>latitude: ${marker.position.lat()}</div>
                <div>longitude: ${marker.position.lng()}</div>
                <div>status: ${marker.status ? "Not Working" : "Working"}</div>
            </div>`,
        });
        infowindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
        })
        setSelectedLight({lat: marker.position.lat(), lng: marker.position.lng()});
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
                <ReportList reports={reports} />
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
            />
        </Wrapper>
    </div>
    )
}


function SelectedLight({light, reports, setReports}) {
    const [status, setStatus] = useState(false);
    if(light == null) {
        return "";
    }
    const REPORT = 0, REPORTING = 1;
    let Button_ = ""
    let ReportButton = (<Button onClick={reportLight}>Report as not working</Button>)
    let ReportingButton = (<Button onClick={reportLight} disabled={true}>Report as not working</Button>)
    let ReportedButton = (<Button onClick={reportLight} disabled={true}>Reported</Button>)
    let Toast = ""
    let FailToast = (<Alert severity="error">Failed to Report</Alert>)
    let SuccessToast = (<Alert severity="success">Thank you for reporting!</Alert>)

    function reportLight() {
        console.log("here")
        setStatus(REPORTING)
        fetch(`${env.BACKEND}/report?lat=${light.lat}&lng=${light.lng}`)
        .then((response) => {
            setStatus(REPORT);
            if(response.status == 200) {
                Toast = SuccessToast;
                response.json().then((data) => {
                    setReports(data);
                })
            } else {
                Toast = FailToast;
            }
        }).catch(() => {
            setStatus(REPORT);
            Toast = FailToast;
        })
    }

    if(reports.find((report) => report.lng == light.lng && report.lat == light.lat)) {
        Button_ = ReportedButton
    } else if(status == REPORTING) {
        Button_ = ReportingButton
    } else {
        Button_ = ReportButton
    }

    return (<div className="Selected-Light">
        <div>Latitude: {light.lat}</div>
        <div>Longitude: {light.lng}</div>
        <div>Current Status: {light.status ? "Not Working" : "Working"}</div>
        <div className="Report-Button">
            {Button_}
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