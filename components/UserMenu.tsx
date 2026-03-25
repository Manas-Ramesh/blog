"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_TOKEN_KEY } from "@/lib/auth-token";

export function UserMenu() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem(AUTH_TOKEN_KEY));
  }, []);

  function signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setHasToken(false);
    window.location.href = "/";
  }

  if (!hasToken) {
    return <Link href="/login">Sign in</Link>;
  }

  return (
    <>
      <button type="button" className="btn" onClick={signOut} style={{ fontSize: "0.85rem", padding: "0.35rem 0.65rem" }}>
        Sign out
      </button>
    </>
  );
}
