// Import express → framework to create server and routes
const express = require("express");

// Import cors → allows frontend (different port) to talk to backend
const cors = require("cors");

// Import morgan → logs requests (useful for debugging)
const morgan = require("morgan");
const helmet  = require("helmet");

// Load environment variables from .env file
require('dotenv').config();

// Import the auth router
const authRoutes = require("./routes/authRoute");

//Import shipping router
const shippingRoutes = require("./routes/shippingRoute");
const trackingRoutes = require("./routes/trackingRoute");

const customerRoutes = require("./routes/customerRoute");
const employeeRoutes = require("./routes/employeeRoute");
const scanRoutes = require("./routes/scanRoute");
// Create app instance
const app = express();

// Global middleware = functions that run before your routes
app.use(helmet());
// Allows requests from frontend (React runs on different port)
app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. "http://localhost:3000"
  credentials: true               // allows cookies/auth headers to be sent cross-origin
}));

app.use(express.json());
// Parses JSON body from requests (important for POST requests)

app.use(morgan("dev"));
// Logs requests in terminal

// Routes

// Public auth routes — no token needed to hit these
// Any request to /api/auth/... gets handed to routes/auth.js
app.use("/api/auth", authRoutes);

app.use("/api/shipping", shippingRoutes);
app.use("/api/tracking", trackingRoutes);

app.use("/api/customer", customerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/scan", scanRoutes);
// Basic test route
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is working!" });
});

// Start server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
});