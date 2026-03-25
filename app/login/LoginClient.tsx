"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

export function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    if (error === "unauthorized") {
      setMessage("That Google account isn’t authorized for this site.");
      return;
    }
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      router.replace("/");
    }
  }, [searchParams, router]);

  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (!api) {
    return <p className="message message--error">NEXT_PUBLIC_API_URL is not configured.</p>;
  }

  const googleUrl = `${api}/auth/google`;

  return (
    <div style={{ marginTop: "2rem" }}>
      {message && <p className="message message--error">{message}</p>}
      <a className="btn btn--primary" href={googleUrl}>
        Continue with Google
      </a>
    </div>
  );
}
