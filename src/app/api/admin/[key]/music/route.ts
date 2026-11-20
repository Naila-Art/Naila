import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { bad, cleanText, readJson } from "@/lib/api";
import { UPLOAD_RULES, createUploadUrl, deleteObject, keyFromPublicUrl, kindOfKey, objectKeyFor, publicUrl, verifyUpload } from "@/lib/storage";
import { addMusic, deleteMusic, getMusic, listMusic, newId } from "@/lib/store";

type Ctx = { params: Promise<{ key: string }> };

async function guard(ctx: Ctx) {
  return isAdmin((await ctx.params).key) ? null : bad("not_found", 404);
}

export async function GET(_req: Request, ctx: Ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  return NextResponse.json({ tracks: await listMusic() });
}

/**
 * Two steps, like templates:
 *   { step: "slot", contentType, size }  → { objectKey, uploadUrl }  (browser PUTs the file to R2)
 *   { step: "save", name, objectKey }    → { track }                 (after checking the file)
 */
export async function POST(req: Request, ctx: Ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  if (body.step === "slot") {
    const contentType = String(body.contentType ?? "");
    if (!(contentType in UPLOAD_RULES.music.types)) return bad("music_wrong_type");
    const size = Number(body.size);
    if (!Number.isFinite(size) || size <= 0) return bad("invalid_size");
    if (size > UPLOAD_RULES.music.maxBytes) return bad("music_too_large");
    const objectKey = objectKeyFor(`music/${newId("trk")}`, "music", contentType);
    return NextResponse.json({ objectKey, uploadUrl: await createUploadUrl(objectKey, contentType) });
  }

  const name = cleanText(body.name, 60);
  if (!name) return bad("name_required");
  const objectKey = String(body.objectKey ?? "");
  if (kindOfKey(objectKey) !== "music" || !objectKey.startsWith("music/")) return bad("invalid_key");
  const check = await verifyUpload(objectKey, "music");
  if (check !== "ok") {
    await deleteObject(objectKey);
    return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "music_too_large" : "music_wrong_type");
  }
  const id = objectKey.match(/trk_[0-9a-f]{10}/)![0];
  const track = await addMusic({ id, name, url: publicUrl(objectKey), createdAt: new Date().toISOString() });
  return NextResponse.json({ track }, { status: 201 });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const track = await getMusic(id);
  if (!track || !(await deleteMusic(id))) return bad("not_found", 404);
  const key = keyFromPublicUrl(track.url);
  if (key) await deleteObject(key);
  return NextResponse.json({ deleted: true });
}
