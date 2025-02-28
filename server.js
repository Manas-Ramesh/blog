
// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const { router: authRoutes, authenticateToken, isAdmin } = require("./routes/authRoutes");
// const postRoutes = require("./routes/posts"); 

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
// app.use(express.json());
// app.use("/auth", authRoutes);
// app.use("/posts", postRoutes);
// const likesRoutes = require("./routes/likes");
// app.use("/", likesRoutes);


// app.get("/admin", authenticateToken, isAdmin, (req, res) => {
//     res.json({ message: `Welcome, Admin! (${req.user.email})` });
// });

// app.get("/", (req, res) => {
//     res.send("Backend is running with Google OAuth!");
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const KnexSessionStore = require("connect-session-knex") // ✅ Fix the import

const knex = require("knex")({
    client: "mysql",
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    },
});


const { router: authRoutes, authenticateToken, isAdmin } = require("./routes/authRoutes");
const postRoutes = require("./routes/posts"); 
const db = require("./db"); // ✅ Use the existing database connection
const likesRoutes = require("./routes/likes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ✅ Use the same database for session storage
const store = new KnexSessionStore.KnexSessionStore({  // ✅ Corrected way to initialize
    knex,
    tablename: "sessions",
    sidfieldname: "sid",
    createtable: true,
    clearInterval: 1000 * 60 * 60 * 24, // ✅ Clears expired sessions every 24 hours
});
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store,  // ✅ Uses the fixed store instance
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);
// ✅ Apply Session Middleware
// app.use(
//     session({
//         secret: process.env.SESSION_SECRET, // ✅ Store this in `.env`
//         resave: false,
//         saveUninitialized: false,
//         store: store, // ✅ Now using MySQL instead of MemoryStore
//         cookie: {
//             secure: process.env.NODE_ENV === "production", // ✅ Secure only in production
//             httpOnly: true,
//             maxAge: 1000 * 60 * 60 * 24 * 7, // ✅ Sessions last for 7 days
//         },
//     })
// );

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/", likesRoutes);

app.get("/admin", authenticateToken, isAdmin, (req, res) => {
    res.json({ message: `Welcome, Admin! (${req.user.email})` });
});

app.get("/", (req, res) => {
    res.send("Backend is running with Google OAuth & MySQL-based sessions!");
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
