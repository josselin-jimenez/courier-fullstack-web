const express = require("express");
const { getTrackingByNumber } = require("../controllers/trackingController");

const router = express.Router();

// Public tracking route
router.get("/:trackingNumber", getTrackingByNumber);

module.exports = router;