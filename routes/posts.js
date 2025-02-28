const express = require("express");
const db = require("../db"); // Import database connection
const { authenticateToken, isAdmin } = require("./authRoutes");

const router = express.Router();
router.post("/:id/comments", authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { content } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. No user detected" });
        }

        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        const username = req.user.name; // Extracted from Google OAuth

        const connection = await db.getConnection();
        await connection.query(
            "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)",
            [postId, username, content]
        );

        connection.release();

        res.status(201).json({ message: "Comment added successfully!" });
    } catch (error) {
        console.error("❌ Error adding comment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:id/comments", async (req, res) => {
    try {
        const postId = req.params.id;
        const connection = await db.getConnection();

        const [results] = await connection.query(
            "SELECT username, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC",
            [postId]
        );

        connection.release();

        if (results.length === 0) {
            return res.status(200).json([]); // ✅ Return empty array instead of 404
        }

        res.json(results);
    } catch (error) {
        console.error("❌ Database Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Toggle Like on a Post
router.post("/likes/:id", authenticateToken, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.id;

        const connection = await db.getConnection();

        // ✅ Check if user already liked the post
        const [existingLike] = await connection.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (existingLike.length > 0) {
            // ✅ Unlike the post
            await connection.query("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
            connection.release();
            return res.json({ message: "Like removed" });
        } else {
            // ✅ Add a new like
            await connection.query("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
            connection.release();
            return res.json({ message: "Post liked" });
        }
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Get all posts (with likes and comments count)
router.get("/", async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [results] = await connection.query(`
            SELECT posts.*, 
                   (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comments_count,
                   (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes_count 
            FROM posts
        `);
        connection.release();

        res.json(results);
    } catch (error) {
        console.error("❌ Database Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Get a single post by ID (including likes & views)
router.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const connection = await db.getConnection();

        // ✅ Fetch the post
        const [postResults] = await connection.query("SELECT * FROM posts WHERE id = ?", [postId]);

        if (postResults.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Post not found" });
        }

        const post = postResults[0];

        // ✅ Fetch like and view counts
        const [counts] = await connection.query(
            `SELECT 
                (SELECT COUNT(*) FROM likes WHERE post_id = ?) AS likes_count,
                (SELECT COUNT(*) FROM views WHERE post_id = ?) AS views_count`,
            [postId, postId]
        );

        connection.release();

        res.json({
            ...post,
            likes_count: counts[0]?.likes_count || 0,
            views_count: counts[0]?.views_count || 0,
        });
    } catch (error) {
        console.error("❌ Error fetching post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Get a single post by slug
router.get("/slug/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;
        const connection = await db.getConnection();

        console.log(`🔍 Fetching post with slug: ${slug}`);

        const [results] = await connection.query("SELECT * FROM posts WHERE slug = ?", [slug]);

        connection.release();

        if (results.length === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(results[0]);
    } catch (error) {
        console.error("❌ Database Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Create a new post (Admin Only)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Unauthorized. No user detected" });
        }

        const author = req.user.email.split("@")[0];  
        const date = new Date().toISOString().slice(0, 19).replace("T", " ");
        const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const connection = await db.getConnection();
        await connection.query(
            "INSERT INTO posts (title, content, category, author, date, slug) VALUES (?, ?, ?, ?, ?, ?)",
            [title, content, category, author, date, slug]
        );
        connection.release();

        res.status(201).json({ message: "Post created successfully!", slug });
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Delete a post (Admin Only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const postId = req.params.id;
        const connection = await db.getConnection();
        const [result] = await connection.query("DELETE FROM posts WHERE id = ?", [postId]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("❌ Database Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ✅ Track a view only if the user hasn't viewed it before
router.post("/:id/view", authenticateToken, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userEmail = req.user.email;

        if (!userEmail) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const connection = await db.getConnection();

        const [existingView] = await connection.query(
            "SELECT * FROM views WHERE post_id = ? AND user_email = ?",
            [postId, userEmail]
        );

        if (existingView.length > 0) {
            connection.release();
            return res.json({ message: "View already recorded" });
        }

        await connection.query("INSERT INTO views (post_id, user_email) VALUES (?, ?)", [postId, userEmail]);

        connection.release();
        res.json({ message: "View recorded" });
    } catch (error) {
        console.error("❌ Error tracking view:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
