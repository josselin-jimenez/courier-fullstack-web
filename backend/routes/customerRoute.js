const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getCustomerProfile,
  createCustomerTypeRequest,
  getMyCustomerTypeRequestStatus,
  getCustomerTypeRequests,
  reviewCustomerTypeRequest
} = require("../controllers/customerController");

const router = express.Router();

router.get("/me", verifyToken, requireRole("customer", "customer service", "admin"), getCustomerProfile);

router.post("/request", verifyToken, requireRole("customer"), createCustomerTypeRequest);
router.get("/request", verifyToken, requireRole("customer"), getMyCustomerTypeRequestStatus);

router.get("/requests/all", verifyToken, requireRole("customer service", "admin"), getCustomerTypeRequests);
router.patch("/requests/:requestId", verifyToken, requireRole("customer service", "admin"), reviewCustomerTypeRequest);

module.exports = router;