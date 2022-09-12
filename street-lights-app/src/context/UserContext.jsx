import React, { createContext, useEffect, useState } from "react";
import env from "react-dotenv";
export const UserContext = createContext();

export const UserProvider = (props) => {
  const [token, setToken] = useState(localStorage.getItem("User_Token"));

  useEffect(() => {
    const fetchUser = async () => {
      const requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      };

      const response = await fetch(env.BACKEND +"/api/users/me", requestOptions);
      
      if (!response.ok) {
          console.log(token, "##user context ka bhi response dekh lo: ", response.json())
          if(token){console.log("ki bane duniya da");setToken(null);}
      }
      localStorage.setItem("User_Token", token);
    };
    fetchUser();
  }, [token]);

  return (
    <UserContext.Provider value={[token, setToken]}>
      {props.children}
    </UserContext.Provider>
  );
};