import React, { useContext, useState } from "react";
import env from "react-dotenv";
import { UserContext } from "../context/UserContext";
import ErrorMessage from "./ErrorMessage";
import { FormControlLabel,  TextField, Typography, Radio, RadioGroup, Input, Button } from "@mui/material";

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

function Register({registered, setRegistered}){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [token,] = useContext(UserContext);

  const submitRegistration = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json",
      Authorization: "Bearer " + token,},
      body: JSON.stringify({ email: email, hashed_password: password }),
    };

    const response = await fetch(env.BACKEND +"/api/users", requestOptions);
    const data = await response.json();

    if(!response.ok || data.detail == "Invalid Email or Password")
      {
          console.log("Admin Session Expired.. Please try logging again!")
          localStorage.setItem("User_Token", null);
          //setToken(null) -- commenting this. Was giving error while building.
          setErrorMessage("Admin Session Expired.. Please try logging again!")
      }
      else {
      // setToken(data.access_token);
      setRegistered("New Admin Registered!! ")
      setErrorMessage("New Admin Registered!! ")
      console.log("New Admin Registered!! ")
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === confirmationPassword && password.length > 5) {
      submitRegistration();
    } else {
      setErrorMessage(
        "Ensure that the passwords match and have greater than 5 characters"
      );
    }
  };

  return (
    <div className="column">
      
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
            Sign up
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
              required
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

            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="Confirm password"
              label="Confirm"
              type="password"
              autoComplete="current-password"
              placeholder="
              confirm password"
              className="input"
              value={confirmationPassword}
              onChange={(e) => setConfirmationPassword(e.target.value)}

            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Register
            </Button>
          </Box>
          <ErrorMessage message={errorMessage} />
        </Box>
        
      </Container>
    </ThemeProvider>
    
  
    </div>
  );
};


export default Register;

