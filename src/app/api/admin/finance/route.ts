import { NextResponse } from "next/server";
import { bad, readJson } from "@/lib/api";
import {
  MIN_PASSWORD,
  hashPassword,
  isLocked,
  isSetupCode,
  lockFinance,
  recordFailure,
  clearFailures,
  requireAdmin,
  unlockFinance,
  verifyPassword,
} from "@/lib/auth";
import { getFinancePasswordHash, setFinancePasswordHash } from "@/lib/store";

/**
 * The finance page's own password.
 *   { action: "setup", code, password }   first time only, with the setup code (ADMIN_TOKEN)
 *   { action: "unlock", password }        opens the page on this device for 2 hours
 *   { action: "change", current, next }   needs the current finance password
 *   { action: "lock" }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  const stored = await getFinancePasswordHash();
  const throttleKey = `fin:${admin.id}`;

  switch (body?.action) {
    case "setup": {
      if (stored) return bad("already_set_up", 409);
      if (isLocked(throttleKey)) return bad("locked", 429);
      if (typeof body.code !== "string" || !isSetupCode(body.code.trim())) {
        recordFailure(throttleKey);
        return bad("invalid_code", 401);
      }
      if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD) return bad("weak_password");
      await setFinancePasswordHash(await hashPassword(body.password));
      await unlockFinance(admin.id);
      return NextResponse.json({ ok: true });
    }
    case "unlock": {
      if (!stored) return bad("not_set_up", 409);
      if (isLocked(throttleKey)) return bad("locked", 429);
      if (typeof body.password !== "string" || !(await verifyPassword(body.password, stored))) {
        recordFailure(throttleKey);
        return bad("wrong_password", 401);
      }
      clearFailures(throttleKey);
      await unlockFinance(admin.id);
      return NextResponse.json({ ok: true });
    }
    case "change": {
      if (!stored) return bad("not_set_up", 409);
      if (typeof body.current !== "string" || !(await verifyPassword(body.current, stored))) return bad("wrong_password", 401);
      if (typeof body.next !== "string" || body.next.length < MIN_PASSWORD) return bad("weak_password");
      await setFinancePasswordHash(await hashPassword(body.next));
      return NextResponse.json({ ok: true });
    }
    case "lock":
      await lockFinance();
      return NextResponse.json({ ok: true });
    default:
      return bad("invalid_action");
  }
}
