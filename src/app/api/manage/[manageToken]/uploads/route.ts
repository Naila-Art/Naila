import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { UPLOAD_RULES, createUploadUrl, objectKeyFor } from "@/lib/storage";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Upload slot for the client's Instapay transfer screenshot. */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const { order } = found;
  const body = await readJson(req);
  if (body?.kind !== "proof") return bad("invalid_kind");
  if (order.payment === "paid") return bad("already_paid", 409);

  const rules = UPLOAD_RULES.proof;
  const contentType = String(body?.contentType ?? "");
  if (!(contentType in rules.types)) return bad("proof_wrong_type");
  const size = Number(body?.size);
  if (!Number.isFinite(size) || size <= 0) return bad("invalid_size");
  if (size > rules.maxBytes) return bad("proof_too_large");

  const objectKey = objectKeyFor(`payments/${order.id}`, "proof", contentType);
  return NextResponse.json({ objectKey, uploadUrl: await createUploadUrl(objectKey, contentType) });
}
