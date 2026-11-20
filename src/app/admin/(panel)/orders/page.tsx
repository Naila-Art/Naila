import AdminOrders, { type OrderRow } from "@/components/admin/AdminOrders";
import { getPricing, listChangeRequests, listEvents, listOrders } from "@/lib/store";

type Props = { searchParams: Promise<{ f?: string }> };

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: Props) {
  const { f } = await searchParams;
  const [orders, events, changes, pricing] = await Promise.all([listOrders(), listEvents(), listChangeRequests(), getPricing()]);
  const eventById = new Map(events.map((e) => [e.id, e]));

  const rows: OrderRow[] = orders.map((o) => {
    const e = o.eventId ? eventById.get(o.eventId) : undefined;
    return {
      order: o,
      event: e && { couple: `${e.partnerA} و ${e.partnerB}`, date: e.date, slug: e.slug, manageToken: e.manageToken },
      changes: e ? changes.filter((c) => c.eventId === e.id) : [],
    };
  });

  return <AdminOrders rows={rows} initialFilter={f} pricing={pricing} />;
}
