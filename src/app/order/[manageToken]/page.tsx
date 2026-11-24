import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ClosedInvitation from "@/components/ClosedInvitation";
import OrderCheckout from "@/components/manage/OrderPanels";
import styles from "@/components/manage/manage.module.css";
import SiteHeader from "@/components/store/SiteHeader";
import { eventContext } from "@/lib/event-context";
import { paymobEnabled } from "@/lib/paymob";
import { getSiteSettings, whatsappLink } from "@/lib/site";
import {
  getEventByManageToken,
  getPricing,
  listChangeRequests,
  listMusic,
  listPaymentMethods,
  listTemplates,
} from "@/lib/store";
import { isoToCairoLocal } from "@/lib/time";

type Props = {
  params: Promise<{ manageToken: string }>;
  searchParams: Promise<{ new?: string; paid?: string }>;
};

export const metadata: Metadata = {
  title: "طلبك",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * The order page: preview, edits before payment, payment, and (once we confirm) the links.
 * Separate from the client's own page (/c/{token}), which only packages 2+ get after payment.
 */
export default async function OrderPage({ params, searchParams }: Props) {
  const { manageToken } = await params;
  const query = await searchParams;
  const event = await getEventByManageToken(manageToken);
  if (!event) notFound();
  if (event.status === "cancelled") return <ClosedInvitation lang="ar" />;
  const ctx = await eventContext(event);
  if (!ctx.order) notFound();

  const [templates, music, changeRequests, pricing, methods, site] = await Promise.all([
    listTemplates(),
    listMusic(),
    listChangeRequests(event.id),
    getPricing(),
    listPaymentMethods(),
    getSiteSettings(),
  ]);
  const h = await headers();
  const origin = (process.env.SITE_URL?.trim() || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`).replace(/\/+$/, "");
  const couple = `${event.partnerA} و ${event.partnerB}`;

  return (
    <div className={styles.orderShell} dir="rtl" lang="ar">
      <SiteHeader brand={site.brand} />
      <main className={`${styles.page} ${styles.orderPage}`}>
        <header className={styles.header}>
          <p className={styles.kicker}>طلبك</p>
          <h1>{couple}</h1>
        </header>
        <OrderCheckout
          pricing={pricing}
          manageToken={manageToken}
          slug={event.slug}
          order={ctx.order}
          origin={origin}
          details={{
            partnerA: event.partnerA,
            partnerB: event.partnerB,
            date: isoToCairoLocal(event.date),
            venueName: event.venueName,
            venueAddress: event.venueAddress ?? "",
            mapsUrl: event.mapsUrl ?? "",
            lang: event.lang,
            templateId: event.templateId,
            musicTrackId: event.musicTrackId ?? "",
            generalText: event.generalText,
            rsvp: event.rsvp === true,
          }}
          features={{ music: ctx.features.music, maps: ctx.features.maps, rsvp: ctx.features.rsvp }}
          templates={templates.map(({ id, name }) => ({ id, name }))}
          music={music}
          changeRequests={changeRequests}
          methods={methods
            .filter((m) => m.active && (m.kind === "card" ? paymobEnabled() : Boolean(m.account)))
            .map(({ id, name, kind, account, instructions }) => ({ id, name, kind, account, instructions }))}
          whatsappUrl={whatsappLink(site.whatsapp, `أهلاً، بخصوص دعوة ${couple}`)}
          isNew={query.new === "1"}
          returnedFromPayment={query.paid === "1"}
        />
      </main>
    </div>
  );
}
