"use client";

import Invitation from "./Invitation";
import { t } from "@/lib/i18n";
import { useSiteLang } from "@/lib/site-lang";
import { TIME_ZONE } from "@/lib/time";
import type { Template } from "@/lib/types";

/** A template shown exactly as a guest would see it, localized to the visitor's active language. */
export default function TemplatePreview({ template }: { template: Template }) {
  const { lang } = useSiteLang();
  const isAr = lang === "ar";
  const date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  date.setUTCHours(17, 0, 0, 0);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
      ...opts,
      timeZone: TIME_ZONE,
    }).format(date);

  return (
    <Invitation
      slug="__preview"
      lang={lang}
      strings={t(lang)}
      template={template}
      partnerA={isAr ? "أحمد" : "Ahmed"}
      partnerB={isAr ? "سارة" : "Sara"}
      greeting={
        isAr
          ? "تشرفنا بحضورك يا أستاذ محمود"
          : "We would be honoured by your presence, Mr. Mahmoud"
      }
      isNamed
      dateIso={date.toISOString()}
      dateLabel={fmt({
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
      timeLabel={fmt({ hour: "numeric", minute: "2-digit" })}
      venueName={isAr ? "قاعة الماسة" : "The Grand Conservatory"}
      venueAddress={isAr ? "القاهرة الجديدة" : "New Cairo"}
      mapsUrl="https://maps.google.com/?q=30.0074,31.4913"
      calendarUrl="#"
      initialRsvp={null}
      isPreview
    />
  );
}
