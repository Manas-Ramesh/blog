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

// ✅ Configure Sessions
router.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecret",
        resave: false,
        saveUninitialized: true,
    })
);
router.use(passport.initialize());
router.use(passport.session());

// ✅ Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
        },
        (accessToken, refreshToken, profile, done) => {
            const user = {
                id: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
            };
            return done(null, user);
        }
    )
);

// ✅ Serialize and Deserialize User
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// ✅ Route: Google Login
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// ✅ Route: Google Callback
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

        res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    }
);
router.post("/login", async (req, res) => {
    const { email } = req.body;

    console.log("🛠 Received Email:", email);  // ✅ Debugging

    if (!email) {
        console.log("❌ No email provided!");
        return res.status(400).json({ message: "Email is required" });
    }

    console.log("🔍 Checking email against admin:", process.env.ADMIN_EMAIL);

    if (email !== process.env.ADMIN_EMAIL) {
        console.log("❌ Access Denied! Email does not match.");
        return res.status(403).json({ message: "Access denied" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("✅ Login Successful, Token Generated!");
    res.json({ token });
});

// ✅ Route: Logout
router.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});
router.get("/", (req, res) => {
    res.json({ message: "Auth routes are working!" });
});

// ✅ Middleware to Protect Routes
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

// ✅ Middleware to Check Admin Access
const isAdmin = (req, res, next) => {
    if (req.user.email === process.env.ADMIN_EMAIL) {
        next();
    } else {
        res.status(403).json({ message: "Unauthorized" });
    }
};

module.exports = { router, authenticateToken, isAdmin };
