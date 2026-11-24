import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";
import {
  cancelOrder,
  createEventForOrder,
  getOrder,
  listPaymentMethods,
  listTemplates,
  restoreOrder,
  updateEventDetails,
  updateOrder,
} from "@/lib/store";
import { parseEventDetails } from "@/lib/event-context";
import { cleanText } from "@/lib/api";
import { cairoLocalToIso } from "@/lib/time";
import type { CustomStage } from "@/lib/types";

const STAGES: CustomStage[] = ["new", "contacted", "in_design", "delivered"];

/**
 * Admin actions on an order. Body: { id, action, ... }
 *   confirm_instapay           the transfer arrived → paid, invitation goes live
 *   reject_instapay { reason } the transfer didn't arrive → back to unpaid with the reason shown to the client
 *   mark_paid { methodId, note? } confirmed by hand: which of our payment methods it came through (required)
 *   stage { stage }            progress of a package 3-4 request
 *   cancel { reason, refunded } cancel / refund: every link of the invitation closes
 *   restore                    undo a cancellation
 *   create_event               packages 3-4: make the client's invitation page (they fill in the rest)
 *   set_total { total }        packages 3-4: the agreed price (package 4 is "starting from")
 *   edit_event { ...details, generalText } our team edits the invitation (the client can't after paying)
 */
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
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

    case "mark_paid": {
      if (order.payment === "paid") return bad("already_paid", 409);
      const method = (await listPaymentMethods()).find((m) => m.id === body?.methodId);
      if (!method) return bad("method_required");
      const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : "";
      return NextResponse.json({
        order: await updateOrder(order.id, {
          payment: "paid",
          paymentMethod: method.id,
          paymentMethodName: method.name,
          paymentNote: note || undefined,
        }),
      });
    }

    case "edit_event": {
      if (!order.eventId) return bad("no_event", 409);
      const details = parseEventDetails(body ?? {});
      if (!details.ok) return bad(details.error);
      const generalText = cleanText(body?.generalText, 200);
      if (!generalText) return bad("text_invalid");
      const event = await updateEventDetails(order.eventId, { ...details.value, generalText });
      return NextResponse.json({ event });
    }

    case "stage": {
      const stage = body?.stage as CustomStage;
      if (order.packageId < 3 || !STAGES.includes(stage)) return bad("invalid_stage");
      return NextResponse.json({ order: await updateOrder(order.id, { stage }) });
    }

    case "cancel":
      if (order.cancelledAt) return bad("already_cancelled", 409);
      if (!reason) return bad("reason_required");
      return NextResponse.json({ order: await cancelOrder(order.id, reason, body?.refunded === true) });

    case "restore":
      if (!order.cancelledAt) return bad("not_cancelled", 409);
      return NextResponse.json({ order: await restoreOrder(order.id) });

    case "create_event": {
      if (order.kind !== "custom" || order.eventId) return bad("invalid_action", 409);
      const category = order.brief?.category ?? "wedding";
      const templates = await listTemplates();
      const template = templates.find((t) => t.createdAt && t.category === category) ?? templates[templates.length - 1];
      const fallback = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const date = cairoLocalToIso(`${order.brief?.date ?? fallback}T19:00`)!;
      const event = await createEventForOrder(order.id, {
        templateId: template.id,
        category,
        lang: "ar",
        partnerA: "العريس",
        partnerB: "العروسة",
        date,
        venueName: "يتحدد",
        generalText: "يشرفنا حضوركم",
        personalText: "تشرفنا بحضورك يا {title} {name}",
      });
      if (!event) return bad("invalid_action", 409);
      return NextResponse.json({ manageToken: event.manageToken });
    }

    case "set_total": {
      const total = Number(body?.total);
      if (order.kind !== "custom" || order.payment === "paid") return bad("invalid_action", 409);
      if (!Number.isInteger(total) || total < 0 || total > 1_000_000) return bad("invalid_total");
      return NextResponse.json({ order: await updateOrder(order.id, { total }) });
    }

    default:
      return bad("invalid_action");
  }
}
