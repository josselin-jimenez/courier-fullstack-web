const express = require("express");
const {getServices, createOrder, calculateEstimate } = require("../controllers/shippingController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/services", getServices);
router.post("/estimate", calculateEstimate);

// Private routes
router.post("/order", verifyToken, createOrder);

module.exports = router;