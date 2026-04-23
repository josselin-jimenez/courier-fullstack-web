const express = require("express");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const {
  getPackageStatuses,
  searchPackage,
  handlerScan,
  driverScan,
  getVehicles,
  editCustomerType,
} = require("../controllers/scanController");

const router = express.Router();

router.get("/statuses", verifyToken, requireRole("handler", "driver", "admin"), getPackageStatuses);
router.get("/search",   verifyToken, requireRole("handler", "driver", "admin"), searchPackage);

router.post("/handler", verifyToken, requireRole("handler"), handlerScan);

router.post("/driver",  verifyToken, requireRole("driver"),  driverScan);
router.get("/vehicles", verifyToken, requireRole("driver", "admin"), getVehicles);

router.patch("/admin/customer/:userId", verifyToken, requireRole("admin"), editCustomerType);

module.exports = router;