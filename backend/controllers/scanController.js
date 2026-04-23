// controllers/scanController.js
// Handles package scanning for handlers and drivers,
// and admin editing of customer account type.

const pool = require("../db");

// Shared: get employee_id from logged-in user
async function getEmployeeId(userId) {
  const [[row]] = await pool.execute(
    `SELECT employee_id FROM employee WHERE employee_account = ? LIMIT 1`,
    [userId]
  );
  return row ? row.employee_id : null;
}

// Shared: get facility_id for an employee
async function getEmployeeFacilityId(userId) {
  const [[row]] = await pool.execute(
    `SELECT e.works_at AS facility_id
     FROM employee e WHERE e.employee_account = ? LIMIT 1`,
    [userId]
  );
  return row ? row.facility_id : null;
}

// GET PACKAGE STATUSES
// Returns statuses filtered by type — handlers get processing statuses,
// drivers get transit/delivery statuses
const getPackageStatuses = async (req, res) => {
  const { type } = req.query; // "handler" or "driver"
  try {
    let types;
    if (type === "handler") {
      types = ["pre-processing", "processing"];
    } else if (type === "driver") {
      types = ["transit", "delivery"];
    } else {
      types = ["pre-processing", "processing", "transit", "delivery", "damage", "flags"];
    }

    const placeholders = types.map(() => "?").join(", ");
    const [rows] = await pool.execute(
      `SELECT status_no, status_type, status_name
       FROM package_status
       WHERE status_type IN (${placeholders})
       ORDER BY status_no ASC`,
      types
    );
    res.json(rows);
  } catch (err) {
    console.error("getPackageStatuses error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── SEARCH PACKAGE BY TRACKING NUMBER ───────────────────────────────────────
// Looks up a package by shipment tracking number and returns
// package info + current status so the employee can scan it
const searchPackage = async (req, res) => {
  const { trackingNumber } = req.query;
  if (!trackingNumber || !trackingNumber.trim()) {
    return res.status(400).json({ message: "Tracking number is required." });
  }

  try {
    // Get all packages for this shipment
    const [packages] = await pool.execute(
      `SELECT
          p.package_id,
          p.pkg_weight, p.pkg_length, p.pkg_width, p.pkg_height,
          s.tracking_number, s.shipment_id,
          s.receiver_name,
          dest.city AS dest_city, dest.state AS dest_state, dest.country AS dest_country,
          ps.status_name AS current_status,
          ps.status_type AS current_status_type
       FROM package p
       JOIN shipment s       ON p.part_of_shipment = s.shipment_id
       JOIN address  dest    ON s.receiver_addr    = dest.address_id
       LEFT JOIN (
         SELECT pte.for_package, pte.status
         FROM package_tracking_event pte
         WHERE pte.pkg_tracking_event_id = (
           SELECT MAX(pte2.pkg_tracking_event_id)
           FROM package_tracking_event pte2
           WHERE pte2.for_package = pte.for_package
         )
       ) latest ON latest.for_package = p.package_id
       LEFT JOIN package_status ps ON latest.status = ps.status_no
       WHERE s.tracking_number = ?
       ORDER BY p.package_id ASC`,
      [trackingNumber.trim().toUpperCase()]
    );

    if (packages.length === 0) {
      return res.status(404).json({ message: "No packages found for this tracking number." });
    }

    res.json(packages);
  } catch (err) {
    console.error("searchPackage error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── HANDLER SCAN ─────────────────────────────────────────────────────────────
// POST /api/scan/handler
// Body: { packageId, statusNo }
// Records that this handler processed a package at their facility
const handlerScan = async (req, res) => {
  const { packageId, statusNo } = req.body;

  if (!packageId || !statusNo) {
    return res.status(400).json({ message: "Package ID and status are required." });
  }

  try {
    const employeeId = await getEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const facilityId = await getEmployeeFacilityId(req.user.id);
    if (!facilityId) {
      return res.status(404).json({ message: "Facility not found for this employee." });
    }

    // Verify package exists
    const [[pkg]] = await pool.execute(
      `SELECT package_id FROM package WHERE package_id = ? LIMIT 1`, [packageId]
    );
    if (!pkg) return res.status(404).json({ message: "Package not found." });

    // Insert tracking event
    await pool.execute(
      `INSERT INTO package_tracking_event (for_package, status, event_time, happened_at, handled_by)
       VALUES (?, ?, NOW(), ?, ?)`,
      [packageId, statusNo, facilityId, employeeId]
    );

    res.status(201).json({ message: "Package scanned successfully." });
  } catch (err) {
    // Handle trigger errors (duplicate scan, backwards status)
    if (err.sqlState === "45000") {
      return res.status(400).json({ message: err.message });
    }
    console.error("handlerScan error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── DRIVER SCAN ──────────────────────────────────────────────────────────────
// POST /api/scan/driver
// Body: { packageId, statusNo, vehicleId (optional) }
// Records that this driver scanned a package (pickup/transit/delivery)
const driverScan = async (req, res) => {
  const { packageId, statusNo, vehicleId } = req.body;

  if (!packageId || !statusNo) {
    return res.status(400).json({ message: "Package ID and status are required." });
  }

  try {
    const employeeId = await getEmployeeId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const facilityId = await getEmployeeFacilityId(req.user.id);
    if (!facilityId) {
      return res.status(404).json({ message: "Facility not found for this employee." });
    }

    // Verify package exists
    const [[pkg]] = await pool.execute(
      `SELECT package_id FROM package WHERE package_id = ? LIMIT 1`, [packageId]
    );
    if (!pkg) return res.status(404).json({ message: "Package not found." });

    // Verify vehicle exists if provided
    if (vehicleId) {
      const [[vehicle]] = await pool.execute(
        `SELECT vehicle_id FROM vehicle WHERE vehicle_id = ? LIMIT 1`, [vehicleId]
      );
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    }

    // Insert tracking event
    await pool.execute(
      `INSERT INTO package_tracking_event (for_package, status, event_time, happened_at, loaded_on, handled_by)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [packageId, statusNo, facilityId, vehicleId || null, employeeId]
    );

    res.status(201).json({ message: "Package scanned successfully." });
  } catch (err) {
    if (err.sqlState === "45000") {
      return res.status(400).json({ message: err.message });
    }
    console.error("driverScan error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GET VEHICLES ─────────────────────────────────────────────────────────────
// Returns all vehicles (for driver scan dropdown)
const getVehicles = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT vehicle_id, vehicle_type, vehicle_transit_identifier, vehicle_status
       FROM vehicle ORDER BY vehicle_transit_identifier ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("getVehicles error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── ADMIN — EDIT CUSTOMER TYPE ───────────────────────────────────────────────
// PATCH /api/scan/admin/customer/:userId
// Body: { custType: "Normal" | "Business", businessName?: string }
const editCustomerType = async (req, res) => {
  const targetUserId = Number(req.params.userId);
  const { custType, businessName } = req.body;

  if (!custType || !["Normal", "Business"].includes(custType)) {
    return res.status(400).json({ message: "custType must be Normal or Business." });
  }
  if (custType === "Business" && (!businessName || !businessName.trim())) {
    return res.status(400).json({ message: "Business name is required for Business accounts." });
  }

  try {
    // Get cust_id for this user
    const [[customer]] = await pool.execute(
      `SELECT cust_id FROM customer WHERE cust_account = ? LIMIT 1`, [targetUserId]
    );
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found." });
    }

    await pool.execute(
      `UPDATE customer SET cust_type = ?, business_name = ? WHERE cust_id = ?`,
      [custType, custType === "Business" ? businessName.trim() : null, customer.cust_id]
    );

    return res.json({ message: `Customer type updated to ${custType}.` });
  } catch (err) {
    console.error("editCustomerType error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  getPackageStatuses,
  searchPackage,
  handlerScan,
  driverScan,
  getVehicles,
  editCustomerType,
};
