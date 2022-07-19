import React, { useEffect, useState,useContext  } from 'react';
import { AppBar, Button, CircularProgress, Toolbar, Typography } from '@mui/material';
import Home from './Components/Home';
import './App.scss'
import Report from './Components/Report';
import Admin from './Components/Admin';
import env from "react-dotenv";


function App() {
    const [lights, setLights] = useState([]);
    const [poleData, setPoleData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [totalpage, setTotalPage] = useState("")

    const pages = ['Home', 'Report', 'About', 'Admin']
    const [currPage, setCurrPage] = useState(pages[0]);
    const page_component = {
        'Home': <Home lights={lights} poleData={poleData}/>,
        'Report': <Report lights={lights} poleData={poleData}/>,
        'About': <div></div>,
        'Admin': <Admin setLights = {setLights} poleData={poleData}/>,
    }

    function openPage(page) {
        setCurrPage(page);
    }

    useEffect(() => {
        getPages();
    }, []);

    const getPages = async () => {
        const response = await fetch(env.BACKEND + `/total_pages`)
        const json = await response.json()
        setTotalPage(json);
    }
    
    function fetchLights(callback, err) {

        function positionData(position){

            var latLng = new window.google.maps.LatLng({'lng':position['lng'], 'lat':position['lat']});
            var positionData = {'LatLng': latLng, 'CCMS NO':position['CCMS_no'], 'Zone':position['zone'], 'Type of Light':position['Type of Light'], 'No. Of Lights':position['No. Of Lights'], 'Ward No.':position['Ward No.'] , 'Wattage':position['Wattage'], 'Connected Load':position['Connected Load'], 'Actual Load':position['Actual Load'],'Unique Pole No.':position['Unique Pole No.']};
            return positionData;
        }

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

        if(lights.length > 0) return callback(lights);
        setLoading(true);

        if(totalpage == "") return callback(lights)

        const urls = []
        for(let i = 0;i<totalpage;i++)
        {
            urls.push(env.BACKEND + `/streetlights?page_no=${i}`)
        }
        const requests = urls.map((url) => fetch(url));
        Promise.all(requests)
        .then((responses)=>
        {
            const errors = responses.filter((response) => !response.ok);

            if (errors.length > 0) {
                throw errors.map((response) => Error(response.statusText));
            }

            const json = responses.map((response) => response.json());
            return Promise.all(json);
        })
        .then((data) => {
            
            const all_data = []
            data.forEach((datum) => {
                all_data.push(...datum)
            });
  
            
            let temp = all_data.map(position => positionData(position)); 
            let groupedData = groupData(temp);
            

            let grouped = temp.reduce((result, obj) => {
                if (result[obj['Unique Pole No.']]) {
                  result[obj['Unique Pole No.']].push(obj) 
                } else {
                  result[obj['Unique Pole No.']] = [obj]
                }
                return result
              }, {});

            setPoleData(grouped);
        
            console.log(grouped)
            setLights(groupedData);
            callback(groupedData);
            setLoading(false);
          })
          .catch((errors) => {
            errors.forEach((error) => {
                console.error(error)
                setLoading(false);
            });
          });
    }

    useEffect(() => {
        if(lights.length > 0) return;
        fetchLights(() => {}, (err) => console.log(err));
        setInterval(() => fetchLights(() => {}, (err) => console.log(err)), 500000);
    }, [lights, totalpage])

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
