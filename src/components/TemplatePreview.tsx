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
      showRsvp
      isPreview
      schedule={
        isAr
          ? [
              { time: "٧:٠٠ م", label: "كتب الكتاب" },
              { time: "٨:٣٠ م", label: "الزفة ودخول العروسين" },
              { time: "٩:٣٠ م", label: "العشاء" },
              { time: "١١:٠٠ م", label: "تقطيع التورتة" },
            ]
          : [
              { time: "7:00 pm", label: "Katb kitab" },
              { time: "8:30 pm", label: "Zaffa & the couple's entrance" },
              { time: "9:30 pm", label: "Dinner" },
              { time: "11:00 pm", label: "Cutting the cake" },
            ]
      }
      dressCode={isAr ? "سواريه" : "Black tie"}
      notes={
        isAr
          ? "الحفل للكبار فقط. الباركينج متاح عند البوابة رقم ٢."
          : "An adults-only evening. Valet parking is available at Gate 2."
      }
    />
  );
}
