import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { bad, cleanText } from "@/lib/api";
import { MAX_POSTER_BYTES, MAX_VIDEO_BYTES, deleteMediaDir, saveMedia, sniff } from "@/lib/media";
import { addTemplate, deleteTemplate, listTemplates, templateUsage } from "@/lib/store";
import { CATEGORY_LABELS, type Category, type Template } from "@/lib/types";

type Ctx = { params: Promise<{ key: string }> };

const HEX = /^#[0-9a-fA-F]{6}$/;
const THEME_KEYS = ["background", "surface", "text", "accent", "seal"] as const;

async function guard(ctx: Ctx) {
  return isAdmin((await ctx.params).key) ? null : bad("not_found", 404);
}

export async function GET(_req: Request, ctx: Ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  return NextResponse.json({ templates: await listTemplates(), usage: await templateUsage() });
}

/** multipart/form-data: name, category, theme colours, video (MP4), poster (image, optional). */
export async function POST(req: Request, ctx: Ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("invalid_form");
  }

  const name = cleanText(form.get("name"), 60);
  if (!name) return bad("name_required");
  const category = form.get("category");
  if (typeof category !== "string" || !(category in CATEGORY_LABELS)) return bad("invalid_category");

  const theme = {} as Template["theme"];
  for (const k of THEME_KEYS) {
    const v = form.get(k);
    if (typeof v !== "string" || !HEX.test(v)) return bad("invalid_colour");
    theme[k] = v.toLowerCase();
  }

  const video = form.get("video");
  if (!(video instanceof File) || video.size === 0) return bad("video_required");
  if (video.size > MAX_VIDEO_BYTES) return bad("video_too_large");
  const videoData = new Uint8Array(await video.arrayBuffer());
  if (sniff(videoData) !== "mp4") return bad("video_not_mp4");

  const poster = form.get("poster");
  let posterData: Uint8Array | null = null;
  let posterExt: string | null = null;
  if (poster instanceof File && poster.size > 0) {
    if (poster.size > MAX_POSTER_BYTES) return bad("poster_too_large");
    posterData = new Uint8Array(await poster.arrayBuffer());
    posterExt = sniff(posterData);
    if (!posterExt || posterExt === "mp4") return bad("poster_not_image");
  }

  const id = `tpl_${randomBytes(5).toString("hex")}`;
  try {
    const videoUrl = await saveMedia(["templates", id, "opening.mp4"], videoData);
    const posterUrl = posterData ? await saveMedia(["templates", id, `poster.${posterExt}`], posterData) : undefined;
    const template = await addTemplate({
      id,
      name,
      category: category as Category,
      videoUrl,
      posterUrl,
      theme,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    await deleteMediaDir(["templates", id]);
    throw err;
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^tpl_[0-9a-f]{10}$/.test(id)) return bad("not_found", 404);
  const result = await deleteTemplate(id);
  if (!result.deleted) return bad("not_found", 404);
  await deleteMediaDir(["templates", id]);
  return NextResponse.json(result);
}
