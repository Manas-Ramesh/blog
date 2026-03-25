import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export default function LoginPage() {
  return (
    <main>
      <h1 className="article-title" style={{ marginTop: "2.5rem" }}>
        Sign in
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: "32rem" }}>
        Use Google to sign in. After authorizing, you’ll return here with a session token so you can comment, like posts, and
        (if you’re the site owner) publish new posts.
      </p>
      <Suspense fallback={<p style={{ color: "var(--muted)" }}>Loading…</p>}>
        <LoginClient />
      </Suspense>
    </main>
  );
}
