import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { parseEventDetails } from "@/lib/event-context";
import { normalizePhone } from "@/lib/guests";
import { getPackage, isSelfServe, priceOf } from "@/lib/pricing";
import { createDraft, findTemplate, getMusic, getPricing } from "@/lib/store";
import { normalizeSlug, slugProblem } from "@/lib/slug";
import { parseBriefLink } from "@/lib/brief";
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

  const briefLink = packageId >= 3 ? parseBriefLink(body.briefLink) : { ok: true as const };
  if (!briefLink.ok) return bad("link_invalid");

  // Optional: the link the client picked (otherwise we make a random one).
  let slug: string | undefined;
  if (typeof body.slug === "string" && body.slug.trim()) {
    slug = normalizeSlug(body.slug);
    const problem = slugProblem(slug);
    if (problem) return bad(problem);
  }

  const customMusicAddon = packageId === 1 && body.customMusicAddon === true;
  const addons = customMusicAddon ? { customMusic: true } : undefined;
  const canPickMusic = packageId >= 2 || customMusicAddon;

  let musicTrackId: string | undefined;
  if (canPickMusic && typeof body.musicTrackId === "string" && body.musicTrackId) {
    if (body.musicTrackId === "none") {
      musicTrackId = "none";
    } else {
      if (!(await getMusic(body.musicTrackId))) return bad("invalid_music");
      musicTrackId = body.musicTrackId;
    }
  }

  const lang = details.value.lang;
  const created = await createDraft(
    {
      ...details.value,
      // Attendance replies come with package 2+.
      rsvp: packageId >= 2 && details.value.rsvp === true ? true : undefined,
      templateId: template.id,
      category: template.category,
      musicTrackId,
      generalText: cleanText(body.generalText, 200) ?? DEFAULT_TEXT[lang].general,
      personalText: DEFAULT_TEXT[lang].personal,
    },
    {
      clientName,
      clientPhone,
      packageId,
      ...(addons ? { addons } : {}),
      total: priceOf(pricing, packageId, addons),
      stage: packageId >= 3 ? "new" : undefined,
      brief:
        packageId >= 3
          ? {
              category: template.category,
              notes: typeof body.brief === "string" ? body.brief.trim().slice(0, 2000) : "",
              link: briefLink.ok ? briefLink.link : undefined,
            }
          : undefined,
    },
    slug,
  );
  if (!created) return bad("slug_taken", 409);
  return NextResponse.json({ manageToken: created.event.manageToken }, { status: 201 });
}
