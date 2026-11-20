import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { bad, readJson } from "@/lib/api";
import { TEMPLATE_ID, UPLOAD_RULES, createUploadUrl, objectKeyFor, type UploadKind } from "@/lib/storage";

type Ctx = { params: Promise<{ key: string }> };

/**
 * Step 1 of an upload: returns a short-lived URL the browser PUTs the file to (R2 directly).
 * Body: { kind: "video" | "poster", contentType, size, templateId? }.
 * The first call (the video) creates the template id; the poster reuses it.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!isAdmin(key)) return bad("not_found", 404);
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const kind = body.kind as UploadKind;
  if (kind !== "video" && kind !== "poster") return bad("invalid_kind");
  const rules = UPLOAD_RULES[kind];
  const contentType = String(body.contentType ?? "");
  if (!(contentType in rules.types)) return bad(kind === "video" ? "video_not_mp4" : "poster_not_image");
  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) return bad("invalid_size");
  if (size > rules.maxBytes) return bad(kind === "video" ? "video_too_large" : "poster_too_large");

  let templateId = body.templateId;
  if (templateId === undefined) templateId = `tpl_${randomBytes(5).toString("hex")}`;
  if (typeof templateId !== "string" || !TEMPLATE_ID.test(templateId)) return bad("invalid_template");

  const objectKey = objectKeyFor(`templates/${templateId}`, kind, contentType);
  const uploadUrl = await createUploadUrl(objectKey, contentType);
  return NextResponse.json({ templateId, objectKey, uploadUrl });
}
