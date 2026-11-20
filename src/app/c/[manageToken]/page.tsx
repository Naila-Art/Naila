import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManageEvent from "@/components/manage/ManageEvent";
import { getEventByManageToken, getEventDashboard } from "@/lib/store";

type Props = { params: Promise<{ manageToken: string }> };

export const metadata: Metadata = {
  title: "إدارة الدعوة",
  robots: { index: false, follow: false },
  // The link itself is the key — don't leak it to other sites via Referer.
  referrer: "no-referrer",
};

/** The client's page, opened by a private link with no password. */
export default async function Page({ params }: Props) {
  const { manageToken } = await params;
  const event = await getEventByManageToken(manageToken);
  if (!event) notFound();
  const dashboard = await getEventDashboard(event.id);

  return (
    <ManageEvent
      manageToken={manageToken}
      slug={event.slug}
      couple={`${event.partnerA} و ${event.partnerB}`}
      initialTexts={{ generalText: event.generalText, personalText: event.personalText }}
      initial={dashboard}
    />
  );
}
