import React, { useEffect, useState,useContext  } from 'react';
import { AppBar, Button, CircularProgress, Toolbar, Typography } from '@mui/material';
import Home from './Components/Home';
import './App.scss'
import Report from './Components/Report';
import Admin from './Components/Admin';
import Login from "./Components/Login";
import Register from './Components/Register';
import env from "react-dotenv";
import { UserContext } from "./context/UserContext";

function App() {
    const [lights, setLights] = useState([]);
    const [allLightsData, setAllLightsData] = useState([]);
    const [loading, setLoading] = useState(false);
  
    const [message, setMessage] = useState("");
    const [token] = useContext(UserContext);


    const pages = ['Home', 'Report', 'About', 'Admin','Login','Register']
    const [currPage, setCurrPage] = useState(pages[0]);
    const page_component = {
        'Home': <Home lights={lights} allLightsData={allLightsData} />,
        'Report': <Report lights={lights} />,
        'About': <div></div>,
        'Admin': token?<Admin setLights = {setLights} />:<Login />,
        'Login': <Login />,
        'Register': <Register/>
    }

    function openPage(page) {
        setCurrPage(page);
    }

    function fetchLights(callback, err) {

        function positionData(position){

            var latLng = new window.google.maps.LatLng({'lng':position['lng'], 'lat':position['lat']});
            var positionData = {'LatLng': latLng, 'CCMS NO':position['CCMS NO'], 'Zone':position['Zone'], 'Type of Light':position['Type of Light'], 'No. Of Lights':position['No. Of Lights'], 'Ward No.':position['Ward No.'] ,'Connected Load':position['Connected Load']};
            return positionData;
        }
        if(lights.length > 0) return callback(lights);
        setLoading(true);
        fetch(env.BACKEND + `/streetlights`)
        .then(response => response.json())
        .then((data) => {

            let temp = data.map(position => positionData(position));
            setAllLightsData(data)
            setLights(temp)
            callback(temp);
            setLoading(false);
        }).catch((e) => {
            console.log(e)
            err(e)
            setLoading(false);
        }).catch((e) => {
            console.log(e)
            err(e)
            setLoading(false);
        })
    }

    useEffect(() => {
        if(lights.length > 0) return;
        fetchLights(() => {}, (err) => console.log(err));
    }, [lights])

    return (
        <div className='App'>
            <AppBar>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Roshni: Women's Safety
                    </Typography>
                    {loading? <CircularProgress color="inherit" />: ""}
                    {pages.map((page) => (
                        <Button
                        key={page}
                        onClick={() => openPage(page)}
                        sx={{ color: 'white', display: 'block' }}
                        >
                        {page}
                        </Button>
                    ))}
                </Toolbar>
            </AppBar>
            {page_component[currPage]}
        </div>
    )
}

export default App;
