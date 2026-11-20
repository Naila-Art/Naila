import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Invitation from "./Invitation";
import { getEventBySlug, getGuestByToken, getRsvpForGuest, getTemplate, listTemplates } from "@/lib/store";
import { eventContext } from "@/lib/event-context";
import ClosedInvitation from "./ClosedInvitation";
import { displayName, fillPersonalText } from "@/lib/text";
import { t } from "@/lib/i18n";
import type { Category, EventData, Template } from "@/lib/types";
import { cairoLocalToIso } from "@/lib/time";

const TIME_ZONE = "Africa/Cairo";

/** Samples always show an event about six weeks ahead, at 7 pm Cairo time, so the countdown is live. */
function sampleDate(): string {
  const d = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  return cairoLocalToIso(`${d.toISOString().slice(0, 10)}T19:00`)!;
}

/** Samples use the newest uploaded design of their category (any uploaded design, else the built-in one). */
async function sampleTemplate(category: Category | undefined): Promise<Template> {
  const uploaded = (await listTemplates()).filter((t) => t.createdAt);
  return uploaded.find((t) => t.category === category) ?? uploaded[0] ?? (await getTemplate("ivory-seal"));
}

// cache(): generateMetadata and the page share one lookup per request.
const load = cache(async (slug: string, token?: string) => {
  const found = await getEventBySlug(slug);
  if (!found) notFound();
  const event = found.samplePackage ? { ...found, date: sampleDate() } : found;
  const guest = token ? await getGuestByToken(event.id, token) : null;
  // A wrong token is a 404 rather than a silent fallback, so typos in shared links get noticed.
  if (token && !guest) notFound();
  return { event, guest };
});

function formatDate(event: EventData) {
  const locale = event.lang === "ar" ? "ar-EG" : "en-GB";
  const d = new Date(event.date);
  return {
    date: new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE }).format(d),
    time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE }).format(d),
  };
}

function calendarUrl(event: EventData) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.partnerA} & ${event.partnerB}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: [event.venueName, event.venueAddress].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export async function invitationMetadata(slug: string, token?: string): Promise<Metadata> {
  const { event, guest } = await load(slug, token);
  const couple = `${event.partnerA} ${t(event.lang).and} ${event.partnerB}`;
  if (event.status === "cancelled") return { title: event.lang === "ar" ? "الدعوة غير متاحة" : "Invitation unavailable", robots: { index: false, follow: false } };
  const title = guest
    ? event.lang === "ar"
      ? `دعوة خاصة لـ ${displayName(guest)}`
      : `A special invitation for ${displayName(guest)}`
    : couple;
  return {
    title,
    description: couple,
    // Private links: keep them out of search engines.
    robots: { index: false, follow: false },
    openGraph: { title, description: couple, type: "website" },
  };
}

export default async function InvitationPage({ slug, token }: { slug: string; token?: string }) {
  const { event, guest } = await load(slug, token);
  if (event.status === "cancelled") return <ClosedInvitation lang={event.lang} />;
  const template = event.samplePackage ? await sampleTemplate(event.category) : await getTemplate(event.templateId);
  const ctx = await eventContext(event);
  const rsvp = guest ? await getRsvpForGuest(event.id, guest.id) : null;
  const { date, time } = formatDate(event);

  return (
    <Invitation
      slug={event.slug}
      token={guest?.token}
      lang={event.lang}
      strings={t(event.lang)}
      template={template}
      partnerA={event.partnerA}
      partnerB={event.partnerB}
      greeting={guest ? fillPersonalText(event.personalText, guest) : event.generalText}
      isNamed={Boolean(guest)}
      dateIso={event.date}
      dateLabel={date}
      timeLabel={time}
      venueName={event.venueName}
      venueAddress={event.venueAddress}
      mapsUrl={ctx.features.maps ? event.mapsUrl : undefined}
      musicUrl={ctx.musicUrl}
      showWishes={ctx.features.wishes}
      personalMessage={guest && ctx.features.namesLimit > 0 ? guest.message : undefined}
      isPreview={ctx.isDraft}
      calendarUrl={calendarUrl(event)}
      initialRsvp={rsvp?.status ?? null}
    />
  );
}
