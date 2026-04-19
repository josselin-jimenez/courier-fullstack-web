const pool = require("../db");
const { validateAddress } = require("../middleware/addressMiddleware");

const NAME_RE  = /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+ [A-Za-zÀ-ÖØ-öø-ÿ'-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;

// ─── GET PROFILE  ───────────────────────────────────────────────────────────
const getCustomerProfile = async (req, res) => {
    try {
        const [customerProfileResult] = await pool.execute(
            "SELECT * FROM customer_profile WHERE user_id = ?",
            [req.user.id]
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
// ─── UPDATE PROFILE  ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!NAME_RE.test(name.trim())) {
    return res.status(400).json({ message: "Please enter a valid first and last name (letters, hyphens, and apostrophes only)." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ message: "Phone number must start with a '+' and country code, followed by 7–14 digits (e.g. +12025550123)." });
  }

  try {
    const [emailConflictResult] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
      [email, req.user.id]
    );
    if (emailConflictResult.length > 0) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const [phoneConflict] = await pool.execute(
      "SELECT user_id FROM users WHERE phone_num = ? AND user_id != ?",
      [phone, req.user.id]
    );
    if (phoneConflict.length > 0) {
      return res.status(409).json({ message: "Phone number is already in use." });
    }

    await pool.execute(
      "UPDATE users SET name = ?, email = ?, phone_num = ? WHERE user_id = ?",
      [name.trim(), email.trim(), phone.trim(), req.user.id]
    );

    return res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── UPDATE ADDRESS  ───────────────────────────────────────────────────────────
const updateAddress = async (req, res) => {
  const { streetAddr, unit, city, state, country, postalCode } = req.body;

  if (!streetAddr || !city || !state || !country) {
    return res.status(400).json({ message: "Please fill all required address fields." });
  }

  const connection = await pool.getConnection();
  try {
    const coordinates = await validateAddress({ streetAddr, unit, city, state, country, postalCode });

    await connection.beginTransaction();

    const [existingAddressResult] = await connection.execute(
      unit
        ? "SELECT address_id FROM address WHERE street_addr = ? AND addr_line_2 = ? AND city = ? AND postal_code = ? AND country = ?"
        : "SELECT address_id FROM address WHERE street_addr = ? AND addr_line_2 IS NULL AND city = ? AND postal_code = ? AND country = ?",
      unit
        ? [streetAddr, unit, city, postalCode, country]
        : [streetAddr, city, postalCode, country]
    );

    let addressId;
    if (existingAddressResult.length > 0) {
      addressId = existingAddressResult[0].address_id;
    } else {
      const [addressResult] = await connection.execute(
        "INSERT INTO address (street_addr, addr_line_2, city, state, postal_code, country, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          streetAddr,
          unit || null,
          city,
          state,
          postalCode ? postalCode.toUpperCase() : null,
          country,
          coordinates.lat,
          coordinates.lng,
        ]
      );
      addressId = addressResult.insertId;
    }

    await connection.execute(
      "UPDATE customer SET cust_addr = ? WHERE cust_account = ?",
      [addressId, req.user.id]
    );

    await connection.commit();
    return res.json({ message: "Address updated successfully." });
  } catch (err) {
    await connection.rollback();
    const isAddressError =
      err.message?.startsWith("Could not validate address") ||
      err.message?.startsWith("Could not geocode address")  ||
      err.message?.startsWith("Address not precise enough") ||
      err.message?.startsWith("Unconfirmed address components") ||
      err.message?.startsWith("Invalid Address Line 2");
    if (isAddressError) {
      return res.status(400).json({ message: err.message });
    }
    console.error("updateAddress error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    connection.release();
  }
};

// ─── REQUEST CUSTOMER TYPE CHANGE  ───────────────────────────────────────────────────────────
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
    if (customer.cust_type === "Business") {
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

// ─── GET REQUEST STATUS  ───────────────────────────────────────────────────────────
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

// ─── GET CUSTOMER SHIPMENTS  ───────────────────────────────────────────────────────────
const getCustomerShipments = async (req,res) => {
  try {
    
  } catch(err) {
    
  }
};

module.exports = { getCustomerProfile, updateProfile, updateAddress, createCustomerTypeRequest, getMyCustomerTypeRequestStatus };
