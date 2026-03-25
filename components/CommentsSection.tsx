"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/types";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

type Props = {
  postId: number;
};

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

export function CommentsSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(AUTH_TOKEN_KEY));
  }, []);

  async function load() {
    const base = apiBase();
    if (!base) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const base = apiBase();
    if (!base || !token || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${base}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message || "Could not post comment");
        return;
      }
      setContent("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="section-title">Comments</h2>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No comments yet.</p>
      ) : (
        <ul className="comments-list">
          {comments.map((c, i) => (
            <li key={`${c.created_at}-${i}`} className="comment">
              <div className="comment__author">{c.username}</div>
              <div className="comment__time">{new Date(c.created_at).toLocaleString()}</div>
              <p className="comment__body">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {token ? (
        <form className="comment-form" onSubmit={submit} style={{ marginTop: "1.5rem" }}>
          {error && (
            <p className="message message--error" style={{ marginBottom: "0.75rem" }}>
              {error}
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment…"
            required
          />
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "0.95rem" }}>
          <a href="/login">Sign in</a> to leave a comment.
        </p>
      )}
    </section>
  );
}
