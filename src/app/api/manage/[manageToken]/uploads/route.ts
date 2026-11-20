import { NextResponse } from "next/server";
import { bad, manageContext, readJson } from "@/lib/api";
import { MAX_REFERENCES, UPLOAD_RULES, createUploadUrl, objectKeyFor } from "@/lib/storage";

type Ctx = { params: Promise<{ manageToken: string }> };

/** Upload slot for the client: the transfer screenshot, or (package 3+) photos / videos / references. */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const { order } = found;
  const body = await readJson(req);
  const kind = body?.kind;
  if (kind !== "proof" && kind !== "reference") return bad("invalid_kind");
  if (kind === "proof" && order.payment === "paid") return bad("already_paid", 409);
  if (kind === "reference" && order.packageId < 3) return bad("not_included", 403);
  if (kind === "reference" && (order.references?.length ?? 0) >= MAX_REFERENCES) return bad("too_many_files", 409);

  const rules = UPLOAD_RULES[kind];
  const contentType = String(body?.contentType ?? "");
  if (!(contentType in rules.types)) return bad(`${kind}_wrong_type`);
  const size = Number(body?.size);
  if (!Number.isFinite(size) || size <= 0) return bad("invalid_size");
  if (size > rules.maxBytes) return bad(`${kind}_too_large`);

  const owner = kind === "proof" ? `payments/${order.id}` : `orders/${order.id}`;
  const objectKey = objectKeyFor(owner, kind, contentType);
  return NextResponse.json({ objectKey, uploadUrl: await createUploadUrl(objectKey, contentType) });
}
