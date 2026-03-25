import { NewPostForm } from "./NewPostForm";

export default function NewPostPage() {
  return (
    <main>
      <h1 className="article-title" style={{ marginTop: "2.5rem" }}>
        New post
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", maxWidth: "32rem" }}>
        Only the admin account configured on the API can create posts. Sign in first, then submit. Slug is generated from the
        title on the server.
      </p>
      <NewPostForm />
    </main>
  );
}
