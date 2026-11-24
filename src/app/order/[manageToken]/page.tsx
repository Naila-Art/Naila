import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ClosedInvitation from "@/components/ClosedInvitation";
import OrderCheckout from "@/components/manage/OrderPanels";
import { BookUser, MessageCircle } from "lucide-react";
import { StudioShell } from "@/components/manage/Studio";
import s from "@/components/manage/studio.module.css";
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
import { formatEventDateAr, isoToCairoLocal } from "@/lib/time";
import { templateDisplayName } from "@/lib/templates";

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

  const template = templates.find((t) => t.id === event.templateId);
  const whatsappUrl = whatsappLink(site.whatsapp, `أهلاً، بخصوص دعوة ${couple}`);
  const paidPage = ctx.order.payment === "paid" && ctx.order.packageId >= 2;
  const dock = (
    <>
      {paidPage && (
        <a className={`${s.dockLink} ${s.dockLinkSolid}`} href={`/c/${manageToken}`}>
          <BookUser size={15} aria-hidden="true" /> صفحتك
        </a>
      )}
      {whatsappUrl && (
        <a className={s.dockLink} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={15} aria-hidden="true" /> محتاج مساعدة؟
        </a>
      )}
    </>
  );

  return (
    <StudioShell photo={template?.posterUrl} brand={site.brand} dock={paidPage || whatsappUrl ? dock : undefined}>
      <main>
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
          templates={templates.map((t) => ({ id: t.id, name: templateDisplayName(t, "ar") }))}
          dateLabel={formatEventDateAr(event.date)}
          design={{
            name: template ? templateDisplayName(template, "ar") : "",
            posterUrl: template?.posterUrl,
            videoUrl: template?.videoUrl,
            background: template?.theme.background,
          }}
          music={music}
          changeRequests={changeRequests}
          methods={methods
            .filter((m) => m.active && (m.kind === "card" ? paymobEnabled() : Boolean(m.account)))
            .map(({ id, name, kind, account, instructions }) => ({ id, name, kind, account, instructions }))}
          whatsappUrl={whatsappUrl}
          isNew={query.new === "1"}
          returnedFromPayment={query.paid === "1"}
        />
      </main>
    </StudioShell>
  );
}
