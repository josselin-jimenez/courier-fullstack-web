// routes/employeeRoute.js
const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getDriverDashboard,
  getHandlerDashboard,
  getAdminDashboard,
  getRevenueReport,
  addEmployee,
  editEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.get("/driver",  verifyToken, requireRole("driver"),  getDriverDashboard);
router.get("/handler", verifyToken, requireRole("handler"), getHandlerDashboard);
router.get("/admin",   verifyToken, requireRole("admin"),   getAdminDashboard);

router.get("/admin/revenue",           verifyToken, requireRole("admin"), getRevenueReport);
router.post("/admin/add-employee",     verifyToken, requireRole("admin"), addEmployee);
router.patch("/admin/edit/:userId",    verifyToken, requireRole("admin"), editEmployee);
router.delete("/admin/delete/:userId", verifyToken, requireRole("admin"), deleteEmployee);

module.exports = router;