import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClosedInvitation from "@/components/ClosedInvitation";
import ManageEvent from "@/components/manage/ManageEvent";
import OrderPanels from "@/components/manage/OrderPanels";
import { eventContext } from "@/lib/event-context";
import { paymobEnabled } from "@/lib/paymob";
import { siteSettings, whatsappLink } from "@/lib/site";
import {
  getEventByManageToken,
  getEventDashboard,
  getPricing,
  listChangeRequests,
  listMusic,
  listTemplates,
} from "@/lib/store";
import { isoToCairoLocal } from "@/lib/time";

type Props = {
  params: Promise<{ manageToken: string }>;
  searchParams: Promise<{ new?: string; paid?: string }>;
};

export const metadata: Metadata = {
  title: "إدارة الدعوة",
  robots: { index: false, follow: false },
  // The link itself is the key: don't leak it to other sites via Referer.
  referrer: "no-referrer",
};

/** The client's page, opened by a private link with no password. */
export default async function Page({ params, searchParams }: Props) {
  const { manageToken } = await params;
  const query = await searchParams;
  const event = await getEventByManageToken(manageToken);
  if (!event) notFound();
  if (event.status === "cancelled") return <ClosedInvitation lang="ar" />;

  const [dashboard, ctx] = await Promise.all([getEventDashboard(event.id), eventContext(event)]);
  const couple = `${event.partnerA} و ${event.partnerB}`;
  const site = siteSettings();

  let panels = null;
  if (ctx.order) {
    const [templates, music, changeRequests, pricing] = await Promise.all([
      listTemplates(),
      listMusic(),
      listChangeRequests(event.id),
      getPricing(),
    ]);
    panels = (
      <OrderPanels
        pricing={pricing}
        manageToken={manageToken}
        slug={event.slug}
        order={ctx.order}
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
          musicUrl: event.musicUrl ?? "",
        }}
        features={{ music: ctx.features.music, maps: ctx.features.maps }}
        templates={templates.map(({ id, name }) => ({ id, name }))}
        music={music}
        changeRequests={changeRequests}
        paymobEnabled={paymobEnabled()}
        instapay={site.instapay}
        whatsappUrl={whatsappLink(site.whatsapp, `أهلاً، بخصوص دعوة ${couple}`)}
        isNew={query.new === "1"}
        returnedFromPayment={query.paid === "1"}
      />
    );
  }

  return (
    <ManageEvent
      manageToken={manageToken}
      slug={event.slug}
      couple={couple}
      initialTexts={{ generalText: event.generalText, personalText: event.personalText }}
      initial={dashboard}
      namesLimit={ctx.features.namesLimit}
      showWishes={ctx.features.wishes}
    >
      {panels}
    </ManageEvent>
  );
}
