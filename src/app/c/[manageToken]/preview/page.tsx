import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClosedInvitation from "@/components/ClosedInvitation";
import { InvitationView } from "@/components/InvitationPage";
import { getEventByManageToken, getEventDashboard } from "@/lib/store";

type Props = {
  params: Promise<{ manageToken: string }>;
  searchParams: Promise<{ guest?: string }>;
};

export const metadata: Metadata = {
  title: "معاينة الدعوة",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * The client's own preview, reachable only through their private page link.
 * Before payment it carries the full-screen watermark; ?guest={id} previews one named guest.
 */
export default async function PreviewPage({ params, searchParams }: Props) {
  const { manageToken } = await params;
  const { guest: guestId } = await searchParams;
  const event = await getEventByManageToken(manageToken);
  if (!event) notFound();
  if (event.status === "cancelled") return <ClosedInvitation lang={event.lang} />;

  const guest = guestId ? ((await getEventDashboard(event.id)).guests.find((g) => g.id === guestId) ?? null) : null;
  return <InvitationView event={event} guest={guest} preview={event.status === "draft"} />;
}
