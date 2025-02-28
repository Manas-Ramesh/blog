const express = require("express");
const db = require("../db"); 
const { authenticateToken } = require("./authRoutes");

const router = express.Router();

// ✅ Get likes count for a post
router.get("/:postId", (req, res) => {
    const { postId } = req.params;
    db.query("SELECT COUNT(*) AS likes FROM likes WHERE post_id = ?", [postId], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json({ likes: result[0].likes });
    });
});

// ✅ Check if user liked a post
router.get("/:postId/liked", authenticateToken, (req, res) => {
    const { postId } = req.params;
    const userEmail = req.user.email;

    db.query("SELECT * FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json({ liked: result.length > 0 });
    });
});

// ✅ Like a post
router.post("/:postId", authenticateToken, (req, res) => {
    const { postId } = req.params;
    const userEmail = req.user.email;

    db.query("INSERT INTO likes (post_id, user_email) VALUES (?, ?)", [postId, userEmail], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ message: "Already liked this post" });
            }
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json({ message: "Post liked!" });
    });
});

// ✅ Unlike a post
router.delete("/:postId", authenticateToken, (req, res) => {
    const { postId } = req.params;
    const userEmail = req.user.email;

    db.query("DELETE FROM likes WHERE post_id = ? AND user_email = ?", [postId, userEmail], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "You haven't liked this post" });
        }

        res.json({ message: "Like removed" });
    });
});

module.exports = router;
