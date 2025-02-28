const express = require("express");
const db = require("../db"); // Import database connection
const { authenticateToken,isAdmin } = require("./authRoutes");
const { likePost } = require("./likes")

const router = express.Router();

// Get all posts
// Get all posts (or filter by category)
// Get all posts (or filter by category)
router.get("/", (req, res) => {
    const sql = `
        SELECT posts.*, 
               (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comments_count,
               (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes_count 
        FROM posts
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        console.log("✅ Posts Fetched with Likes and Comments:", results);
        res.json(results);
    });
});





// Get a single post by ID
router.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;

        // Fetch the post
        const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Fetch like count
        const likesCount = await db.get("SELECT COUNT(*) AS count FROM likes WHERE post_id = ?", [postId]);

        res.json({ ...post, likes_count: likesCount.count || 0 });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get a single post by slug
// router.get("/slug/:slug", (req, res) => {
//     const { slug } = req.params;

//     db.query("SELECT * FROM posts WHERE slug = ?", [slug], (err, results) => {
//         if (err) return res.status(500).json(err);

//         if (results.length === 0) {
//             return res.status(404).json({ error: "Post not found" });
//         }

//         res.json(results[0]); // Send post details
//     });
// });
// router.get("/slug/:slug", (req, res) => {
//     const slug = req.params.slug;
//     db.query("SELECT * FROM posts WHERE slug = ?", [slug], (err, results) => {
//         if (err) {
//             console.error("Database Error:", err);
//             return res.status(500).json([]);
//         }
//         res.json(results.length > 0 ? results[0] : {});  // ✅ Always returns an object, never `null`
//     });
// });
router.get("/slug/:slug", (req, res) => {
    const slug = req.params.slug;
    
    console.log(`🔍 Fetching post with slug: ${slug}`);

    db.query("SELECT * FROM posts WHERE slug = ?", [slug], (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        if (results.length === 0) {
            console.warn("❌ Post Not Found:", slug);
            return res.status(404).json({ error: "Post not found" });
        }

        console.log("✅ Post Found:", results[0]);
        res.json(results[0]);
    });
});


// Create a new post
const generateSlug = (title) => {
    return title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

// router.post("/", authenticateToken, (req, res) => {
//     let { title, slug, content, tags, category } = req.body;
    
//     if (!title || !content || !category) {
//         return res.status(400).json({ error: "Title, content, and category are required" });
//     }

//     // ✅ Auto-generate slug if not provided
//     slug = slug ? generateSlug(slug) : generateSlug(title);

//     db.query(
//         "INSERT INTO posts (title, slug, content, tags, category) VALUES (?, ?, ?, ?, ?)",
//         [title, slug, content, tags, category],
//         (err, result) => {
//             if (err) return res.status(500).json(err);
//             res.json({ message: "Post created successfully", postId: result.insertId, slug });
//         }
//     );
// });
router.get("/related/:slug", async (req, res) => {
    const slug = req.params.slug;

    db.query(
        "SELECT * FROM posts WHERE slug != ? ORDER BY RAND() LIMIT 3",
        [slug],
        (err, results) => {
            if (err) {
                console.error("❌ Database Error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.json(results);
        }
    );
});



const formatMySQLDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toISOString().slice(0, 19).replace("T", " "); // Convert to 'YYYY-MM-DD HH:MM:SS'
};

router.post("/", authenticateToken,isAdmin, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !content || !category) {
            console.error("❌ Missing required fields:", { title, content, category });
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!req.user || !req.user.email) {
            console.error("❌ Unauthorized access - No user detected.");
            return res.status(401).json({ message: "Unauthorized. No user detected" });
        }

        const author = req.user.email.split("@")[0];  
        const date = formatMySQLDate(new Date()); // ✅ Convert to MySQL format
        const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        console.log("📝 Creating Post:", { title, slug, author, date });

        db.query(
            "INSERT INTO posts (title, content, category, author, date, slug) VALUES (?, ?, ?, ?, ?, ?)",
            [title, content, category, author, date, slug],
            (err, result) => {
                if (err) {
                    console.error("❌ Database Error:", err);
                    return res.status(500).json({ message: "Database error", error: err.message });
                }
                res.status(201).json({ message: "Post created successfully!", postId: result.insertId, slug });
            }
        );
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});




// Delete a post by ID (Admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
    const postId = req.params.id;

    db.query("DELETE FROM posts WHERE id = ?", [postId], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json({ message: "Post deleted successfully" });
    });
});

// Update a post by ID (Admin only)
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

// Get comments for a post
router.get("/:id/comments", (req, res) => {
    const postId = req.params.id;
    db.query("SELECT username, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC", 
        [postId], 
        (err, results) => {
            if (err) {
                console.error("❌ Database Error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.json(results);
        }
    );
});

// Add a new comment
router.post("/:id/comments", authenticateToken, (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    console.log("🔍 Incoming Comment Request by User:", req.user); // Debug log

    if (!req.user) {
        console.error("❌ No user detected.");
        return res.status(401).json({ message: "Unauthorized. No user detected" });
    }

    const username = req.user.name; // Extracted from Google OAuth

    if (!content) {
        return res.status(400).json({ error: "Content is required" });
    }

    db.query(
        "INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)",
        [postId, username, content],
        (err, result) => {
            if (err) {
                console.error("❌ Database Error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.status(201).json({ message: "Comment added successfully!" });
        }
    );
});

// ✅ Define like route correctly
router.post("/:postId/like", likePost);



module.exports = router;
