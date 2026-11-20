import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { bad, readJson } from "@/lib/api";
import { cancelOrder, getOrder, restoreOrder, updateOrder } from "@/lib/store";
import type { CustomStage } from "@/lib/types";

type Ctx = { params: Promise<{ key: string }> };

const STAGES: CustomStage[] = ["new", "contacted", "in_design", "delivered"];

/**
 * Admin actions on an order. Body: { id, action, ... }
 *   confirm_instapay           the transfer arrived → paid, invitation goes live
 *   reject_instapay { reason } the transfer didn't arrive → back to unpaid with the reason shown to the client
 *   mark_paid                  paid some other way (cash, custom packages)
 *   stage { stage }            progress of a package 3-4 request
 *   cancel { reason, refunded } cancel / refund: every link of the invitation closes
 *   restore                    undo a cancellation
 */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!isAdmin((await ctx.params).key)) return bad("not_found", 404);
  const body = await readJson(req);
  const order = typeof body?.id === "string" ? await getOrder(body.id) : null;
  if (!order) return bad("not_found", 404);
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : "";

  switch (body?.action) {
    case "confirm_instapay":
      if (order.payment !== "pending_review") return bad("not_pending", 409);
      return NextResponse.json({ order: await updateOrder(order.id, { payment: "paid", rejectReason: undefined }) });

    case "reject_instapay":
      if (order.payment !== "pending_review") return bad("not_pending", 409);
      if (!reason) return bad("reason_required");
      return NextResponse.json({ order: await updateOrder(order.id, { payment: "unpaid", rejectReason: reason }) });

    case "mark_paid":
      if (order.payment === "paid") return bad("already_paid", 409);
      return NextResponse.json({ order: await updateOrder(order.id, { payment: "paid", paymentMethod: order.paymentMethod ?? "manual" }) });

    case "stage": {
      const stage = body?.stage as CustomStage;
      if (order.kind !== "custom" || !STAGES.includes(stage)) return bad("invalid_stage");
      return NextResponse.json({ order: await updateOrder(order.id, { stage }) });
    }

    case "cancel":
      if (order.cancelledAt) return bad("already_cancelled", 409);
      if (!reason) return bad("reason_required");
      return NextResponse.json({ order: await cancelOrder(order.id, reason, body?.refunded === true) });

    case "restore":
      if (!order.cancelledAt) return bad("not_cancelled", 409);
      return NextResponse.json({ order: await restoreOrder(order.id) });

    default:
      return bad("invalid_action");
  }
}
