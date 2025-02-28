const express = require("express");
const router = express.Router();
const db = require("../db"); // Ensure correct DB import
const { authenticateToken } = require("./authRoutes"); 

// Toggle Like on a Post
router.post("/:postId", authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userEmail = req.user.email; // Get user's email from JWT

        console.log(`🔍 Incoming Like Request - User: ${userEmail}, Post: ${postId}`);

        // Check if user already liked the post
        db.query("SELECT * FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail], (err, results) => {
            if (err) {
                console.error("❌ Database error on SELECT:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length > 0) {
                console.log("🛑 User already liked this post. Removing like...");
                db.query("DELETE FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail], (deleteErr) => {
                    if (deleteErr) {
                        console.error("❌ Error unliking post:", deleteErr);
                        return res.status(500).json({ message: "Error unliking post" });
                    }
                    return res.json({ message: "Like removed" });
                });
            } else {
                console.log("❤️ User is liking this post...");
                db.query("INSERT INTO likes (post_id, user_email, created_at) VALUES (?, ?, NOW())", [postId, userEmail], (insertErr) => {
                    if (insertErr) {
                        console.error("❌ Error liking post:", insertErr);
                        return res.status(500).json({ message: "Error liking post" });
                    }
                    return res.json({ message: "Post liked" });
                });
            }
        });

    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Get the like count for a post
router.get("/:postId", authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userEmail = req.user.email;

        console.log(`🔍 Checking if user ${userEmail} liked post ${postId}`);

        const likeCheck = await db.query("SELECT * FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail]);

        res.json({ liked: likeCheck.length > 0 });
    } catch (error) {
        console.error("❌ Error checking like status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
