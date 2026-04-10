const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { getCustomerProfile } = require("../controllers/customerController");

const router = express.Router();

router.get("/me", verifyToken, getCustomerProfile);

module.exports = router;