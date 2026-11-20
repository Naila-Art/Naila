import { NextResponse } from "next/server";
import { bad, manageContext, readJson, siteUrl } from "@/lib/api";
import { createCheckout, paymobEnabled } from "@/lib/paymob";
import { deleteObject, keyFromPublicUrl, kindOfKey, publicUrl, verifyUpload } from "@/lib/storage";
import { updateOrder } from "@/lib/store";

type Ctx = { params: Promise<{ manageToken: string }> };

/**
 * { method: "paymob" }               → { redirectUrl } to Paymob's checkout
 * { method: "instapay", objectKey }  → saves the transfer screenshot; we confirm it from the admin dashboard
 */
export async function POST(req: Request, ctx: Ctx) {
  const found = await manageContext((await ctx.params).manageToken);
  if (!found?.order) return bad("not_found", 404);
  const { event, order } = found;
  if (order.payment === "paid") return bad("already_paid", 409);
  const body = await readJson(req);

  if (body?.method === "paymob") {
    if (!paymobEnabled()) return bad("paymob_unavailable", 503);
    try {
      return NextResponse.json({ redirectUrl: await createCheckout(order, event, siteUrl(req)) });
    } catch (err) {
      console.error(err);
      return bad("paymob_failed", 502);
    }
  }

  if (body?.method === "instapay") {
    const objectKey = String(body.objectKey ?? "");
    if (kindOfKey(objectKey) !== "proof" || !objectKey.startsWith(`payments/${order.id}/`)) return bad("invalid_key");
    const check = await verifyUpload(objectKey, "proof");
    if (check !== "ok") {
      await deleteObject(objectKey);
      return bad(check === "missing" ? "upload_missing" : check === "too_large" ? "proof_too_large" : "proof_wrong_type");
    }
    const oldKey = order.proofUrl ? keyFromPublicUrl(order.proofUrl) : null;
    const updated = await updateOrder(order.id, {
      payment: "pending_review",
      paymentMethod: "instapay",
      proofUrl: publicUrl(objectKey),
      rejectReason: undefined,
    });
    if (oldKey && oldKey !== objectKey) await deleteObject(oldKey);
    return NextResponse.json({ order: updated });
  }

  return bad("invalid_method");
}
