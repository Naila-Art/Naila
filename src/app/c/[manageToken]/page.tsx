import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ClosedInvitation from "@/components/ClosedInvitation";
import ManageEvent from "@/components/manage/ManageEvent";
import { eventContext } from "@/lib/event-context";
import { getEventByManageToken, getEventDashboard } from "@/lib/store";

type Props = { params: Promise<{ manageToken: string }> };

export const metadata: Metadata = {
  title: "صفحتك",
  robots: { index: false, follow: false },
  // The link itself is the key: don't leak it to other sites via Referer.
  referrer: "no-referrer",
};

/**
 * The client's own page (packages 2+, after payment): who opened the invitation, attendance, wishes, and for
 * packages 3-4 the guests with their names and personal messages. No editing of the invitation itself:
 * files and wishes for our team are sent while building, before payment.
 * Before payment, and for package 1, the private link leads to the order page instead.
 */
export default async function Page({ params }: Props) {
  const { manageToken } = await params;
  const event = await getEventByManageToken(manageToken);
  if (!event) notFound();
  if (event.status === "cancelled") return <ClosedInvitation lang="ar" />;

  const ctx = await eventContext(event);
  if (ctx.order && (ctx.order.payment !== "paid" || ctx.order.packageId < 2)) redirect(`/order/${manageToken}`);

  const dashboard = await getEventDashboard(event.id);
  const couple = `${event.partnerA} و ${event.partnerB}`;

  return (
    <ManageEvent
      manageToken={manageToken}
      slug={event.slug}
      couple={couple}
      initial={dashboard}
      namesLimit={ctx.features.namesLimit}
      showWishes={ctx.features.wishes}
      showRsvp={ctx.showRsvp}
      locked={false}
      orderUrl={ctx.order ? `/order/${manageToken}` : undefined}
    />
  );
}
