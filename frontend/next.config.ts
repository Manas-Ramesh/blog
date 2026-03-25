import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: backend lockfile at repo root; keep tracing scoped to this app
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
