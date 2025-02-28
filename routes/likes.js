const express = require("express");
const router = express.Router();
const db = require("../db"); // ✅ Now using the connection pool
const { authenticateToken } = require("./authRoutes");

router.post("/:postId", authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // ✅ Get a database connection from the pool
        const connection = await db.getConnection();

        // ✅ Check if user already liked the post
        const [existingLikes] = await connection.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (existingLikes.length > 0) {
            await connection.query(
                "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
                [postId, userId]
            );
            connection.release(); // ✅ Release connection back to pool
            return res.json({ message: "Like removed" });
        } else {
            await connection.query(
                "INSERT INTO likes (post_id, user_id) VALUES (?, ?)",
                [postId, userId]
            );
            connection.release(); // ✅ Release connection back to pool
            return res.json({ message: "Post liked" });
        }
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const connection = await db.getConnection();

        const [likesCount] = await connection.query(
            "SELECT COUNT(*) AS count FROM likes WHERE post_id = ?",
            [postId]
        );

        connection.release();
        res.json({ likes_count: likesCount[0]?.count || 0 });
    } catch (error) {
        console.error("❌ Error fetching likes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;