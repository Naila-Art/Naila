import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { deleteObject, keyFromPublicUrl, kindOfKey, publicUrl, verifyUpload } from "@/lib/storage";
import { addOrderReference, removeOrderReference, updateOrderBrief } from "@/lib/store";
import { parseBriefLink } from "@/lib/brief";

type Ctx = { params: Promise<{ manageToken: string }> };

/**
 * Package 3+: the client's brief and files for our team. Only before payment: once the client has paid
 * (or sent the payment) it's read-only, since our team has started working on it.
 *   POST   { objectKey, name }  after uploading a photo / video / song (checked before it's kept)
 *   PUT    { notes, link? }     the written brief and a link to their files
 *   DELETE ?url=                remove a file
 */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order || found.order.packageId < 3) return bad("not_found", 404);
  const { order } = found;
  if (order.payment !== "unpaid") return bad("locked", 409);
  const body = await readJson(req);
  const objectKey = String(body?.objectKey ?? "");
  if (kindOfKey(objectKey) !== "reference" || !objectKey.startsWith(`orders/${order.id}/`)) return bad("invalid_key");
  const check = await verifyUpload(objectKey, "reference");
  if (check !== "ok") {
    await deleteObject(objectKey);
    return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "reference_too_large" : "reference_wrong_type");
  }
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) || "ملف" : "ملف";
  const type = /\.(mp4|mov)$/.test(objectKey) ? "video" : /\.(mp3|m4a)$/.test(objectKey) ? "audio" : "image";
  const ref = { url: publicUrl(objectKey), name, type, addedAt: new Date().toISOString() } as const;
  await addOrderReference(order.id, ref);
  return NextResponse.json({ reference: ref }, { status: 201 });
}

export async function PUT(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order || found.order.packageId < 3) return bad("not_found", 404);
  if (found.order.payment !== "unpaid") return bad("locked", 409);
  const body = await readJson(req);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  if (notes.length > 2000) return bad("too_long");
  const link = body?.link === undefined ? { ok: true as const, link: found.order.brief?.link } : parseBriefLink(body.link);
  if (!link.ok) return bad("link_invalid");
  await updateOrderBrief(found.order.id, notes, link.link);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  if (found.order.payment !== "unpaid") return bad("locked", 409);
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!(await removeOrderReference(found.order.id, url))) return bad("not_found", 404);
  const key = keyFromPublicUrl(url);
  if (key) await deleteObject(key);
  return NextResponse.json({ ok: true });
}
