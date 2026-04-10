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
}

module.exports = { getCustomerProfile };