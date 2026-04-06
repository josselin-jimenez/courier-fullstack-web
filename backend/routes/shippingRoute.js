const express = require("express");
const {getServices, createOrder, calculateEstimate } = require("../controllers/shippingController");
const { verifyToken }            = require("../middleware/authMiddleware");
const { validateShipment } = require("../middleware/shippingMiddleware");

const router = express.Router();

// Public routes
router.get("/services", getServices);
router.post("/estimate", validateShipment, calculateEstimate);

// Private routes
router.post("/order",    verifyToken, validateShipment, createOrder);

module.exports = router;