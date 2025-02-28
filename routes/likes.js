const express = require("express");
const router = express.Router();
const db = require("../db"); // ✅ Now using the connection pool
const { authenticateToken } = require("./authRoutes");

router.post("/likes/:id", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userEmail = req.user.email; // ✅ Use email instead of ID

        if (!postId || !userEmail) {
            return res.status(400).json({ message: "Post ID and User Email are required." });
        }

        console.log("🔍 Toggling like for Post ID:", postId, "by User Email:", userEmail);

        const connection = await db.getConnection();

        // ✅ Check if user already liked the post
        const [existingLike] = await connection.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_email = ?",
            [postId, userEmail]
        );

        if (existingLike.length > 0) {
            // ✅ Unlike the post
            await connection.query("DELETE FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail]);
            connection.release();
            return res.json({ message: "Like removed" });
        } else {
            // ✅ Add a new like
            await connection.query("INSERT INTO likes (post_id, user_email) VALUES (?, ?)", [postId, userEmail]);
            connection.release();
            return res.json({ message: "Post liked" });
        }
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

router.get("/likes/:id", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userEmail = req.user.email; // ✅ Use email instead of ID

        if (!postId || !userEmail) {
            return res.status(400).json({ message: "Post ID and User Email are required." });
        }

        const connection = await db.getConnection();

        // ✅ Check if the user has liked the post
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

module.exports = router;