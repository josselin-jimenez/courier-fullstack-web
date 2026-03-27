// routes/auth.js
// This file's only job is to map URLs to controller functions.
// No logic lives here — just routing.

const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { verifyToken }            = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes — no token needed
router.post("/register", register);  // calls the register function from the controller
router.post("/login",    login);     // calls the login function from the controller

// Protected route — verifyToken runs first, then getMe
// If verifyToken rejects the request, getMe never runs
router.get("/me", verifyToken, getMe);

module.exports = router;
