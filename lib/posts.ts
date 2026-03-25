import type { Post } from "./types";
import { getApiUrlSafe } from "./api-url";

export async function fetchPosts(category?: string): Promise<Post[]> {
  const base = getApiUrlSafe();
  if (!base) return [];

  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${base}/posts${q}`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const base = getApiUrlSafe();
  if (!base) return null;

  const res = await fetch(`${base}/posts/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchRelated(slug: string): Promise<Post[]> {
  const base = getApiUrlSafe();
  if (!base) return [];

  const res = await fetch(`${base}/posts/related/${encodeURIComponent(slug)}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) return [];
  return res.json();
}

export function uniqueCategories(posts: Post[]): string[] {
  const s = new Set(posts.map((p) => p.category).filter(Boolean));
  return Array.from(s).sort();
}
