const express = require("express");
const db = require("../db"); // Import database connection
const { authenticateToken,isAdmin } = require("./authRoutes");

const router = express.Router();

// Get all posts
// Get all posts (or filter by category)
router.get("/", (req, res) => {
    const { category } = req.query;
    let sql = "SELECT * FROM posts";

    if (category) {
        sql += " WHERE category = ?";
    }

    db.query(sql, category ? [category] : [], (err, results) => {
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

router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log("🔍 User Posting:", req.user);

        // ✅ Extract username from email
        const author = req.user?.email ? req.user.email.split("@")[0] : "Unknown";

        if (!author) {
            console.error("❌ Error: Author is missing!");
            return res.status(400).json({ error: "Author is missing" });
        }

        console.log("✅ Author being saved:", author);

        const date = new Date().toISOString(); // ✅ Store date in ISO format

        db.query(
            "INSERT INTO posts (title, content, category, author, date) VALUES (?, ?, ?, ?, ?)",
            [title, content, category, author, date],
            (err, result) => {
                if (err) {
                    console.error("❌ Database Insert Error:", err);
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(201).json({ message: "Post created successfully!", postId: result.insertId });
            }
        );
    } catch (error) {
        console.error("❌ Error creating post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Delete a post by ID (Admin only)
router.delete("/:id", authenticateToken, (req, res) => {
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
router.put("/:id", authenticateToken, (req, res) => {
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




module.exports = router;
