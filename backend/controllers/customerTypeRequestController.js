const pool = require("../db");

// POST /api/customer-type-requests
const createCustomerTypeRequest = async (req, res) => {
  const { requestReason } = req.body;

  if (!requestReason || !requestReason.trim()) {
    return res.status(400).json({ message: "Request reason is required." });
  }

  try {
    // Find the logged-in user's customer row
    const [customerRows] = await pool.execute(
      `
      SELECT cust_id, cust_type
      FROM customer
      WHERE customer_account = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({
        message:
          "No customer profile exists for this user yet. Create the customer row first before submitting a type change request."
      });
    }

    const customer = customerRows[0];

    if (customer.cust_type === "business") {
      return res.status(400).json({
        message: "Your account is already a business customer."
      });
    }

    // Prevent duplicate pending requests
    const [pendingRows] = await pool.execute(
      `
      SELECT request_id
      FROM customer_type_requests
      WHERE cust_id = ? AND status = 'pending'
      LIMIT 1
      `,
      [customer.cust_id]
    );

    if (pendingRows.length > 0) {
      return res.status(409).json({
        message: "You already have a pending business type request."
      });
    }

    await pool.execute(
      `
      INSERT INTO customer_type_requests (cust_id, requested_type, status, request_reason)
      VALUES (?, 'business', 'pending', ?)
      `,
      [customer.cust_id, requestReason.trim()]
    );

    return res.status(201).json({
      message: "Business type change request submitted successfully."
    });
  } catch (err) {
    console.error("createCustomerTypeRequest error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/customer-type-requests/me
const getMyCustomerTypeRequestStatus = async (req, res) => {
  try {
    const [customerRows] = await pool.execute(
      `
      SELECT cust_id, cust_type
      FROM customer
      WHERE customer_account = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({
        message:
          "No customer profile exists for this user yet. Create the customer row first before checking request status."
      });
    }

    const customer = customerRows[0];

    const [requestRows] = await pool.execute(
      `
      SELECT request_id, requested_type, status, request_reason, reviewed_by, reviewed_at, created_at
      FROM customer_type_requests
      WHERE cust_id = ?
      ORDER BY created_at DESC, request_id DESC
      LIMIT 1
      `,
      [customer.cust_id]
    );

    return res.json({
      customerType: customer.cust_type,
      latestRequest: requestRows.length > 0 ? requestRows[0] : null
    });
  } catch (err) {
    console.error("getMyCustomerTypeRequestStatus error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  createCustomerTypeRequest,
  getMyCustomerTypeRequestStatus
};