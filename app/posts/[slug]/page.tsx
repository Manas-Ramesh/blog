import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPostBySlug, fetchRelated } from "@/lib/posts";
import { getApiUrlSafe } from "@/lib/api-url";
import { PostInteractions } from "@/components/PostInteractions";
import { CommentsSection } from "@/components/CommentsSection";
import { RelatedPosts } from "@/components/RelatedPosts";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.content.slice(0, 160).replace(/\s+/g, " ").trim(),
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const base = getApiUrlSafe();
  if (!base) notFound();

  const post = await fetchPostBySlug(slug);
  if (!post) notFound();

  const related = await fetchRelated(slug);
  const views = post.views_count ?? post.views ?? 0;
  const likes = post.likes_count ?? 0;

  return (
    <main>
      <article>
        <header className="article-header">
          <div className="post-card__meta">{post.category}</div>
          <h1 className="article-title">{post.title}</h1>
          <p className="article-meta">
            {post.author && <span>By {post.author}</span>}
            {post.date && (
              <>
                {post.author ? " · " : null}
                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString(undefined, { dateStyle: "long" })}</time>
              </>
            )}
          </p>
          <PostInteractions postId={post.id} initialLikes={likes} initialViews={views} />
        </header>

        <div className="article-body">{post.content}</div>
      </article>

      <CommentsSection postId={post.id} />
      <RelatedPosts posts={related} />
    </main>
  );
}
