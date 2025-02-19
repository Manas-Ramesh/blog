const express = require("express");
const db = require("../db"); // Import database connection

const router = express.Router();

// Get all posts
router.get("/", (req, res) => {
    db.query("SELECT * FROM posts ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
// Get a single post by ID
router.get("/:id", (req, res) => {
    const postId = req.params.id;

    db.query("SELECT * FROM posts WHERE id = ?", [postId], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(results[0]); // Send post details
    });
});
// Get a single post by slug
router.get("/slug/:slug", (req, res) => {
    const { slug } = req.params;

    db.query("SELECT * FROM posts WHERE slug = ?", [slug], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(results[0]); // Send post details
    });
});

// Create a new post
router.post("/", (req, res) => {
    const { title, slug, content, tags } = req.body;
    
    if (!title || !slug || !content) {
        return res.status(400).json({ error: "Title, slug, and content are required" });
    }

    db.query(
        "INSERT INTO posts (title, slug, content, tags) VALUES (?, ?, ?, ?)",
        [title, slug, content, tags],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Post created successfully", postId: result.insertId });
        }
    );
});
// Delete a post by ID
router.delete("/:id", (req, res) => {
    const postId = req.params.id;

    db.query("DELETE FROM posts WHERE id = ?", [postId], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json({ message: "Post deleted successfully" });
    });
});
// Update a post by ID
router.put("/:id", (req, res) => {
    const postId = req.params.id;
    const { title, slug, content, tags } = req.body;

    if (!title || !slug || !content) {
        return res.status(400).json({ error: "Title, slug, and content are required" });
    }

    db.query(
        "UPDATE posts SET title = ?, slug = ?, content = ?, tags = ? WHERE id = ?",
        [title, slug, content, tags, postId],
        (err, result) => {
            if (err) return res.status(500).json(err);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Post not found" });
            }

            res.json({ message: "Post updated successfully" });
        }
    );
});

module.exports = router;
