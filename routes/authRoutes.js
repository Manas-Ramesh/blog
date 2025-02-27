// require("dotenv").config();
// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const router = express.Router();

// // Login route
// router.post("/login", async (req, res) => {
//     const { username, password } = req.body;

//     if (username !== process.env.ADMIN_USERNAME) {
//         return res.status(401).json({ message: "Invalid username or password" });
//     }

//     // Compare password with stored hash
//     const isPasswordValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
//     if (!isPasswordValid) {
//         return res.status(401).json({ message: "Invalid username or password" });
//     }

//     // Generate JWT Token
//     const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     res.json({ token });
// });

// // Middleware to protect routes
// const authenticateToken = (req, res, next) => {
//     const token = req.header("Authorization")?.split(" ")[1];

//     if (!token) {
//         return res.status(401).json({ message: "Access denied" });
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) return res.status(403).json({ message: "Invalid token" });
//         req.user = user;
//         next();
//     });
// };

// module.exports = { router, authenticateToken };

require("dotenv").config();
const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const router = express.Router();

// Middleware for sessions
router.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecret",
        resave: false,
        saveUninitialized: true,
    })
);
router.use(passport.initialize());
router.use(passport.session());

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.NODE_ENV === "production"
            ? "https://blog-backend-z5eu.onrender.com/auth/google/callback"
            : "http://localhost:3001/auth/google/callback",
        },
        (accessToken, refreshToken, profile, done) => {
            // Extract email and name from Google profile
            const user = {
                id: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
            };
            return done(null, user);
        }
    )
);

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Google Login Route
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        const user = req.user;
        const token = jwt.sign(
            { email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Store token in localStorage (for frontend use)
        res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
    }
);

// Logout
router.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

// Middleware to Protect Routes
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
};

// Middleware to Check Admin Access
const isAdmin = (req, res, next) => {
    if (req.user.email === process.env.ADMIN_EMAIL) {
        next();
    } else {
        res.status(403).json({ message: "Unauthorized" });
    }
};

module.exports = { router, authenticateToken, isAdmin };
