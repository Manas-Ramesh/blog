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

        const connection = await db.getConnection();

        const [existingLike] = await connection.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_email = ?",
            [postId, userEmail]
        );

        if (existingLike.length > 0) {
            await connection.query("DELETE FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail]);
        } else {
            await connection.query("INSERT INTO likes (post_id, user_email) VALUES (?, ?)", [postId, userEmail]);
        }

        // ✅ Fetch updated like count
        const [[{ likes_count }]] = await connection.query(
            "SELECT COUNT(*) AS likes_count FROM likes WHERE post_id = ?",
            [postId]
        );

        connection.release();
        res.json({ likes_count, liked: likes_count > 0 }); // ✅ Ensure `liked` is included in response
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
