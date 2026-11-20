import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { purgeExpiredGuestData } from "@/lib/store";

/**
 * Daily job (vercel.json): deletes guest data of events that ended more than a year ago.
 * Vercel sends "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await purgeExpiredGuestData());
}
