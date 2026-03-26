// middleware/authMiddleware.js — verifies the JWT aka user token on protected routes

const jwt = require("jsonwebtoken");

// ─── verifyToken ──────────────────────────────────────────────────────────────
// This middleware runs BEFORE any protected route handler
// It checks that the request includes a valid JWT in the Authorization header
const verifyToken = (req, res, next) => {
  // The frontend sends: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];

  // If the header is missing, reject immediately
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided." });
  }

  // The header looks like "Bearer eyJhbGci..." — split on the space and take the second part
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing from header." });
  }

  try {
    // jwt.verify checks the token signature and expiry
    // If valid, it returns the decoded payload we stored at login
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to req.user so route handlers can access it
    req.user = decoded;

    next(); // move on to the actual route handler
  } catch (err) {
    // This catches both expired tokens and tampered tokens
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// ─── requireRole ──────────────────────────────────────────────────────────────
// This is a middleware *factory* — it returns a middleware function
// Use it AFTER verifyToken to restrict routes to specific roles
// Example: router.get("/admin", verifyToken, requireRole("admin"), handler)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user was set by verifyToken above
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role." });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };