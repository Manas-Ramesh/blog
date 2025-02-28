const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken,isAdmin } = require("./authRoutes");

// Toggle Like on a Post
router.post("/:postId", authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // Get logged-in user ID

        // Check if user already liked the post
        const existingLike = await db.get("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId]);

        if (existingLike) {
            // Unlike the post
            await db.run("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
            return res.json({ message: "Like removed" });
        } else {
            // Add a new like
            await db.run("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
            return res.json({ message: "Post liked" });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
