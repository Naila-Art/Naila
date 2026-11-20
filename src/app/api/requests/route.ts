import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { normalizePhone } from "@/lib/guests";
import { getPackage, isSelfServe } from "@/lib/pricing";
import { createCustomRequest, getPricing } from "@/lib/store";
import { CATEGORY_LABELS, type Category, type PackageId } from "@/lib/types";

/** Packages 3-4 are made by our team: the client leaves their details and we follow up on WhatsApp. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("invalid_body");
  const packageId = Number(body.packageId) as PackageId;
  const pricing = await getPricing();
  const pkg = getPackage(pricing, packageId);
  if (!pkg || !pkg.active || isSelfServe(packageId)) return bad("invalid_package");

  const clientName = cleanText(body.clientName, 60);
  if (!clientName) return bad("client_name_required");
  const clientPhone = normalizePhone(body.clientPhone);
  if (!clientPhone) return bad("client_phone_invalid");
  const category = body.category;
  if (typeof category !== "string" || !(category in CATEGORY_LABELS)) return bad("invalid_category");
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : undefined;

  await createCustomRequest({
    clientName,
    clientPhone,
    packageId,
    total: pkg.price,
    brief: { category: category as Category, date, notes },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
