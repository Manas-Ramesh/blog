import Link from "next/link";
import type { Post } from "@/lib/types";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">More posts</h2>
      <div className="related-grid">
        {posts.map((p) => (
          <Link key={p.id} href={`/posts/${p.slug}`} className="post-card">
            <div className="post-card__meta">{p.category}</div>
            <h3 className="post-card__title" style={{ fontSize: "1.1rem" }}>
              {p.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
