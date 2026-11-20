import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run next to `next dev` (e.g. NEXT_DIST_DIR=.next-prod) without clobbering it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
