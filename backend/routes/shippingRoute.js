const express = require("express");
const {getServices, calculateEstimate, getQuote, createShipment } = require("../controllers/shippingController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { verifyShipment, attachCustomerOrigin } = require("../middleware/shippingMiddleware");


const router = express.Router();

// Public routes
router.get("/services", getServices);
router.post("/estimate", verifyShipment, calculateEstimate);

// Private routes
router.post("/quote", verifyToken, requireRole("customer"), attachCustomerOrigin, verifyShipment, getQuote);
router.post("/payment", verifyToken, requireRole("customer"), attachCustomerOrigin, verifyShipment, createShipment);

module.exports = router;