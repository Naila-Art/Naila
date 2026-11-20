import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ClosedInvitation from "@/components/ClosedInvitation";
import ManageEvent from "@/components/manage/ManageEvent";
import { ChangeRequests, ReferencesPanel } from "@/components/manage/OrderPanels";
import { eventContext } from "@/lib/event-context";
import { getSiteSettings, whatsappLink } from "@/lib/site";
import { getEventByManageToken, getEventDashboard, listChangeRequests } from "@/lib/store";

type Props = { params: Promise<{ manageToken: string }> };

export const metadata: Metadata = {
  title: "صفحتك",
  robots: { index: false, follow: false },
  // The link itself is the key: don't leak it to other sites via Referer.
  referrer: "no-referrer",
};

/**
 * The client's own page (packages 2+, after payment): who opened the invitation, wishes, and for
 * packages 3-4 the guests with their names and personal messages. No editing of the invitation itself.
 * Before payment, and for package 1, the private link leads to the order page instead.
 */
export default async function Page({ params }: Props) {
  const { manageToken } = await params;
  const event = await getEventByManageToken(manageToken);
  if (!event) notFound();
  if (event.status === "cancelled") return <ClosedInvitation lang="ar" />;

  const ctx = await eventContext(event);
  if (ctx.order && (ctx.order.payment !== "paid" || ctx.order.packageId < 2)) redirect(`/order/${manageToken}`);

  const [dashboard, site, changeRequests] = await Promise.all([
    getEventDashboard(event.id),
    getSiteSettings(),
    listChangeRequests(event.id),
  ]);
  const couple = `${event.partnerA} و ${event.partnerB}`;
  const api = `/api/manage/${encodeURIComponent(manageToken)}`;

  return (
    <ManageEvent
      manageToken={manageToken}
      slug={event.slug}
      couple={couple}
      initialTexts={{ generalText: event.generalText, personalText: event.personalText }}
      initial={dashboard}
      namesLimit={ctx.features.namesLimit}
      showWishes={ctx.features.wishes}
      locked={false}
      orderUrl={ctx.order ? `/order/${manageToken}` : undefined}
    >
      {ctx.order && ctx.order.packageId >= 3 && <ReferencesPanel api={api} order={ctx.order} />}
      {ctx.order && (
        <ChangeRequests api={api} initial={changeRequests} whatsappUrl={whatsappLink(site.whatsapp, `أهلاً، بخصوص دعوة ${couple}`)} />
      )}
    </ManageEvent>
  );
}
