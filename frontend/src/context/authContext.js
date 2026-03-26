// src/context/AuthContext.js
// React context = a way to share state (like the logged-in user) globally
// without passing props through every component

import { createContext, useState, useContext } from "react";
import { jwtDecode } from "jwt-decode";

// Create the context object
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from sessionStorage so token survives page refreshes
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [user, setUser]   = useState(() => {
    const t = sessionStorage.getItem("token");
    return t ? jwtDecode(t) : null;
  });

  // Called after a successful login response from the backend
  const login = (receivedToken) => {
    sessionStorage.setItem("token", receivedToken);
    setToken(receivedToken);
    // jwt-decode reads the payload without verifying the signature
    // Safe to use on the frontend for display purposes (name, role, etc.)
    setUser(jwtDecode(receivedToken));
  };

  // Clears everything — user is logged out
  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can call useAuth() to get token/user/login/logout
export function useAuth() {
  return useContext(AuthContext);
}