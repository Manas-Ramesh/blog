"use client";

import { useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

type Props = {
  postId: number;
  initialLikes: number;
  initialViews: number;
};

function apiBase(): string {
  const u = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!u) return "";
  return u;
}

export function PostInteractions({ postId, initialLikes, initialViews }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [views, setViews] = useState(initialViews);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(AUTH_TOKEN_KEY));
  }, []);

  useEffect(() => {
    const base = apiBase();
    if (!base || !token) return;

    fetch(`${base}/likes/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { liked: false }))
      .then((d) => setLiked(!!d.liked))
      .catch(() => {});

    fetch(`${base}/posts/${postId}/view`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.views === "number") setViews(d.views);
        if (d && typeof d.views_count === "number") setViews(d.views_count);
      })
      .catch(() => {});
  }, [postId, token]);

  async function toggleLike() {
    const base = apiBase();
    if (!base || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${base}/likes/${postId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof data.likes_count === "number") setLikes(data.likes_count);
        setLiked(!!data.liked);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="post-stats" style={{ marginTop: "1.25rem" }}>
      <span>{views} views</span>
      <span>{likes} likes</span>
      {token ? (
        <button type="button" className="btn" disabled={loading} onClick={toggleLike} style={{ padding: "0.25rem 0.65rem", fontSize: "0.85rem" }}>
          {liked ? "Unlike" : "Like"}
        </button>
      ) : (
        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Sign in to like</span>
      )}
    </div>
  );
}
