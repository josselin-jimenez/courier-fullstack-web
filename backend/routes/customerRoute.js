const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { getCustomerProfile, createCustomerTypeRequest, getMyCustomerTypeRequestStatus } = require("../controllers/customerController");

const router = express.Router();

router.get("/me", verifyToken, requireRole("customer", "customer service", "admin"), getCustomerProfile);

router.post("/request", verifyToken, requireRole("customer"), createCustomerTypeRequest);
router.get("/request", verifyToken, requireRole("customer"), getMyCustomerTypeRequestStatus);

module.exports = router;