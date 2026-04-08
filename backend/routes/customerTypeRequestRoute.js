const express = require("express");
const {
  createCustomerTypeRequest,
  getMyCustomerTypeRequestStatus
} = require("../controllers/customerTypeRequestController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Only logged-in customers can use these
router.get(
  "/me",
  verifyToken,
  requireRole("customer"),
  getMyCustomerTypeRequestStatus
);

router.post(
  "/",
  verifyToken,
  requireRole("customer"),
  createCustomerTypeRequest
);

module.exports = router;