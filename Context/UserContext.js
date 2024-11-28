import React, { createContext, useState, useContext, useEffect } from "react";
import { FIREBASE_AUTH } from "../firebase/firebaseConfig";
import { userService } from "../firebase/services/userService";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // monitor user authentication state
  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const userProfile = await userService.getUserProfile(
              firebaseUser.uid
            );
            setUser(
              userProfile ? { ...firebaseUser, ...userProfile } : firebaseUser
            );
          } else {
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
      setUser(null);
    };
  }, []);

  // sign out user
  const signOut = async () => {
    try {
      setLoading(true);
      await FIREBASE_AUTH.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        signOut,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
