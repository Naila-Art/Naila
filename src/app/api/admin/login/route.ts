import { NextResponse } from "next/server";
import { bad, readJson } from "@/lib/api";
import { clearFailures, isEmail, isLocked, recordFailure, startSession, verifyPassword } from "@/lib/auth";
import { findAdminByEmail } from "@/lib/store";

/** Body: { email, password }. Same answer for a wrong email or a wrong password. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!isEmail(email) || !password) return bad("invalid_login", 401);

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const keys = [`e:${email}`, `ip:${ip}`];
  if (keys.some(isLocked)) return bad("locked", 429);

  const user = await findAdminByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    keys.forEach(recordFailure);
    return bad("invalid_login", 401);
  }
  keys.forEach(clearFailures);
  await startSession(user.id);
  return NextResponse.json({ ok: true, name: user.name });
}
