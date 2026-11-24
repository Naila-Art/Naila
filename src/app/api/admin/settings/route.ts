import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { saveSiteSettings } from "@/lib/store";

/** Only links to the real sites are accepted. */
const SOCIAL_HOSTS: Record<"facebook" | "instagram" | "tiktok", RegExp> = {
  facebook: /^https:\/\/(www\.|m\.)?(facebook|fb)\.com\//i,
  instagram: /^https:\/\/(www\.)?instagram\.com\//i,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\//i,
};

/** Body: { brand, whatsapp, socials: { facebook, instagram, tiktok } } */
export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  const brand = cleanText(body?.brand, 40);
  if (!brand) return bad("brand_required");

  const digits = String(body?.whatsapp ?? "").replace(/\D/g, "");
  // Accept 01xxxxxxxxx too and store it internationally.
  const whatsapp = /^01\d{9}$/.test(digits) ? `2${digits}` : digits;
  if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) return bad("whatsapp_invalid");

  const raw = (body?.socials ?? {}) as Record<string, unknown>;
  const socials: Record<string, string> = {};
  for (const key of Object.keys(SOCIAL_HOSTS) as (keyof typeof SOCIAL_HOSTS)[]) {
    const v = typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
    if (v && (v.length > 300 || !SOCIAL_HOSTS[key].test(v))) return bad(`${key}_invalid`);
    socials[key] = v;
  }
  return NextResponse.json({ settings: await saveSiteSettings({ brand, whatsapp, socials }) });
}
