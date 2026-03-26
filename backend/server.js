// Import express → framework to create server and routes
const express = require("express");

// Import cors → allows frontend (different port) to talk to backend
const cors = require("cors");

// Import morgan → logs requests (useful for debugging)
const morgan = require("morgan");

// Create app instance
const app = express();

// Load environment variables from .env file
require('dotenv').config();

// Middleware = functions that run before your routes

app.use(cors()); 
// Allows requests from frontend (React runs on different port)

app.use(express.json()); 
// Parses JSON body from requests (important for POST requests)

app.use(morgan("dev")); 
// Logs requests in terminal

// Basic test route
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is working!" });
});

// Start server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
});