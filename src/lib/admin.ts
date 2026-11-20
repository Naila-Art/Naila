import "server-only";
import { timingSafeEqual } from "crypto";

/**
 * Our admin dashboard is opened by a private link, /admin/{ADMIN_TOKEN}, like the client page.
 * Set ADMIN_TOKEN in .env.local (and in Vercel). In development only, a fixed demo key is used if it's missing.
 */
const DEV_KEY = "admin-dev-k7p3x9";

export function adminKey(): string | null {
  const key = process.env.ADMIN_TOKEN?.trim();
  if (key) return key;
  return process.env.NODE_ENV === "development" ? DEV_KEY : null;
}

export function isAdmin(candidate: string): boolean {
  const key = adminKey();
  if (!key) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
