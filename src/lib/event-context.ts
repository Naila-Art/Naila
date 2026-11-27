import "server-only";
import { featuresOf } from "./pricing";
import { getMusic, getOrder, getTemplateMusic, type EventDetailsPatch } from "./store";
import { cleanText } from "./api";
import { cairoLocalToIso } from "./time";
import type { EventData, Features, Lang, Order } from "./types";

export interface EventContext {
  order: Order | null;
  features: Features;
  /** Draft = built but not paid yet: the invitation shows a preview ribbon and replies are off. */
  isDraft: boolean;
  musicUrl?: string;
  /** Attendance replies are on: the package allows it and the client asked for it (samples and demos always show it). */
  showRsvp: boolean;
}

export async function eventContext(event: EventData): Promise<EventContext> {
  const order = event.orderId ? await getOrder(event.orderId) : null;
  const features = featuresOf(event, order);
  let musicUrl: string | undefined;
  if (features.music) {
    if (features.customMusic && event.musicTrackId === "none") {
      musicUrl = undefined;
    } else if (features.customMusic && event.musicTrackId) {
      musicUrl = (await getMusic(event.musicTrackId))?.url ?? (await getTemplateMusic(event.templateId))?.url;
    } else if (!order && event.musicUrl) {
      musicUrl = event.musicUrl;
    } else {
      musicUrl = (await getTemplateMusic(event.templateId))?.url;
    }
  }
  const showRsvp = features.rsvp && (event.rsvp ?? (Boolean(event.samplePackage) || !order));
  return { order, features, isDraft: event.status === "draft", musicUrl, showRsvp };
}

const ALLOWED_MAP_HOSTS =
  /^(www\.)?(google\.[a-z.]+|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl|g\.co|share\.google|maps\.apple\.com|maps\.apple|waze\.com|ul\.waze\.com)$/i;

/**
 * Extracts & normalizes an optional map share URL (e.g. Google Maps mobile share text,
 * scheme-less links, Apple Maps, or Waze) while blocking unsafe protocols.
 */
function normalizeOptionalMapsUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Extract URL if user pasted full share text like "Four Seasons Cairo https://maps.app.goo.gl/abc"
  const embedded = trimmed.match(/https?:\/\/\S+/i);
  let candidate = embedded ? embedded[0] : trimmed;

  // Strip trailing punctuation often included when copying from chat apps
  candidate = candidate.replace(/[),.;]+$/, "");

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  } else if (/^http:\/\//i.test(candidate)) {
    candidate = candidate.replace(/^http:\/\//i, "https://");
  }

  if (candidate.length > 500) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") return null;
    if (!ALLOWED_MAP_HOSTS.test(parsed.hostname)) return null;
    // For bare google.<tld> domains, require a /maps path
    if (/^(www\.)?google\.[a-z.]+$/i.test(parsed.hostname) && !parsed.pathname.toLowerCase().startsWith("/maps")) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** "YYYY-MM-DD" of an instant in Cairo, for comparing days. */
const cairoDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date(iso));

/**
 * Validates the editable event details (storefront form and client page).
 * Returns the cleaned values, or an error code.
 */
export function parseEventDetails(
  body: Record<string, unknown>,
  opts: { allowPast?: boolean; savedDate?: string } = {},
): { ok: true; value: Required<Pick<EventDetailsPatch, "partnerA" | "partnerB" | "date" | "venueName" | "lang">> & EventDetailsPatch } | { ok: false; error: string } {
  const partnerA = cleanText(body.partnerA, 40);
  const partnerB = cleanText(body.partnerB, 40);
  if (!partnerA || !partnerB) return { ok: false, error: "names_required" };
  const date = typeof body.date === "string" ? cairoLocalToIso(body.date) : null;
  if (!date) return { ok: false, error: "date_invalid" };
  if (!opts.allowPast && date !== opts.savedDate && cairoDay(date) < cairoDay(new Date().toISOString())) {
    return { ok: false, error: "date_past" };
  }
  const venueName = cleanText(body.venueName, 80);
  if (!venueName) return { ok: false, error: "venue_required" };
  const lang: Lang = body.lang === "en" ? "en" : "ar";

  const venueAddress = body.venueAddress ? cleanText(body.venueAddress, 120) : null;
  if (body.venueAddress && !venueAddress) return { ok: false, error: "address_invalid" };
  let mapsUrl: string | undefined;
  if (typeof body.mapsUrl === "string" && body.mapsUrl.trim()) {
    const normalized = normalizeOptionalMapsUrl(body.mapsUrl);
    if (normalized === null) return { ok: false, error: "maps_invalid" };
    if (normalized) mapsUrl = normalized;
  }
  // Only touched when sent, so forms without the question keep the client's choice.
  const rsvp = typeof body.rsvp === "boolean" ? { rsvp: body.rsvp } : {};
  return { ok: true, value: { partnerA, partnerB, date, venueName, lang, venueAddress: venueAddress ?? undefined, mapsUrl, ...rsvp } };
}
