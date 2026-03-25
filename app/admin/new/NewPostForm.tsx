"use client";

import { useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

export function NewPostForm() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!base || !token) {
      setErrMsg("Sign in first (token missing).");
      setStatus("err");
      return;
    }
    setStatus("loading");
    setErrMsg(null);
    try {
      const res = await fetch(`${base}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrMsg(data.message || `Error ${res.status}`);
        setStatus("err");
        return;
      }
      setSlug(data.slug || null);
      setStatus("ok");
      setTitle("");
      setCategory("");
      setContent("");
    } catch {
      setErrMsg("Network error");
      setStatus("err");
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {status === "ok" && (
        <p className="message message--ok">
          Post created.
          {slug ? (
            <>
              {" "}
              <a href={`/posts/${slug}`}>View post</a>
            </>
          ) : null}
        </p>
      )}
      {status === "err" && errMsg && <p className="message message--error">{errMsg}</p>}

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Category
        <input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Poems, Series, Fiction" />
      </label>
      <label>
        Content
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
      </label>
      <button type="submit" className="btn btn--primary" disabled={status === "loading"}>
        {status === "loading" ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
