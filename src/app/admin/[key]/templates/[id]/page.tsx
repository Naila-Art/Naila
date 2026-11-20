import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Invitation from "@/components/Invitation";
import { isAdmin } from "@/lib/admin";
import { t } from "@/lib/i18n";
import { findTemplate } from "@/lib/store";

type Props = { params: Promise<{ key: string; id: string }> };

export const metadata: Metadata = {
  title: "معاينة التيمبليت",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Shows a template exactly as a guest would see it, with sample names. Replies here aren't saved. */
export default async function Preview({ params }: Props) {
  const { key, id } = await params;
  if (!isAdmin(key)) notFound();
  const template = await findTemplate(id);
  if (!template) notFound();

  const date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  date.setUTCHours(17, 0, 0, 0);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("ar-EG", { ...opts, timeZone: "Africa/Cairo" }).format(date);

  return (
    <Invitation
      slug="__preview"
      lang="ar"
      strings={t("ar")}
      template={template}
      partnerA="أحمد"
      partnerB="سارة"
      greeting="تشرفنا بحضورك يا أستاذ محمود"
      isNamed
      dateIso={date.toISOString()}
      dateLabel={fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      timeLabel={fmt({ hour: "numeric", minute: "2-digit" })}
      venueName="قاعة الماسة"
      venueAddress="القاهرة الجديدة"
      mapsUrl="https://maps.google.com/?q=30.0074,31.4913"
      calendarUrl="#"
      initialRsvp={null}
    />
  );
}
