const pool = require("../db");

const getCustomerTypeRequests = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        ctr.request_id,
        ctr.cust_id,
        ctr.requested_type,
        ctr.status,
        ctr.business_name,
        ctr.request_info,
        ctr.created_at,
        u.name,
        u.email,
        u.phone_num,
        c.cust_type
      FROM customer_type_requests ctr
      JOIN customer c ON ctr.cust_id = c.cust_id
      JOIN users u ON c.cust_account = u.user_id
      ORDER BY ctr.created_at ASC, ctr.request_id ASC
      `
    );

    return res.json(rows);
  } catch (err) {
    console.error("getCustomerTypeRequests error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

const reviewCustomerTypeRequest = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.execute(
      `
      SELECT request_id, cust_id, status, business_name
      FROM customer_type_requests
      WHERE request_id = ?
      LIMIT 1
      `,
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Request not found." });
    }

    const request = requestRows[0];

    if (request.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ message: "Only pending requests can be reviewed." });
    }

    await connection.execute(
      `
      UPDATE customer_type_requests
      SET status = ?
      WHERE request_id = ?
      `,
      [status, requestId]
    );

    if (status === "approved") {
      await connection.execute(
        `
        UPDATE customer
        SET cust_type = 'Business', business_name = ?
        WHERE cust_id = ?
        `,
        [request.business_name, request.cust_id]
      );
    }

    await connection.commit();

    return res.json({
      message: `Request ${status} successfully.`
    });
  } catch (err) {
    await connection.rollback();
    console.error("reviewCustomerTypeRequest error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    connection.release();
  }
};

module.exports = {
  getCustomerTypeRequests,
  reviewCustomerTypeRequest
};