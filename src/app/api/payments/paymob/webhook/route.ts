import { NextResponse } from "next/server";
import { orderIdFromReference, verifyCallback } from "@/lib/paymob";
import { getOrder, updateOrder } from "@/lib/store";

/**
 * Paymob "transaction processed" callback. The HMAC is checked before anything is trusted,
 * and the amount must match the order. Answers 200 for genuine callbacks so Paymob doesn't retry.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const tx = verifyCallback(body, new URL(req.url).searchParams.get("hmac"));
  if (!tx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!tx.success || tx.pending) return NextResponse.json({ ok: true });

  const order = await getOrder(orderIdFromReference(tx.reference));
  if (!order) {
    console.error("Paymob callback for unknown order", tx.reference);
    return NextResponse.json({ ok: true });
  }
  if (tx.amountCents !== order.total * 100) {
    console.error("Paymob amount mismatch", order.id, tx.amountCents, order.total);
    return NextResponse.json({ ok: true });
  }
  if (order.payment !== "paid") {
    await updateOrder(order.id, { payment: "paid", paymentMethod: "paymob", paymentMethodName: "فيزا (باي موب)", paymobTransactionId: tx.id });
  }
  return NextResponse.json({ ok: true });
}
