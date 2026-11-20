import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";
import { TEMPLATE_ID, UPLOAD_RULES, artObjectKey, createUploadUrl, objectKeyFor, type UploadKind } from "@/lib/storage";
import { findTemplate } from "@/lib/store";
import { ART_SLOTS, type ArtSlot } from "@/lib/types";

/**
 * Step 1 of an upload: returns a short-lived URL the browser PUTs the file to (R2 directly).
 * Body: { kind: "video" | "poster" | "art", contentType, size, templateId?, slot? }.
 * The first call (the video) creates the template id; the poster reuses it.
 * "art" is for a template that already exists, with slot "top" | "corner" | "bottom".
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const kind = body.kind as UploadKind;
  if (kind !== "video" && kind !== "poster" && kind !== "art") return bad("invalid_kind");
  const rules = UPLOAD_RULES[kind];
  const contentType = String(body.contentType ?? "");
  if (!(contentType in rules.types)) return bad(kind === "video" ? "video_not_mp4" : kind === "art" ? "art_not_image" : "poster_not_image");
  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) return bad("invalid_size");
  if (size > rules.maxBytes) return bad(kind === "video" ? "video_too_large" : kind === "art" ? "art_too_large" : "poster_too_large");

  let templateId = body.templateId;
  if (templateId === undefined) templateId = `tpl_${randomBytes(5).toString("hex")}`;
  if (typeof templateId !== "string" || !TEMPLATE_ID.test(templateId)) return bad("invalid_template");

  let objectKey: string;
  if (kind === "art") {
    const slot = body.slot as ArtSlot;
    if (!ART_SLOTS.includes(slot)) return bad("invalid_slot");
    if (!(await findTemplate(templateId))) return bad("not_found", 404);
    objectKey = artObjectKey(templateId, slot, contentType);
  } else {
    objectKey = objectKeyFor(`templates/${templateId}`, kind, contentType);
  }
  const uploadUrl = await createUploadUrl(objectKey, contentType);
  return NextResponse.json({ templateId, objectKey, uploadUrl });
}
