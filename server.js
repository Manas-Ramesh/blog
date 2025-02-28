
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { router: authRoutes, authenticateToken, isAdmin } = require("./routes/authRoutes");
const postRoutes = require("./routes/posts"); 

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
const likesRoutes = require("./routes/likes");
app.use("/", likesRoutes);


app.get("/admin", authenticateToken, isAdmin, (req, res) => {
    res.json({ message: `Welcome, Admin! (${req.user.email})` });
});

app.get("/", (req, res) => {
    res.send("Backend is running with Google OAuth!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
