import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { MIN_PASSWORD, hashPassword, isEmail, isSetupCode, recordFailure, isLocked, startSession } from "@/lib/auth";
import { addAdminUser, listAdminUsers } from "@/lib/store";

/**
 * Creates the very first dashboard account. Only works while there are no accounts,
 * and only with the setup code (ADMIN_TOKEN from .env.local / Vercel).
 * Body: { code, name, email, password }
 */
export async function POST(req: Request) {
  if ((await listAdminUsers()).length > 0) return bad("already_set_up", 409);
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (isLocked(`setup:${ip}`)) return bad("locked", 429);

  const body = await readJson(req);
  if (typeof body?.code !== "string" || !isSetupCode(body.code.trim())) {
    recordFailure(`setup:${ip}`);
    return bad("invalid_code", 401);
  }
  const name = cleanText(body.name, 40);
  if (!name) return bad("name_required");
  if (!isEmail(body.email)) return bad("invalid_email");
  if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD) return bad("weak_password");

  const user = await addAdminUser({ name, email: body.email, passwordHash: await hashPassword(body.password) });
  if (!user) return bad("email_taken", 409);
  await startSession(user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
