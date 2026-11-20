import "server-only";
import { featuresOf } from "./pricing";
import { getMusic, getOrder, getPricing, type EventDetailsPatch } from "./store";
import { cleanText } from "./api";
import { cairoLocalToIso } from "./time";
import type { EventData, Features, Lang, Order } from "./types";

export interface EventContext {
  order: Order | null;
  features: Features;
  /** Draft = built but not paid yet: the invitation shows a preview ribbon and replies are off. */
  isDraft: boolean;
  musicUrl?: string;
}

export async function eventContext(event: EventData): Promise<EventContext> {
  const order = event.orderId ? await getOrder(event.orderId) : null;
  const features = featuresOf(event, order, await getPricing());
  let musicUrl: string | undefined;
  if (features.music) {
    const ownSongAllowed = !order || order.addons.customMusic;
    if (ownSongAllowed && event.musicUrl) musicUrl = event.musicUrl;
    else if (event.musicTrackId) musicUrl = (await getMusic(event.musicTrackId))?.url;
  }
  return { order, features, isDraft: event.status === "draft", musicUrl };
}

const MAPS_URL = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\b/i;

/**
 * Validates the editable event details (storefront form and client page).
 * Returns the cleaned values, or an error code.
 */
export function parseEventDetails(
  body: Record<string, unknown>,
): { ok: true; value: Required<Pick<EventDetailsPatch, "partnerA" | "partnerB" | "date" | "venueName" | "lang">> & EventDetailsPatch } | { ok: false; error: string } {
  const partnerA = cleanText(body.partnerA, 40);
  const partnerB = cleanText(body.partnerB, 40);
  if (!partnerA || !partnerB) return { ok: false, error: "names_required" };
  const date = typeof body.date === "string" ? cairoLocalToIso(body.date) : null;
  if (!date) return { ok: false, error: "date_invalid" };
  const venueName = cleanText(body.venueName, 80);
  if (!venueName) return { ok: false, error: "venue_required" };
  const lang: Lang = body.lang === "en" ? "en" : "ar";

  const venueAddress = body.venueAddress ? cleanText(body.venueAddress, 120) : null;
  if (body.venueAddress && !venueAddress) return { ok: false, error: "address_invalid" };
  let mapsUrl: string | undefined;
  if (typeof body.mapsUrl === "string" && body.mapsUrl.trim()) {
    mapsUrl = body.mapsUrl.trim();
    if (mapsUrl.length > 500 || !MAPS_URL.test(mapsUrl)) return { ok: false, error: "maps_invalid" };
  }
  return { ok: true, value: { partnerA, partnerB, date, venueName, lang, venueAddress: venueAddress ?? undefined, mapsUrl } };
}
