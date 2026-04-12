const express = require("express");
const {getServices, createOrder, calculateEstimate } = require("../controllers/shippingController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");


const router = express.Router();

// Public routes
router.get("/services", getServices);
router.post("/estimate", calculateEstimate);

// Private routes
router.post("/order", verifyToken, requireRole("customer", "customer service"), createOrder);

module.exports = router;