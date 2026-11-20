import "server-only";
import { listChangeRequests, listOrders } from "./store";
import { TIME_ZONE } from "./time";
import type { Order, PackageId } from "./types";

/** "2026-11" in Cairo time. */
function cairoMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);
}

/** Money we kept: paid and not refunded. */
const counts = (o: Order) => o.payment === "paid" && !o.refunded;

export async function adminOverview(now = new Date()) {
  const [orders, changes] = await Promise.all([listOrders(), listChangeRequests()]);
  const thisMonth = cairoMonth(now.toISOString());

  const firstOrderByPhone = new Map<string, string>();
  for (const o of [...orders].reverse()) if (!firstOrderByPhone.has(o.clientPhone)) firstOrderByPhone.set(o.clientPhone, o.createdAt);
  const newClients = [...firstOrderByPhone.values()].filter((d) => cairoMonth(d) === thisMonth).length;

  const paidThisMonth = orders.filter((o) => counts(o) && o.paidAt && cairoMonth(o.paidAt) === thisMonth);
  const byPackage: Record<PackageId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const o of paidThisMonth) byPackage[o.packageId] += o.total;

  // Last 6 months of revenue, oldest first.
  const months: { month: string; revenue: number; orders: number }[] = [];
  const d = new Date(now);
  d.setUTCDate(15);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d);
    m.setUTCMonth(d.getUTCMonth() - i);
    const key = cairoMonth(m.toISOString());
    const paid = orders.filter((o) => counts(o) && o.paidAt && cairoMonth(o.paidAt) === key);
    months.push({ month: key, revenue: paid.reduce((s, o) => s + o.total, 0), orders: paid.length });
  }

  const live = (o: Order) => !o.cancelledAt;
  return {
    clients: firstOrderByPhone.size,
    newClients,
    revenueThisMonth: paidThisMonth.reduce((s, o) => s + o.total, 0),
    paidOrdersThisMonth: paidThisMonth.length,
    revenueAllTime: orders.filter(counts).reduce((s, o) => s + o.total, 0),
    byPackage,
    months,
    pendingInstapay: orders.filter((o) => live(o) && o.payment === "pending_review").length,
    unpaidDrafts: orders.filter((o) => live(o) && o.kind === "self" && o.payment === "unpaid").length,
    newCustomRequests: orders.filter((o) => live(o) && o.kind === "custom" && o.stage === "new").length,
    openChangeRequests: changes.filter((c) => !c.resolvedAt).length,
    refundedThisMonth: orders.filter((o) => o.refunded && o.cancelledAt && cairoMonth(o.cancelledAt) === thisMonth).length,
  };
}
