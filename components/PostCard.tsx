import Link from "next/link";
import type { Post } from "@/lib/types";

function excerpt(content: string, max = 160) {
  const t = content.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

export function PostCard({ post }: { post: Post }) {
  const views = post.views ?? post.views_count ?? 0;
  const likes = post.likes_count ?? 0;
  const comments = post.comments_count ?? 0;

  return (
    <li>
      <Link href={`/posts/${post.slug}`} className="post-card">
        <div className="post-card__meta">{post.category}</div>
        <h2 className="post-card__title">{post.title}</h2>
        <p className="post-card__excerpt">{excerpt(post.content)}</p>
        <div className="post-stats">
          {post.date && <span>{new Date(post.date).toLocaleDateString()}</span>}
          <span>{views} views</span>
          <span>{likes} likes</span>
          <span>{comments} comments</span>
        </div>
      </Link>
    </li>
  );
}
