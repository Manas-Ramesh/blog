const express = require("express");
const router = express.Router();
const db = require("../db"); // Ensure correct DB import
const { authenticateToken } = require("./authRoutes"); 

// Toggle Like on a Post
router.post("/:postId", authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // Ensure req.user is populated from JWT

        // Check if user already liked the post
        db.query("SELECT * FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length > 0) {
                // Unlike the post
                db.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId], (deleteErr) => {
                    if (deleteErr) {
                        console.error("Error unliking post:", deleteErr);
                        return res.status(500).json({ message: "Error unliking post" });
                    }
                    return res.json({ message: "Like removed" });
                });
            } else {
                // Add a new like
                db.query("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [postId, userId], (insertErr) => {
                    if (insertErr) {
                        console.error("Error liking post:", insertErr);
                        return res.status(500).json({ message: "Error liking post" });
                    }
                    return res.json({ message: "Post liked" });
                });
            }
        });

    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get the like count for a post
router.get("/:postId", async (req, res) => {
    try {
        const { postId } = req.params;

        db.query("SELECT COUNT(*) AS count FROM likes WHERE post_id = ?", [postId], (err, results) => {
            if (err) {
                console.error("Error fetching like count:", err);
                return res.status(500).json({ message: "Internal server error" });
            }

            res.json({ likes_count: results[0].count || 0 });
        });

    } catch (error) {
        console.error("Error fetching like count:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
