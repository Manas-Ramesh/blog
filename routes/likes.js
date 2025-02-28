const express = require("express");
const router = express.Router();
const db = require("../db"); // Ensure it's the promise-based db.js
const { authenticateToken } = require("./authRoutes");

// ✅ Toggle Like on a Post
router.post("/:postId", authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // Ensure req.user is populated

        // ✅ Check if user already liked the post
        const [existingLikes] = await db.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (existingLikes.length > 0) {
            // Unlike the post
            await db.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
            return res.json({ message: "Like removed" });
        } else {
            // Add a new like
            await db.query("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
            return res.json({ message: "Post liked" });
        }
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Get Like Count
router.get("/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        console.log(`🔍 Checking likes for post ID: ${postId}`);

        const [likesCount] = await db.query(
            "SELECT COUNT(*) AS count FROM likes WHERE post_id = ?",
            [postId]
        );

        console.log("✅ Raw Query Result:", likesCount); // Debug log

        if (!likesCount || likesCount.length === 0) {
            console.warn("⚠️ No likes found for post:", postId);
            return res.json({ likes_count: 0 });
        }

        res.json({ likes_count: likesCount[0].count || 0 });
    } catch (error) {
        console.error("❌ Database Error Fetching Likes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;
