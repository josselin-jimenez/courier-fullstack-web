const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const {
  getCustomerProfile,
  updateProfile,
  updateAddress,
  createCustomerTypeRequest,
  getMyCustomerTypeRequestStatus
} = require("../controllers/customerController");

const {
  getCustomerTypeRequests,
  reviewCustomerTypeRequest
} = require("../controllers/customerServiceController");

const router = express.Router();

router.get("/me", verifyToken, requireRole("customer", "customer service", "admin"), getCustomerProfile);
router.patch("/profile", verifyToken, requireRole("customer"), updateProfile);
router.patch("/address", verifyToken, requireRole("customer"), updateAddress);

router.post("/request", verifyToken, requireRole("customer"), createCustomerTypeRequest);
router.get("/request", verifyToken, requireRole("customer"), getMyCustomerTypeRequestStatus);

router.get("/requests/all", verifyToken, requireRole("customer service", "admin"), getCustomerTypeRequests);
router.patch("/requests/:requestId", verifyToken, requireRole("customer service", "admin"), reviewCustomerTypeRequest);

module.exports = router;