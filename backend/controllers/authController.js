// controllers/authController.js
// This file contains the actual logic for each auth action.
// The route file will import these functions and assign them to URLs.

const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const pool   = require("../db");

// ─── REGISTER ────────────────────────────────────────────────────────────────
// This is a named export — the route file will import it by this exact name
const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (name, email, password, phone_num) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, phone]
    );

    res.status(201).json({ message: "Account created successfully." });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT user_id, name, email, password, phone_num, role FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const payload = { id: user.user_id, name: user.name, email: user.email, phone: user.phone_num, role: user.role };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

    res.json({
      token,
      user: { id: user.user_id, name: user.name, email: user.email, phone: user.phone_num, role: user.role }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
// A useful "who am I?" endpoint — only works if the JWT middleware has already run
// req.user is attached by verifyToken before this function is ever called
const getMe = async (req, res) => {
  try {
    // Re-fetch the user from the DB in case their name/role changed since they logged in
    const [rows] = await pool.execute(
      "SELECT user_id, name, email, role FROM users WHERE user_id = ?",
      [req.user.id]  // req.user comes from the verifyToken middleware
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(rows[0]); // return the fresh user record (no password field since we didn't select it)

  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Export all three functions so the route file can import them
module.exports = { register, login, getMe };