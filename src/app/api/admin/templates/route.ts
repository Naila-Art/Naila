import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, cleanText, readJson } from "@/lib/api";
import { TEMPLATE_ID, deleteTemplateFiles, isTemplateObjectKey, publicUrl, verifyUpload } from "@/lib/storage";
import { addTemplate, deleteTemplate, findTemplate, listTemplates, templateUsage } from "@/lib/store";
import { CATEGORY_LABELS, type Category, type Template } from "@/lib/types";

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
