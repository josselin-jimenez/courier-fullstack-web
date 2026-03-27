// mysql2/promise gives us the async/await version of mysql2
// Without /promise, you'd have to use callbacks (older style)
const mysql = require("mysql2/promise");

// Load environment variables
require("dotenv").config();

// createPool instead of createConnection is better for web apps:
// A "pool" keeps several connections open and reuses them.
// createConnection opens ONE connection — if it drops, your app breaks.
// A pool automatically handles reconnecting and handles multiple users at once.
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // usually "localhost"
  user: process.env.DB_USER,         // your MySQL username
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD, // your MySQL password
  database: process.env.DB_NAME,     // the database you want to use
  waitForConnections: true,          // if all connections are busy, wait instead of erroring
  connectionLimit: 10,               // max number of simultaneous connections in the pool
  queueLimit: 0                      // 0 = unlimited requests can queue while waiting
});

// Export the pool so any other file can import it and query the database
module.exports = pool;