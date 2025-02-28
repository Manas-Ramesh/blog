require("dotenv").config();
const mysql = require("mysql2/promise"); // ✅ Use `promise` for better async handling

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "my_blog",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // ✅ Limit to avoid overwhelming DB
    queueLimit: 0, 
});

module.exports = pool; // ✅ Export pool instead of a single connection
