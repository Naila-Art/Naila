import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, cleanText, readJson } from "@/lib/api";
import { TEMPLATE_ID, deleteObject, deleteTemplateFiles, isTemplateObjectKey, keyFromPublicUrl, kindOfKey, publicUrl, verifyUpload } from "@/lib/storage";
import { addTemplate, deleteTemplate, findTemplate, listTemplates, setTemplateArt, templateUsage, updateTemplateDetails } from "@/lib/store";
import { ART_SLOTS, BADGE_LABELS, CATEGORY_LABELS, type ArtSlot, type Category, type Template, type TemplateBadge } from "@/lib/types";

const HEX = /^#[0-9a-fA-F]{6}$/;
const THEME_KEYS = ["background", "surface", "text", "accent", "seal"] as const;

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ templates: await listTemplates(), usage: await templateUsage() });
}

/**
 * Step 2 of an upload, after the browser has PUT the files to storage.
 * Body: { templateId, name, category, theme: {5 colours}, videoKey, posterKey? }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const id = body.templateId;
  if (typeof id !== "string" || !TEMPLATE_ID.test(id)) return bad("invalid_template");
  if (await findTemplate(id)) return bad("already_exists", 409);

  const name = cleanText(body.name, 60);
  if (!name) return bad("name_required");
  const category = body.category;
  if (typeof category !== "string" || !(category in CATEGORY_LABELS)) return bad("invalid_category");

  const rawTheme = (body.theme ?? {}) as Record<string, unknown>;
  const theme = {} as Template["theme"];
  for (const k of THEME_KEYS) {
    const v = rawTheme[k];
    if (typeof v !== "string" || !HEX.test(v)) return bad("invalid_colour");
    theme[k] = v.toLowerCase();
  }

  // The keys must belong to this template id — a client can't point at someone else's file.
  const videoKey = body.videoKey;
  if (typeof videoKey !== "string" || videoKey !== `templates/${id}/opening.mp4`) return bad("video_required");
  const posterKey = body.posterKey;
  if (posterKey !== undefined && (typeof posterKey !== "string" || !isTemplateObjectKey(posterKey) || !posterKey.startsWith(`templates/${id}/poster.`))) {
    return bad("poster_not_image");
  }

  const videoCheck = await verifyUpload(videoKey, "video");
  if (videoCheck !== "ok") {
    await deleteTemplateFiles(id);
    return bad(videoCheck === "missing" ? "upload_missing" : videoCheck === "too_large" ? "video_too_large" : "video_not_mp4");
  }
  if (posterKey) {
    const posterCheck = await verifyUpload(posterKey, "poster");
    if (posterCheck !== "ok") {
      await deleteTemplateFiles(id);
      return bad(posterCheck === "missing" ? "upload_missing" : posterCheck === "too_large" ? "poster_too_large" : "poster_not_image");
    }
  }

  const template = await addTemplate({
    id,
    name,
    category: category as Category,
    videoUrl: publicUrl(videoKey),
    posterUrl: posterKey ? publicUrl(posterKey) : undefined,
    theme,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ template }, { status: 201 });
}

/** Name, category and the 5 colours, checked the same way as on upload. */
function parseDetails(body: Record<string, unknown>): Pick<Template, "name" | "category" | "theme" | "badge"> | string {
  const name = cleanText(body.name, 60);
  if (!name) return "name_required";
  const category = body.category;
  if (typeof category !== "string" || !(category in CATEGORY_LABELS)) return "invalid_category";
  const rawTheme = (body.theme ?? {}) as Record<string, unknown>;
  const theme = {} as Template["theme"];
  for (const k of THEME_KEYS) {
    const v = rawTheme[k];
    if (typeof v !== "string" || !HEX.test(v)) return "invalid_colour";
    theme[k] = v.toLowerCase();
  }
  // Empty / missing = no badge.
  const badge = body.badge || undefined;
  if (badge !== undefined && (typeof badge !== "string" || !(badge in BADGE_LABELS))) return "invalid_badge";
  return { name, category: category as Category, theme, badge: badge as TemplateBadge | undefined };
}

/**
 * Edits an uploaded template.
 *   { id, name, category, theme, badge? }                  rename / change type / recolour / set or clear the badge
 *   { id, slot: "top" | "corner" | "bottom", objectKey }   set one artwork image after the browser PUT it; objectKey null removes it
 */
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");
  const id = body.id;
  if (typeof id !== "string" || !TEMPLATE_ID.test(id)) return bad("not_found", 404);

  if (body.slot === undefined) {
    const details = parseDetails(body);
    if (typeof details === "string") return bad(details);
    const template = await updateTemplateDetails(id, details);
    if (!template) return bad("not_found", 404);
    return NextResponse.json({ template });
  }

  const slot = body.slot as ArtSlot;
  if (!ART_SLOTS.includes(slot)) return bad("invalid_slot");

  let url: string | undefined;
  if (body.objectKey !== null) {
    const key = body.objectKey;
    // Must be this template's own artwork file for this slot.
    if (typeof key !== "string" || kindOfKey(key) !== "art" || !key.startsWith(`templates/${id}/art-${slot}-`)) return bad("art_not_image");
    const check = await verifyUpload(key, "art");
    if (check !== "ok") {
      await deleteObject(key);
      return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "art_too_large" : "art_not_image");
    }
    url = publicUrl(key);
  }

  const result = await setTemplateArt(id, slot, url);
  if (!result.found) return bad("not_found", 404);
  const oldKey = result.oldUrl ? keyFromPublicUrl(result.oldUrl) : null;
  if (oldKey && oldKey !== (url ? keyFromPublicUrl(url) : null)) await deleteObject(oldKey);
  return NextResponse.json({ template: await findTemplate(id) });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!TEMPLATE_ID.test(id)) return bad("not_found", 404);
  const result = await deleteTemplate(id);
  if (!result.deleted) return bad("not_found", 404);
  await deleteTemplateFiles(id);
  return NextResponse.json(result);
}
