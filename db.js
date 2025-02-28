// require("dotenv").config();
// const mysql = require("mysql2");

// // Create database connection
// const db = mysql.createConnection({
//     host: process.env.DB_HOST || "localhost",
//     user: process.env.DB_USER || "root",
//     password: process.env.DB_PASS || "",
//     database: process.env.DB_NAME || "my_blog",
//     port: process.env.DB_PORT || 3306,
//     connectTimeout: 10000, // Wait 10s before failing
// });

// // Connect to MySQL
// db.connect((err) => {
//     if (err) {
//         console.error("❌ Database connection failed:", err);
//         return;
//     }
//     console.log("✅ Connected to MySQL database.");
// });

// module.exports = db;

const mysql = require("mysql2/promise"); // ✅ Use the promise version
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool; // ✅ Export the pool for promise-based queries
