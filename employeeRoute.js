const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getDriverDashboard,
  getHandlerDashboard,
  getAdminDashboard,
} = require("../controllers/employeeController");

const router = express.Router();

router.get("/driver",  verifyToken, requireRole("driver"),  getDriverDashboard);
router.get("/handler", verifyToken, requireRole("handler"), getHandlerDashboard);
router.get("/admin",   verifyToken, requireRole("admin"),   getAdminDashboard);

module.exports = router;