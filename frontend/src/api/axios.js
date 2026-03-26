// src/api/axios.js
// A configured Axios instance that automatically adds the Authorization header

import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL // e.g. "http://localhost:5000"
});

// An interceptor runs before every request
// We read the token from sessionStorage as a bridge
// (In a fuller app you'd pass it from context, but interceptors can't use hooks)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    // Attach the token in the format the backend expects: "Bearer <token>"
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default api;