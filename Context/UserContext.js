import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  if(user){
    console.log(user.email,"logged in")
  }


  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// call useUser if you want to set user easier 
// instead of call useContext(UserContext) every time
export const useUser = () => useContext(UserContext);
