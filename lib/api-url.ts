/** Public base URL of the Express API (Render). Set in Vercel + .env.local. */
export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it in Vercel Environment Variables (your Render backend URL, e.g. https://blog-backend-xxxx.onrender.com)."
    );
  }
  return url;
}

/** Server-side fetch: allows missing env during build if pages are dynamic */
export function getApiUrlSafe(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return url || null;
}
