const express = require("express");
const db = require("../db");
const { authenticateToken } = require("./authRoutes");

const router = express.Router();

// ✅ Get like status
router.get("/likes/:id", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userEmail = req.user.email;

        if (!postId || !userEmail) {
            return res.status(400).json({ message: "Post ID and User Email are required." });
        }

        const connection = await db.getConnection();
        const [existingLike] = await connection.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_email = ?",
            [postId, userEmail]
        );

        connection.release();
        res.json({ liked: existingLike.length > 0 });
    } catch (error) {
        console.error("❌ Error checking like status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Toggle like
router.post("/likes/:id", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userEmail = req.user.email;

        if (!postId || !userEmail) {
            return res.status(400).json({ message: "Post ID and User Email are required." });
        }

        console.log("🔍 Toggling like for Post ID:", postId, "by User Email:", userEmail);

        const connection = await db.getConnection();

        const [existingLike] = await connection.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_email = ?",
            [postId, userEmail]
        );

        if (existingLike.length > 0) {
            await connection.query("DELETE FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail]);
            connection.release();
            return res.json({ message: "Like removed" });
        } else {
            await connection.query("INSERT INTO likes (post_id, user_email) VALUES (?, ?)", [postId, userEmail]);
            connection.release();
            return res.json({ message: "Post liked" });
        }
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

module.exports = router;
