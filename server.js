require("dotenv").config();
const express = require("express");
const db = require("./db"); // Import database connection

const app = express();
const PORT = process.env.PORT || 3001;
const cors = require("cors");
app.use(cors()); // ✅ Allow frontend to access backend

app.use(express.json()); // Allows JSON requests
app.use(express.urlencoded({ extended: true }));
const postRoutes = require("./routes/posts"); // Import posts route
app.use("/posts", postRoutes); // Use it at /posts

app.get("/", (req, res) => {
    res.send("Backend is running and connected to MySQL!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
