
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
const MySQLStore = require("express-mysql-session")(session);
const { router: authRoutes, authenticateToken, isAdmin } = require("./routes/authRoutes");
const postRoutes = require("./routes/posts");
const likesRoutes = require("./routes/likes");
const db = require("./db"); // MySQL connection pool

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration (for cookies to work)
app.use(
    cors({
        origin: process.env.FRONTEND_URL, // Allow frontend URL
        credentials: true, // Allow cookies
    })
);

app.use(express.json());

// ✅ Set up MySQL session store
const sessionStore = new MySQLStore({
    expiration: 1000 * 60 * 60 * 24, // 1 day session expiration
    createDatabaseTable: true, // Auto-create sessions table
    schema: {
        tableName: "sessions",
        columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data",
        },
    },
}, db);

// ✅ Use session middleware with MySQL store
app.use(
    session({
        key: "user_sid",
        secret: process.env.SESSION_SECRET, // Use a strong secret key
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
            httpOnly: true, // Prevent client-side access
            maxAge: 1000 * 60 * 60 * 24, // 1-day expiration
            sameSite: "Lax", // Allows cross-origin cookies with navigation
        },
    })
);

// Routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/", likesRoutes);

// Admin route
app.get("/admin", authenticateToken, isAdmin, (req, res) => {
    res.json({ message: `Welcome, Admin! (${req.user.email})` });
});

app.get("/", (req, res) => {
    res.send("Backend is running with session-based authentication!");
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
