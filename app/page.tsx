import { fetchPosts, uniqueCategories } from "@/lib/posts";
import { getApiUrlSafe } from "@/lib/api-url";
import { PostCard } from "@/components/PostCard";
import { CategoryFilter } from "@/components/CategoryFilter";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { category } = await searchParams;
  const base = getApiUrlSafe();

  if (!base) {
    return (
      <main>
        <div className="empty-state">
          <p>
            Set <code>NEXT_PUBLIC_API_URL</code> in Vercel (your Render API URL, e.g.{" "}
            <code>https://blog-backend-xxxx.onrender.com</code>) and redeploy.
          </p>
        </div>
      </main>
    );
  }

  const allForNav = await fetchPosts();
  const categories = uniqueCategories(allForNav);
  const posts = category ? await fetchPosts(category) : allForNav;

  return (
    <main>
      <p style={{ marginTop: "2rem", color: "var(--muted)", fontSize: "1.05rem", maxWidth: "36rem" }}>
        Poems, a three-part series from life, and a longer fictional arc — all in one place.
      </p>

      <CategoryFilter categories={categories} active={category} />

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>No posts yet{category ? ` in “${category}”` : ""}.</p>
        </div>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </ul>
      )}
    </main>
  );
}
