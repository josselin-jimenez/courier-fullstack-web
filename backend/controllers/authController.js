// controllers/authController.js
// This file contains the actual logic for each auth action.
// The route file will import these functions and assign them to URLs.

const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const pool   = require("../db");

// ─── REGISTER ────────────────────────────────────────────────────────────────
// This is a named export — the route file will import it by this exact name
// Validation helpers
const NAME_RE     = /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+ [A-Za-zÀ-ÖØ-öø-ÿ'-]+$/;   // first + last, letters/hyphens/apostrophes
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^[\x20-\x7E]{8,72}$/;                               // printable ASCII, 8–72 chars (bcrypt 72-byte limit)
const PHONE_RE    = /^\+[1-9][0-9]{7,14}$/;                              // +country code + 7–14 digits, max 16 chars total (varchar(16))

const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!NAME_RE.test(name.trim())) {
    return res.status(400).json({ message: "Please enter a valid first and last name (letters, hyphens, and apostrophes only)." });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  if (!PASSWORD_RE.test(password)) {
    return res.status(400).json({
      message: password.length < 8
        ? "Password must be at least 8 characters."
        : password.length > 72
        ? "Password must be 72 characters or fewer."
        : "Password contains invalid characters. Use printable characters only."
    });
  }

  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ message: "Phone number must start with a '+' and country code, followed by 7–14 digits (e.g. +12025550123)." });
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
     "INSERT INTO users (name, email, password, phone_num, role) VALUES (?, ?, ?, ?, ?)",
     [name, email, hashedPassword, phone, "customer"]
    );

    res.status(201).json({ message: "Account created successfully." });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
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
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

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