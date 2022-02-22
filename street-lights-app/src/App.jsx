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
    const [loading, setLoading] = useState(false);
  
    const [message, setMessage] = useState("");
    const [token] = useContext(UserContext);

    const getWelcomeMessage = async () => {
        const requestOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        };
        const response = await fetch(env.BACKEND +"/api", requestOptions);
        const data = await response.json();
    
        if (!response.ok) {
          console.log("something messed up");
        } else {
            console.log(data);
          setMessage(data.message);
        }
      };

    useEffect(() => {
        getWelcomeMessage();
      }, []);

    const pages = ['Home', 'Report', 'About', 'Admin','Login','Register']
    const [currPage, setCurrPage] = useState(pages[0]);
    const page_component = {
        'Home': <Home lights={lights} />,
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
        if(lights.length > 0) return callback(lights);
        setLoading(true);
        fetch(env.BACKEND + `/streetlights`)
        .then(response => response.json())
        .then((data) => {
            let temp = data.map(position => new window.google.maps.LatLng(position));
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
