import Invitation from "./Invitation";
import { t } from "@/lib/i18n";
import { TIME_ZONE } from "@/lib/time";
import type { Template } from "@/lib/types";

/** A template shown exactly as a guest would see it, with sample names. Replies here go nowhere. */
export default function TemplatePreview({ template }: { template: Template }) {
  const date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  date.setUTCHours(17, 0, 0, 0);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("ar-EG", { ...opts, timeZone: TIME_ZONE }).format(date);

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
      isPreview
    />
  );
}
