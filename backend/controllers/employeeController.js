const pool = require("../db");
const bcrypt = require("bcrypt");

async function getEmployeeRow(userId) {
  const [[employee]] = await pool.execute(
    `SELECT e.employee_id, e.works_at,
            f.facility_name, f.department_type,
            a.street_addr, a.city, a.state, a.country
     FROM employee e
     JOIN facility f ON e.works_at = f.facility_id
     JOIN address a ON f.facility_addr = a.address_id
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
          loc.city AS location_city, loc.state AS location_state,
          v.vehicle_transit_identifier AS vehicle_id
       FROM package_tracking_event pte
       JOIN package p ON pte.for_package = p.package_id
       JOIN shipment s ON p.part_of_shipment = s.shipment_id
       JOIN package_status ps ON pte.event_status = ps.status_no
       LEFT JOIN address loc ON pte.happened_at = loc.address_id
       LEFT JOIN vehicle v ON pte.loaded_on = v.vehicle_id
       WHERE pte.handled_by = ?
       ORDER BY pte.event_time DESC
       LIMIT 20`,
      [employee.employee_id]
    );

    const [counts] = await pool.execute(
      `SELECT COUNT(*) AS total_scans
       FROM package_tracking_event
       WHERE handled_by = ?`,
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
          loc.city AS location_city, loc.state AS location_state
       FROM package_tracking_event pte
       JOIN package p ON pte.for_package = p.package_id
       JOIN shipment s ON p.part_of_shipment = s.shipment_id
       JOIN package_status ps ON pte.event_status = ps.status_no
       LEFT JOIN address loc ON pte.happened_at = loc.address_id
       WHERE pte.handled_by = ?
       ORDER BY pte.event_time DESC
       LIMIT 30`,
      [employee.employee_id]
    );

    const [statusCounts] = await pool.execute(
      `SELECT ps.status_type, COUNT(*) AS cnt
       FROM package_tracking_event pte
       JOIN package_status ps ON pte.event_status = ps.status_no
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
    const [[userCount]] = await pool.execute(`SELECT COUNT(*) AS total FROM users`);
    const [[customerCount]] = await pool.execute(`SELECT COUNT(*) AS total FROM customer`);
    const [[pendingRequests]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM customer_type_requests WHERE status = 'pending'`
    );
    const [[revenueResult]] = await pool.execute(
      `SELECT COALESCE(SUM(total_paid), 0) AS total_revenue FROM payment`
    );

    const [recentShipments] = await pool.execute(
      `SELECT s.shipment_id, s.tracking_number, s.receiver_name,
              p.total_paid, p.date_paid,
              u.name AS customer_name,
              a.city AS dest_city, a.country AS dest_country
       FROM shipment s
       JOIN payment p ON s.shipment_transaction = p.payment_id
       JOIN customer c ON s.for_customer = c.cust_id
       JOIN users u ON c.cust_account = u.user_id
       JOIN address a ON s.receiver_addr = a.address_id
       ORDER BY p.date_paid DESC, s.shipment_id DESC
       LIMIT 10`
    );

    const [employees] = await pool.execute(
      `SELECT u.user_id, u.name, u.email, u.phone_num, u.role,
              f.facility_id, f.facility_name, f.department_type
       FROM users u
       LEFT JOIN employee e ON u.user_id = e.employee_account
       LEFT JOIN facility f ON e.works_at = f.facility_id
       WHERE u.role != 'customer'
       ORDER BY u.role ASC, u.name ASC`
    );

    const [customers] = await pool.execute(
      `SELECT u.user_id, u.name, u.email, u.phone_num, c.cust_type, c.business_name
       FROM users u
       JOIN customer c ON u.user_id = c.cust_account
       ORDER BY u.name ASC`
    );

    const [pendingList] = await pool.execute(
      `SELECT ctr.request_id, ctr.business_name, ctr.created_at, u.name, u.email
       FROM customer_type_requests ctr
       JOIN customer c ON ctr.cust_id = c.cust_id
       JOIN users u ON c.cust_account = u.user_id
       WHERE ctr.status = 'pending'
       ORDER BY ctr.created_at ASC`
    );

    const [facilities] = await pool.execute(
      `SELECT facility_id, facility_name, department_type
       FROM facility
       ORDER BY facility_name ASC`
    );

    res.json({
      stats: {
        total_shipments: shipmentCount.total,
        total_users: userCount.total,
        total_customers: customerCount.total,
        pending_requests: pendingRequests.total,
        total_revenue: revenueResult.total_revenue,
      },
      recent_shipments: recentShipments,
      employees,
      customers,
      pending_requests: pendingList,
      facilities,
    });
  } catch (err) {
    console.error("getAdminDashboard error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const getRevenueReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "startDate and endDate are required." });
  }

  if (startDate > endDate) {
    return res.status(400).json({ message: "Start date must be before end date." });
  }

  try {
    const [[totals]] = await pool.execute(
      `SELECT COUNT(*) AS shipment_count,
              COALESCE(SUM(total_paid), 0) AS total_revenue,
              COALESCE(MIN(total_paid), 0) AS min_payment,
              COALESCE(MAX(total_paid), 0) AS max_payment,
              COALESCE(AVG(total_paid), 0) AS avg_payment
       FROM payment
       WHERE date_paid BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [dailyBreakdown] = await pool.execute(
      `SELECT date_paid, COUNT(*) AS shipment_count, SUM(total_paid) AS daily_revenue
       FROM payment
       WHERE date_paid BETWEEN ? AND ?
       GROUP BY date_paid
       ORDER BY date_paid ASC`,
      [startDate, endDate]
    );

    const [byMethod] = await pool.execute(
      `SELECT payment_method, COUNT(*) AS count, SUM(total_paid) AS revenue
       FROM payment
       WHERE date_paid BETWEEN ? AND ?
       GROUP BY payment_method`,
      [startDate, endDate]
    );

    res.json({ totals, daily_breakdown: dailyBreakdown, by_method: byMethod });
  } catch (err) {
    console.error("getRevenueReport error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const addEmployee = async (req, res) => {
  const { name, email, phone, password, role, facilityId } = req.body;

  if (!name || !email || !phone || !password || !role || !facilityId) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!["driver", "handler", "customer service"].includes(role)) {
    return res.status(400).json({ message: "Role must be driver, handler, or customer service." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [dupEmail] = await conn.execute(`SELECT user_id FROM users WHERE email = ?`, [email]);
    if (dupEmail.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: "Email is already in use." });
    }

    const [dupPhone] = await conn.execute(`SELECT user_id FROM users WHERE phone_num = ?`, [phone]);
    if (dupPhone.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: "Phone number is already in use." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [userResult] = await conn.execute(
      `INSERT INTO users (name, email, password, phone_num, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashed, phone, role]
    );

    await conn.execute(
      `INSERT INTO employee (works_at, employee_account)
       VALUES (?, ?)`,
      [facilityId, userResult.insertId]
    );

    await conn.commit();
    return res.status(201).json({ message: `${role} account created successfully.` });
  } catch (err) {
    await conn.rollback();
    console.error("addEmployee error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    conn.release();
  }
};

const editEmployee = async (req, res) => {
  const targetUserId = Number(req.params.userId);
  const { name, email, phone, role, facilityId, password } = req.body;

  if (targetUserId === req.user.id && role && role !== req.user.role) {
    return res.status(400).json({ message: "You cannot change your own role." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[target]] = await conn.execute(
      `SELECT user_id, role
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [targetUserId]
    );

    if (!target) {
      await conn.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    if (target.role === "customer") {
      await conn.rollback();
      return res.status(400).json({ message: "Cannot edit customer accounts from this endpoint." });
    }

    if (email) {
      const [dup] = await conn.execute(
        `SELECT user_id FROM users WHERE email = ? AND user_id <> ?`,
        [email, targetUserId]
      );
      if (dup.length > 0) {
        await conn.rollback();
        return res.status(409).json({ message: "Email is already in use." });
      }
    }

    if (phone) {
      const [dup] = await conn.execute(
        `SELECT user_id FROM users WHERE phone_num = ? AND user_id <> ?`,
        [phone, targetUserId]
      );
      if (dup.length > 0) {
        await conn.rollback();
        return res.status(409).json({ message: "Phone number is already in use." });
      }
    }

    const userFields = [];
    const userValues = [];

    if (name) {
      userFields.push("name = ?");
      userValues.push(name);
    }
    if (email) {
      userFields.push("email = ?");
      userValues.push(email);
    }
    if (phone) {
      userFields.push("phone_num = ?");
      userValues.push(phone);
    }
    if (role) {
      userFields.push("role = ?");
      userValues.push(role);
    }
    if (password) {
      if (password.length < 8) {
        await conn.rollback();
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }
      const hashed = await bcrypt.hash(password, 10);
      userFields.push("password = ?");
      userValues.push(hashed);
    }

    if (userFields.length > 0) {
      userValues.push(targetUserId);
      await conn.execute(
        `UPDATE users SET ${userFields.join(", ")} WHERE user_id = ?`,
        userValues
      );
    }

    if (facilityId) {
      await conn.execute(
        `UPDATE employee SET works_at = ? WHERE employee_account = ?`,
        [facilityId, targetUserId]
      );
    }

    await conn.commit();
    return res.json({ message: "Employee updated successfully." });
  } catch (err) {
    await conn.rollback();
    console.error("editEmployee error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    conn.release();
  }
};

const deleteEmployee = async (req, res) => {
  const targetUserId = Number(req.params.userId);

  if (targetUserId === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[target]] = await conn.execute(
      `SELECT user_id, role
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [targetUserId]
    );

    if (!target) {
      await conn.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    if (target.role === "customer") {
      await conn.rollback();
      return res.status(400).json({ message: "Cannot delete customer accounts from this endpoint." });
    }

    await conn.execute(`DELETE FROM employee WHERE employee_account = ?`, [targetUserId]);
    await conn.execute(`DELETE FROM users WHERE user_id = ?`, [targetUserId]);

    await conn.commit();
    return res.json({ message: "Employee account deleted successfully." });
  } catch (err) {
    await conn.rollback();
    console.error("deleteEmployee error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    conn.release();
  }
};

module.exports = {
  getDriverDashboard,
  getHandlerDashboard,
  getAdminDashboard,
  getRevenueReport,
  addEmployee,
  editEmployee,
  deleteEmployee,
};