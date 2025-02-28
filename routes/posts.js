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




// ✅ Get all posts (with likes and comments count)
router.get("/", async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [results] = await connection.query(`
            SELECT posts.*, 
                   (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comments_count,
                   (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes_count,
                   (SELECT COUNT(*) FROM views WHERE views.post_id = posts.id) AS views
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
                (SELECT COUNT(*) FROM views WHERE post_id = ?) AS views,`,
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
router.put("/:id", authenticateToken, isAdmin, (req, res) => {
    const postId = req.params.id;
    const { title, slug, content, tags, category } = req.body;

    if (!title || !slug || !content || !category) {
        return res.status(400).json({ error: "Title, slug, content, and category are required" });
    }

    // ✅ Ensure the existing `author` and `date` are not overwritten
    db.query(
        "UPDATE posts SET title = ?, slug = ?, content = ?, tags = ?, category = ?, date = NOW() WHERE id = ?",
        [title, slug, content, tags, category, postId],
        (err, result) => {
            if (err) {
                console.error("❌ Update Error:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Post not found" });
            }

            console.log("✅ Post updated successfully:", { postId, title, slug, category });
            res.json({ message: "Post updated successfully" });
        }
    );
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
// ✅ Track a view only if the user hasn't viewed it before
router.post("/:id/view", authenticateToken, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userEmail = req.user.email;

        if (!userEmail) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const connection = await db.getConnection();

        // ✅ Check if the user has already viewed the post
        const [existingView] = await connection.query(
            "SELECT * FROM views WHERE post_id = ? AND user_email = ?",
            [postId, userEmail]
        );

        if (existingView.length > 0) {
            console.log("✅ View already recorded:", { views_count: existingView.length });

            // ✅ Fetch updated view count
            const [[{ views }]] = await connection.query(
                "SELECT COUNT(*) AS views FROM views WHERE post_id = ?",
                [postId]
            );

            connection.release();
            return res.json({ views_count, message: "View already recorded" });
        }

        // ✅ Insert new view if none exists
        await connection.query("INSERT INTO views (post_id, user_email) VALUES (?, ?)", [postId, userEmail]);

        // ✅ Fetch updated view count
        const [[{ views }]] = await connection.query(
            "SELECT COUNT(*) AS views FROM views WHERE post_id = ?",
            [postId]
        );

        connection.release();
        return res.json({ views_count, message: "View recorded successfully" });

    } catch (error) {
        console.error("❌ Error tracking view:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});



// // ✅ Track a view only if the user hasn't viewed it before
// router.post("/:id/view", authenticateToken, async (req, res) => {
//     try {
//         const { id: postId } = req.params;
//         const userEmail = req.user.email;

//         if (!userEmail) {
//             return res.status(401).json({ message: "Unauthorized" });
//         }

//         const connection = await db.getConnection();

//         const [existingView] = await connection.query(
//             "SELECT * FROM views WHERE post_id = ? AND user_email = ?",
//             [postId, userEmail]
//         );

//         if (existingView.length > 0) {
//             connection.release();
//             return res.json({ message: "View already recorded" });
//         }
//         const [[{ views_count }]] = await connection.query(
//             "SELECT COUNT(*) AS views_count FROM views WHERE post_id = ?",
//             [postId]
//         );
//         await connection.query("INSERT INTO views (post_id, user_email) VALUES (?, ?)", [postId, userEmail]);
//         res.json({ views_count }); // ✅ Ensure `liked` is included in response

//         connection.release();
//         res.json({ message: "View recorded" });
//     } catch (error) {
//         console.error("❌ Error tracking view:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

router.get("/related/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;
        const connection = await db.getConnection();

        const [results] = await connection.query(
            "SELECT * FROM posts WHERE slug != ? ORDER BY RAND() LIMIT 3",
            [slug]
        );

        connection.release();

        if (results.length === 0) {
            return res.status(200).json([]); // ✅ Return empty array instead of 404
        }

        res.json(results);
    } catch (error) {
        console.error("❌ Database Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
