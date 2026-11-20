import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { parseEventDetails } from "@/lib/event-context";
import { normalizePhone } from "@/lib/guests";
import { getPackage, isSelfServe, priceOf } from "@/lib/pricing";
import { createDraft, findTemplate, getMusic, getPricing } from "@/lib/store";
import type { PackageId } from "@/lib/types";

const DEFAULT_TEXT = {
  ar: { general: "يشرفنا حضوركم حفل زفافنا", personal: "تشرفنا بحضورك يا {title} {name}" },
  en: {
    general: "Together with their families, invite you to celebrate their wedding",
    personal: "We would be honoured by your presence, {title} {name}",
  },
};

/**
 * Storefront: the client builds the invitation (packages 1-2) and gets a draft they can preview
 * before paying. Returns the private link to their page.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const packageId = Number(body.packageId) as PackageId;
  const pricing = await getPricing();
  const pkg = getPackage(pricing, packageId);
  if (!pkg || !pkg.active || !isSelfServe(packageId)) return bad("invalid_package");

  const template = typeof body.templateId === "string" ? await findTemplate(body.templateId) : null;
  if (!template) return bad("invalid_template");

  const details = parseEventDetails(body);
  if (!details.ok) return bad(details.error);

  const clientName = cleanText(body.clientName, 60);
  if (!clientName) return bad("client_name_required");
  const clientPhone = normalizePhone(body.clientPhone);
  if (!clientPhone) return bad("client_phone_invalid");


  let musicTrackId: string | undefined;
  if (packageId >= 2 && typeof body.musicTrackId === "string" && body.musicTrackId) {
    if (!(await getMusic(body.musicTrackId))) return bad("invalid_music");
    musicTrackId = body.musicTrackId;
  }

  const lang = details.value.lang;
  const { event } = await createDraft(
    {
      ...details.value,
      templateId: template.id,
      category: template.category,
      musicTrackId,
      generalText: DEFAULT_TEXT[lang].general,
      personalText: DEFAULT_TEXT[lang].personal,
    },
    { clientName, clientPhone, packageId, total: priceOf(pricing, packageId) },
  );
  return NextResponse.json({ manageToken: event.manageToken }, { status: 201 });
}
