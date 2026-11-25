import { headers } from "next/headers";
import AdminOrders, { type OrderRow } from "@/components/admin/AdminOrders";
import { getPricing, listChangeRequests, listEvents, listOrders, listPaymentMethods } from "@/lib/store";
import { isoToCairoLocal } from "@/lib/time";

type Props = { searchParams: Promise<{ f?: string }> };

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: Props) {
  const { f } = await searchParams;
  const [orders, events, changes, pricing, methods] = await Promise.all([
    listOrders(),
    listEvents(),
    listChangeRequests(),
    getPricing(),
    listPaymentMethods(),
  ]);
  const eventById = new Map(events.map((e) => [e.id, e]));
  const h = await headers();
  const origin = (process.env.SITE_URL?.trim() || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`).replace(/\/+$/, "");

  const rows: OrderRow[] = orders.map((o) => {
    const e = o.eventId ? eventById.get(o.eventId) : undefined;
    return {
      order: o,
      event: e && {
        couple: `${e.partnerA} و ${e.partnerB}`,
        date: e.date,
        slug: e.slug,
        manageToken: e.manageToken,
        details: {
          partnerA: e.partnerA,
          partnerB: e.partnerB,
          date: isoToCairoLocal(e.date),
          venueName: e.venueName,
          venueAddress: e.venueAddress ?? "",
          mapsUrl: e.mapsUrl ?? "",
          lang: e.lang,
          generalText: e.generalText,
        },
      },
      changes: e ? changes.filter((c) => c.eventId === e.id) : [],
    };
  });

  return (
    <AdminOrders
      rows={rows}
      initialFilter={f}
      pricing={pricing}
      origin={origin}
      methods={methods.map(({ id, name, active }) => ({ id, name, active }))}
    />
  );
}
