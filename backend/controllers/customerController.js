const pool = require("../db");

const getCustomerProfile = async (req, res) => {
    try {
        const [customerProfileResult] = await pool.execute(
            "SELECT * FROM customer_profile WHERE email = ?",
            [req.user.email]
        );

        if (customerProfileResult.length === 0) {
            return res.status(404).json ({ message: "Profile not found."});
        }
        res.json(customerProfileResult[0]);
    } catch(err) {
        console.error( "getCustomerProfile Error: ", err);
        res.status(500).json({ message: "Server error." });
    }
};

const createCustomerTypeRequest = async (req, res) => {
  const { businessName, requestInfo,  } = req.body;

    if (!businessName || !businessName.trim()) {
        return res.status(400).json({ message: "Business name is required." });
    }
    if (businessName.trim().length > 100) {
        return res.status(400).json({ message: "Business name must be 100 characters or fewer." });
    }
    if (!requestInfo || !requestInfo.trim()) {
        return res.status(400).json({ message: "Request information is required." });
    }
    if (requestInfo.trim().length > 1000) {
        return res.status(400).json({ message: "Request information must be 1000 characters or fewer." });
    }

  try {
    // Find the logged-in user's customer row using user id
    const [customerResult] = await pool.execute(
      `
      SELECT cust_id, cust_type
      FROM customer
      WHERE cust_account = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (customerResult.length === 0) {
      return res.status(404).json({
        message:
          "No customer profile exists for this user yet. Create the customer row first before submitting a type change request."
      });
    }

    const customer = customerResult[0];

    // Prevent inserting request if already business
    if (customer.cust_type === "business") {
      return res.status(400).json({
        message: "Account is already business type."
      });
    }

    // Prevent duplicate pending requests
    const [pendingResult] = await pool.execute(
      `
      SELECT request_id
      FROM customer_type_requests
      WHERE cust_id = ? AND status = 'pending'
      LIMIT 1
      `,
      [customer.cust_id]
    );

    if (pendingResult.length > 0) {
      return res.status(409).json({
        message: "You already have a pending business type request."
      });
    }
    
    // request_type default set to "business", status default set to "pending", created_at default set to CURRENT TIMESTAMP
    await pool.execute(
      `
      INSERT INTO customer_type_requests (cust_id, business_name, request_info)
      VALUES (?, ?, ?)
      `,
      [customer.cust_id, businessName.trim(), requestInfo.trim()]
    );

    return res.status(201).json({
      message: "Business type change request submitted successfully."
    });
  } catch (err) {
    console.error("createCustomerTypeRequest error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

const getMyCustomerTypeRequestStatus = async (req, res) => {
  try {
    const [customerResult] = await pool.execute(
      `
      SELECT cust_id, cust_type
      FROM customer
      WHERE cust_account = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (customerResult.length === 0) {
      return res.status(404).json({ message: "Customer profile does not exist." });
    }

    const customer = customerResult[0];

    const [requestRows] = await pool.execute(
      `
      SELECT requested_type, status, business_name, request_info, created_at
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

//create view for customer to get shipments with details
const getCustomerShipments = async (req,res) => {
  try {

  } catch(err) {
    
  }
};

module.exports = { getCustomerProfile, createCustomerTypeRequest, getMyCustomerTypeRequestStatus };