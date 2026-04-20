// controllers/employeeController.js
const pool = require("../db");

async function getEmployeeRow(userId) {
  const [[employee]] = await pool.execute(
    `SELECT e.employee_id, e.works_at,
            f.facility_name, f.department_type,
            a.street_addr, a.city, a.state, a.country
     FROM employee e
     JOIN facility f ON e.works_at = f.facility_id
     JOIN address  a ON f.facility_addr = a.address_id
     WHERE e.employee_account = ?
     LIMIT 1`,
    [userId]
  );
  return employee || null;
}

const getDriverDashboard = async (req, res) => {
  try {
    const employee = await getEmployeeRow(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found. Contact your administrator." });
    }
    const [recentEvents] = await pool.execute(
      `SELECT
          pte.pkg_tracking_event_id, pte.event_time,
          ps.status_name, ps.status_type,
          p.package_id, p.pkg_weight,
          s.tracking_number,
          f.facility_name AS location_name,
          v.vehicle_transit_identifier AS vehicle_id
       FROM package_tracking_event pte
       JOIN package        p   ON pte.for_package = p.package_id
       JOIN shipment       s   ON p.part_of_shipment = s.shipment_id
       JOIN package_status ps  ON pte.status = ps.status_no
       LEFT JOIN facility  f   ON pte.happened_at = f.facility_id
       LEFT JOIN vehicle   v   ON pte.loaded_on = v.vehicle_id
       WHERE pte.handled_by = ?
       ORDER BY pte.event_time DESC LIMIT 20`,
      [employee.employee_id]
    );
    const [counts] = await pool.execute(
      `SELECT COUNT(*) AS total_scans FROM package_tracking_event WHERE handled_by = ?`,
      [employee.employee_id]
    );
    res.json({
      employee: {
        employee_id: employee.employee_id,
        facility_name: employee.facility_name,
        department_type: employee.department_type,
        facility_address: `${employee.street_addr}, ${employee.city}, ${employee.state}, ${employee.country}`,
      },
      stats: { total_scans: counts[0].total_scans },
      recent_events: recentEvents,
    });
  } catch (err) {
    console.error("getDriverDashboard error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const getHandlerDashboard = async (req, res) => {
  try {
    const employee = await getEmployeeRow(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found. Contact your administrator." });
    }
    const [recentEvents] = await pool.execute(
      `SELECT
          pte.pkg_tracking_event_id, pte.event_time,
          ps.status_name, ps.status_type,
          p.package_id, p.pkg_weight,
          p.pkg_length, p.pkg_width, p.pkg_height,
          s.tracking_number,
          f.facility_name AS location_name
       FROM package_tracking_event pte
       JOIN package        p   ON pte.for_package = p.package_id
       JOIN shipment       s   ON p.part_of_shipment = s.shipment_id
       JOIN package_status ps  ON pte.status = ps.status_no
       LEFT JOIN facility  f   ON pte.happened_at = f.facility_id
       WHERE pte.handled_by = ?
       ORDER BY pte.event_time DESC LIMIT 30`,
      [employee.employee_id]
    );
    const [statusCounts] = await pool.execute(
      `SELECT ps.status_type, COUNT(*) AS cnt
       FROM package_tracking_event pte
       JOIN package_status ps ON pte.status = ps.status_no
       WHERE pte.handled_by = ?
       GROUP BY ps.status_type`,
      [employee.employee_id]
    );
    res.json({
      employee: {
        employee_id: employee.employee_id,
        facility_name: employee.facility_name,
        department_type: employee.department_type,
        facility_address: `${employee.street_addr}, ${employee.city}, ${employee.state}, ${employee.country}`,
      },
      status_counts: statusCounts,
      recent_events: recentEvents,
    });
  } catch (err) {
    console.error("getHandlerDashboard error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const [[shipmentCount]] = await pool.execute(`SELECT COUNT(*) AS total FROM shipment`);
    const [[userCount]]     = await pool.execute(`SELECT COUNT(*) AS total FROM users`);
    const [[customerCount]] = await pool.execute(`SELECT COUNT(*) AS total FROM customer`);
    const [[pendingRequests]] = await pool.execute(`SELECT COUNT(*) AS total FROM customer_type_requests WHERE status = 'pending'`);
    const [[revenueResult]] = await pool.execute(`SELECT COALESCE(SUM(total_paid), 0) AS total_revenue FROM payment`);
    const [recentShipments] = await pool.execute(
      `SELECT s.shipment_id, s.tracking_number, s.receiver_name,
              p.total_paid, p.date_paid,
              u.name AS customer_name,
              a.city AS dest_city, a.country AS dest_country
       FROM shipment s
       JOIN payment  p ON s.shipment_transaction = p.payment_id
       JOIN customer c ON s.for_customer = c.cust_id
       JOIN users    u ON c.cust_account = u.user_id
       JOIN address  a ON s.receiver_addr = a.address_id
       ORDER BY p.date_paid DESC, s.shipment_id DESC LIMIT 10`
    );
    const [allUsers] = await pool.execute(
      `SELECT user_id, name, email, phone_num, role FROM users ORDER BY role ASC, name ASC`
    );
    const [pendingList] = await pool.execute(
      `SELECT ctr.request_id, ctr.business_name, ctr.created_at, u.name, u.email
       FROM customer_type_requests ctr
       JOIN customer c ON ctr.cust_id = c.cust_id
       JOIN users    u ON c.cust_account = u.user_id
       WHERE ctr.status = 'pending'
       ORDER BY ctr.created_at ASC`
    );
    res.json({
      stats: {
        total_shipments:  shipmentCount.total,
        total_users:      userCount.total,
        total_customers:  customerCount.total,
        pending_requests: pendingRequests.total,
        total_revenue:    revenueResult.total_revenue,
      },
      recent_shipments: recentShipments,
      all_users:        allUsers,
      pending_requests: pendingList,
    });
  } catch (err) {
    console.error("getAdminDashboard error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getDriverDashboard, getHandlerDashboard, getAdminDashboard };