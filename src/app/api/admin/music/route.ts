import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, cleanText, readJson } from "@/lib/api";
import { MUSIC_MOODS } from "@/lib/music-catalog";
import { UPLOAD_RULES, createUploadUrl, deleteObject, keyFromPublicUrl, kindOfKey, objectKeyFor, publicUrl, verifyUpload } from "@/lib/storage";
import {
  addMusic,
  deleteMusic,
  findTemplate,
  getMusic,
  getTemplateMusicMap,
  getTemplateMusicOverrides,
  listMusic,
  newId,
  saveTemplateMusicAssignments,
} from "@/lib/store";
import type { MusicMood } from "@/lib/types";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const [tracks, assignments, overrides] = await Promise.all([
    listMusic(),
    getTemplateMusicMap(),
    getTemplateMusicOverrides(),
  ]);
  return NextResponse.json({ tracks, assignments, overrides });
}

/**
 * Two steps, like templates:
 *   { step: "slot", contentType, size }                 → { objectKey, uploadUrl }  (browser PUTs the file to R2)
 *   { step: "save", name, nameAr?, mood?, objectKey }   → { track }                 (after checking the file)
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
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
  const nameAr = cleanText(body.nameAr, 60) ?? undefined;
  const mood = typeof body.mood === "string" && MUSIC_MOODS.includes(body.mood as MusicMood) ? (body.mood as MusicMood) : undefined;
  const objectKey = String(body.objectKey ?? "");
  if (kindOfKey(objectKey) !== "music" || !objectKey.startsWith("music/")) return bad("invalid_key");
  const check = await verifyUpload(objectKey, "music");
  if (check !== "ok") {
    await deleteObject(objectKey);
    return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "music_too_large" : "music_wrong_type");
  }
  const id = objectKey.match(/trk_[0-9a-f]{10}/)![0];
  const track = await addMusic({
    id,
    name,
    ...(nameAr ? { nameAr } : {}),
    ...(mood ? { mood } : {}),
    url: publicUrl(objectKey),
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ track }, { status: 201 });
}

/**
 * Assigns tracks to templates (live, without redeploying).
 * Body: { templateId, trackId } or { assignments: Record<string, string> }
 */
export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  if (!body) return bad("invalid_body");

  const rawPatch: Record<string, string> = {};
  if (typeof body.templateId === "string" && typeof body.trackId === "string") {
    rawPatch[body.templateId] = body.trackId;
  } else if (body.assignments && typeof body.assignments === "object" && !Array.isArray(body.assignments)) {
    for (const [tid, tidTrack] of Object.entries(body.assignments as Record<string, unknown>)) {
      if (typeof tid === "string" && typeof tidTrack === "string") rawPatch[tid] = tidTrack;
      else return bad("invalid_assignment");
    }
  } else {
    return bad("invalid_assignment");
  }

  const entries = Object.entries(rawPatch);
  if (entries.length === 0 || entries.length > 200) return bad("invalid_assignment");

  for (const [tid, trackId] of entries) {
    if (!tid || tid.length > 60 || !(await findTemplate(tid))) return bad("invalid_template");
    if (trackId !== "__default__" && trackId !== "none" && trackId !== "") {
      if (!(await getMusic(trackId))) return bad("invalid_music");
    }
  }

  const assignments = await saveTemplateMusicAssignments(rawPatch);
  return NextResponse.json({ assignments, overrides: await getTemplateMusicOverrides() });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const track = await getMusic(id);
  if (!track) return bad("not_found", 404);
  if (track.builtIn) return bad("cannot_delete_builtin", 400);
  if (!(await deleteMusic(id))) return bad("not_found", 404);
  const key = keyFromPublicUrl(track.url);
  if (key) await deleteObject(key);
  return NextResponse.json({ deleted: true });
}
