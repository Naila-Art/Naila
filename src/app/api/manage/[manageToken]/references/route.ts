import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { deleteObject, keyFromPublicUrl, kindOfKey, publicUrl, verifyUpload } from "@/lib/storage";
import { addOrderReference, removeOrderReference, updateOrderBrief } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

/**
 * Package 3+: the client's brief and files for our team.
 *   POST   { objectKey, name }  after uploading a photo / video (checked before it's kept)
 *   PUT    { notes }            the written brief
 *   DELETE ?url=                remove a file
 */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order || found.order.packageId < 3) return bad("not_found", 404);
  const { order } = found;
  const body = await readJson(req);
  const objectKey = String(body?.objectKey ?? "");
  if (kindOfKey(objectKey) !== "reference" || !objectKey.startsWith(`orders/${order.id}/`)) return bad("invalid_key");
  const check = await verifyUpload(objectKey, "reference");
  if (check !== "ok") {
    await deleteObject(objectKey);
    return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "reference_too_large" : "reference_wrong_type");
  }
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) || "ملف" : "ملف";
  const type = /\.(mp4|mov)$/.test(objectKey) ? "video" : "image";
  const ref = { url: publicUrl(objectKey), name, type, addedAt: new Date().toISOString() } as const;
  await addOrderReference(order.id, ref);
  return NextResponse.json({ reference: ref }, { status: 201 });
}

export async function PUT(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order || found.order.packageId < 3) return bad("not_found", 404);
  const body = await readJson(req);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  if (notes.length > 2000) return bad("too_long");
  await updateOrderBrief(found.order.id, notes);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!(await removeOrderReference(found.order.id, url))) return bad("not_found", 404);
  const key = keyFromPublicUrl(url);
  if (key) await deleteObject(key);
  return NextResponse.json({ ok: true });
}
