import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { promisify } from "util";
import { getAdminUser } from "./store";
import type { AdminUser } from "./types";

/**
 * Dashboard login: email + password per team member (hashed with scrypt), and a signed,
 * httpOnly session cookie. The client page stays a password-free private link.
 *
 * SESSION_SECRET signs the cookie (set it in .env.local / Vercel). Without it, development
 * derives one from ADMIN_TOKEN; production refuses to start a session.
 * ADMIN_TOKEN is only the setup code for creating the very first account.
 */

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const COOKIE = "adm_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

function secret(): Buffer {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return Buffer.from(s);
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_STORAGE !== "1") {
    throw new Error("SESSION_SECRET is not set");
  }
  return createHmac("sha256", "dev-session").update(process.env.ADMIN_TOKEN ?? "dev").digest();
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/** Starts a session for this admin (sets the cookie). */
export async function startSession(userId: string): Promise<void> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_STORAGE,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in admin, or null. A deleted account loses access immediately. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    if (!uid || exp < Date.now()) return null;
    return await getAdminUser(uid);
  } catch {
    return null;
  }
}

/**
 * For admin API routes: the admin, or a 401 response.
 * Changes must come from our own pages (Origin check) as a second guard against cross-site requests.
 */
export async function requireAdmin(req?: Request): Promise<AdminUser | NextResponse> {
  if (req && req.method !== "GET") {
    const origin = req.headers.get("origin");
    const host = (await headers()).get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  const admin = await currentAdmin();
  return admin ?? NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// ---- Login throttling: 5 wrong passwords lock that email for 10 minutes; an IP (shared by an office or
// a phone network) only after 20, so one person's typos don't lock out everyone on the same connection. ----
const FAILS = new Map<string, { count: number; until: number }>();
const maxFails = (key: string) => (key.startsWith("ip:") ? 20 : 5);
const LOCK_MS = 10 * 60 * 1000;

export function isLocked(key: string): boolean {
  const f = FAILS.get(key);
  return Boolean(f && f.count >= maxFails(key) && f.until > Date.now());
}

export function recordFailure(key: string): void {
  const f = FAILS.get(key);
  const fresh = !f || f.until < Date.now();
  FAILS.set(key, { count: fresh ? 1 : f!.count + 1, until: Date.now() + LOCK_MS });
}

export function clearFailures(key: string): void {
  FAILS.delete(key);
}

/** The first account can only be created with the setup code (ADMIN_TOKEN). */
export function isSetupCode(code: string): boolean {
  const token = process.env.ADMIN_TOKEN?.trim();
  if (!token) return false;
  const a = Buffer.from(code);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const MIN_PASSWORD = 8;
export const isEmail = (v: unknown): v is string => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 120;

// ---- Finance page: its own password, unlocked per device for 2 hours. ----
const FIN_COOKIE = "adm_finance";
const FIN_HOURS = 2;

/** Unlocks the finance page for this admin on this device. */
export async function unlockFinance(adminId: string): Promise<void> {
  const exp = Date.now() + FIN_HOURS * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ uid: adminId, exp, f: 1 })).toString("base64url");
  (await cookies()).set(FIN_COOKIE, `${payload}.${sign(`fin:${payload}`)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_STORAGE,
    path: "/",
    maxAge: FIN_HOURS * 60 * 60,
  });
}

export async function lockFinance(): Promise<void> {
  (await cookies()).delete(FIN_COOKIE);
}

/** True when the signed-in admin unlocked the finance page on this device within the last 2 hours. */
export async function financeUnlocked(adminId: string): Promise<boolean> {
  const raw = (await cookies()).get(FIN_COOKIE)?.value;
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  const expected = Buffer.from(sign(`fin:${payload}`));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return false;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    return uid === adminId && exp > Date.now();
  } catch {
    return false;
  }
}
