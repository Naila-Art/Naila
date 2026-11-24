import "server-only";
import { randomBytes, randomUUID } from "crypto";
import { db, type Collection } from "./db";
import { builtInTemplates } from "./templates";
import { withDefaults, type Pricing } from "./pricing";
import { SAMPLES, isSampleSlug } from "./samples";
import type {
  ChangeRequest,
  EventData,
  Guest,
  GuestInput,
  GuestView,
  GuestWithStatus,
  MusicTrack,
  Order,
  Rsvp,
  RsvpStatus,
  Template,
  Wish,
} from "./types";

/**
 * Data access for the whole app. Pages and API routes only call these functions.
 * Storage is Supabase in production and a local JSON file in development (see ./db.ts).
 */

async function one<T>(c: Collection, field: string, value: string): Promise<T | null> {
  return (await db().where<T>(c, field, value))[0] ?? null;
}

function put(c: Collection, id: string, data: object): Promise<void> {
  return db().put(c, [{ id, data }]);
}

const byNewest = <T extends { createdAt?: string }>(a: T, b: T) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "");

export async function getEventBySlug(slug: string): Promise<EventData | null> {
  const found = await one<EventData>("events", "slug", slug);
  if (found || !isSampleSlug(slug)) return found;
  // Sample invitations are created the first time someone opens one.
  await ensureSamples();
  return one<EventData>("events", "slug", slug);
}

/** Creates any missing sample invitation (one per package) with its named guest. */
async function ensureSamples(): Promise<void> {
  const existing = new Set(
    (await db().where<EventData>("events", "slug", SAMPLES.map((s) => s.slug))).map((e) => e.slug),
  );
  for (const s of SAMPLES) {
    if (existing.has(s.slug)) continue;
    // Deterministic ids, so two first visits at the same moment write the same rows.
    const eventId = `evt_${s.slug.replace("-", "_")}`;
    const event: EventData = {
      ...s.event,
      id: eventId,
      slug: s.slug,
      manageToken: randomToken(20),
      templateId: "auto",
      category: s.category,
      lang: "ar",
      // Replaced at render time with a date that's always ahead.
      date: new Date().toISOString(),
      status: "active",
      samplePackage: s.packageId,
      createdAt: new Date().toISOString(),
    };
    await put("events", eventId, event);
    if (s.guest && !(await one<Guest>("guests", "token", s.guest.token))) {
      const { token, ...guest } = s.guest;
      const id = `gst_${token}`;
      await put("guests", id, { id, eventId, token, ...guest } satisfies Guest);
    }
  }
}

export async function getGuestByToken(eventId: string, token: string): Promise<Guest | null> {
  const guest = await one<Guest>("guests", "token", token);
  return guest?.eventId === eventId ? guest : null;
}

export async function getRsvpForGuest(eventId: string, guestId: string): Promise<Rsvp | null> {
  return (await db().where<Rsvp>("rsvps", "guestId", guestId)).find((r) => r.eventId === eventId) ?? null;
}

/** Called when the guest taps the seal — not on page load, so WhatsApp's link-preview bot isn't counted. */
export function recordView(view: Omit<GuestView, "openedAt">): Promise<void> {
  return put("views", randomUUID(), { ...view, openedAt: new Date().toISOString() } satisfies GuestView);
}

/** One reply per named guest (updates on change). General-link replies are appended. */
export async function upsertRsvp(input: { eventId: string; guestId?: string; name: string; status: RsvpStatus }): Promise<Rsvp> {
  const rsvp: Rsvp = { ...input, createdAt: new Date().toISOString() };
  await put("rsvps", input.guestId ? `${input.eventId}:${input.guestId}` : randomUUID(), rsvp);
  return rsvp;
}

// ---------------------------------------------------------------------------
// Client page (/c/{manageToken})
// ---------------------------------------------------------------------------

/** 10-char lowercase token, ~50 bits — unguessable for a per-guest link. */
function newGuestToken(taken: Set<string>): string {
  for (;;) {
    const token = randomToken(10);
    if (!taken.has(token)) return token;
  }
}

export function getEventByManageToken(manageToken: string): Promise<EventData | null> {
  return one<EventData>("events", "manageToken", manageToken);
}

export async function getEventDashboard(eventId: string) {
  const [views, rsvps, allGuests, wishes] = await Promise.all([
    db().where<GuestView>("views", "eventId", eventId),
    db().where<Rsvp>("rsvps", "eventId", eventId),
    db().where<Guest>("guests", "eventId", eventId),
    db().where<Wish>("wishes", "eventId", eventId),
  ]);
  views.sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  const firstOpen = new Map<string, string>();
  for (const v of views) {
    if (v.guestId && !firstOpen.has(v.guestId)) firstOpen.set(v.guestId, v.openedAt);
  }
  const rsvpByGuest = new Map(rsvps.filter((r) => r.guestId).map((r) => [r.guestId!, r.status]));

  const guests: GuestWithStatus[] = allGuests.map((g) => ({ ...g, openedAt: firstOpen.get(g.id), rsvp: rsvpByGuest.get(g.id) }));

  return {
    guests,
    /** Replies that came through the general link (guest typed their own name). */
    generalRsvps: rsvps.filter((r) => !r.guestId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    /** Opens of the general link (not tied to a guest). */
    generalOpens: views.filter((v) => !v.guestId).length,
    wishes: wishes.sort(byNewest),
  };
}

export async function addGuests(eventId: string, rows: GuestInput[]): Promise<Guest[]> {
  // Tokens are unique across all events (enforced by a unique index); 50 random bits make a clash
  // practically impossible, so we only avoid clashes within this batch.
  const taken = new Set<string>();
  const created = rows.map((row): Guest => {
    const token = newGuestToken(taken);
    taken.add(token);
    return { id: randomUUID(), eventId, token, title: row.title, name: row.name, phone: row.phone, message: row.message };
  });
  for (let i = 0; i < created.length; i += 500) {
    await db().put("guests", created.slice(i, i + 500).map((g) => ({ id: g.id, data: g })));
  }
  return created;
}

async function guestOf(eventId: string, guestId: string): Promise<Guest | null> {
  const guest = await one<Guest>("guests", "id", guestId);
  return guest?.eventId === eventId ? guest : null;
}

/** Sets or clears a guest's personal message. */
export async function updateGuestMessage(eventId: string, guestId: string, message: string | undefined): Promise<boolean> {
  const guest = await guestOf(eventId, guestId);
  if (!guest) return false;
  guest.message = message;
  await put("guests", guest.id, guest);
  return true;
}

export async function deleteGuest(eventId: string, guestId: string): Promise<boolean> {
  if (!(await guestOf(eventId, guestId))) return false;
  await db().remove("rsvps", "guestId", guestId);
  await db().remove("views", "guestId", guestId);
  await db().remove("guests", "id", guestId);
  return true;
}

async function getEvent(id: string): Promise<EventData | null> {
  return one<EventData>("events", "id", id);
}

export async function updateEventTexts(eventId: string, texts: { generalText: string; personalText: string }): Promise<void> {
  const event = await getEvent(eventId);
  if (event) await put("events", event.id, Object.assign(event, texts));
}

export async function addWish(input: { eventId: string; guestId?: string; name: string; body: string }): Promise<Wish> {
  const wish: Wish = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await put("wishes", wish.id, wish);
  return wish;
}

// ---------------------------------------------------------------------------
// Templates (admin dashboard)
// ---------------------------------------------------------------------------

/** Uploaded templates first (newest first), then the built-in fallback. */
export async function listTemplates(): Promise<Template[]> {
  const uploaded = (await db().list<Template>("templates")).sort(byNewest);
  return [...uploaded, ...builtInTemplates];
}

export async function findTemplate(id: string): Promise<Template | null> {
  return (await one<Template>("templates", "id", id)) ?? builtInTemplates.find((t) => t.id === id) ?? null;
}

/** Never fails: an unknown id (e.g. a deleted template) falls back to the built-in envelope. */
export async function getTemplate(id: string): Promise<Template> {
  return (await findTemplate(id)) ?? builtInTemplates[0];
}

export async function addTemplate(template: Template): Promise<Template> {
  await put("templates", template.id, template);
  return template;
}

/** Removes an uploaded template. Returns how many events were using it (they fall back to the built-in one). */
export async function deleteTemplate(id: string): Promise<{ deleted: boolean; eventsUsing: number }> {
  const deleted = (await db().remove("templates", "id", id)) > 0;
  const eventsUsing = (await db().where<EventData>("events", "templateId", id)).length;
  return { deleted, eventsUsing };
}

export async function templateUsage(): Promise<Record<string, number>> {
  const usage: Record<string, number> = {};
  for (const e of await listEvents()) usage[e.templateId] = (usage[e.templateId] ?? 0) + 1;
  return usage;
}

// ---------------------------------------------------------------------------
// Storefront orders
// ---------------------------------------------------------------------------

/** Random lowercase id/token from an unambiguous alphabet. */
export function randomToken(length: number): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l confusion
  return Array.from(randomBytes(length), (b) => alphabet[b % alphabet.length]).join("");
}

export const newId = (prefix: string) => `${prefix}_${randomBytes(5).toString("hex")}`;

async function freeSlug(): Promise<string> {
  for (;;) {
    const slug = randomToken(8);
    if (!(await one<EventData>("events", "slug", slug))) return slug;
  }
}

/** Creates the draft event and its order together (packages 1-2, built in the storefront). */
export async function createDraft(
  event: Omit<EventData, "id" | "slug" | "manageToken" | "orderId" | "status" | "createdAt">,
  order: Omit<Order, "id" | "eventId" | "kind" | "payment" | "createdAt">,
): Promise<{ event: EventData; order: Order }> {
  const now = new Date().toISOString();
  const eventId = newId("evt");
  const orderId = newId("ord");
  const e: EventData = { ...event, id: eventId, slug: await freeSlug(), manageToken: randomToken(20), orderId, status: "draft", createdAt: now };
  const o: Order = { ...order, id: orderId, eventId, kind: "self", payment: "unpaid", createdAt: now };
  await put("orders", o.id, o);
  await put("events", e.id, e);
  return { event: e, order: o };
}

/** A request for packages 3-4: no event yet, our team follows up on WhatsApp. */
export async function createCustomRequest(order: Omit<Order, "id" | "kind" | "payment" | "createdAt" | "stage">): Promise<Order> {
  const o: Order = { ...order, id: newId("ord"), kind: "custom", payment: "unpaid", stage: "new", createdAt: new Date().toISOString() };
  await put("orders", o.id, o);
  return o;
}

/**
 * Packages 3-4: once we've talked to the client, we create their invitation page from the dashboard.
 * The client then fills in the details and their guests (names + personal messages) on /c/{manageToken}.
 */
export async function createEventForOrder(
  orderId: string,
  event: Omit<EventData, "id" | "slug" | "manageToken" | "orderId" | "status" | "createdAt">,
): Promise<EventData | null> {
  const order = await getOrder(orderId);
  if (!order || order.eventId) return null;
  const e: EventData = {
    ...event,
    id: newId("evt"),
    slug: await freeSlug(),
    manageToken: randomToken(20),
    orderId,
    status: order.payment === "paid" ? "active" : "draft",
    createdAt: new Date().toISOString(),
  };
  await put("events", e.id, e);
  order.eventId = e.id;
  await put("orders", order.id, order);
  return e;
}

export function getOrder(id: string): Promise<Order | null> {
  return one<Order>("orders", "id", id);
}

export async function listOrders(): Promise<Order[]> {
  return (await db().list<Order>("orders")).sort(byNewest);
}

export async function listEvents(): Promise<EventData[]> {
  return (await db().list<EventData>("events")).sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

async function setEventStatus(eventId: string | undefined, status: (o: EventData) => EventData["status"]): Promise<void> {
  const event = eventId ? await getEvent(eventId) : null;
  if (!event) return;
  const next = status(event);
  if (next !== event.status) await put("events", event.id, { ...event, status: next });
}

/** Updates an order. Marking it paid also activates its event. Returns null when it doesn't exist. */
export async function updateOrder(id: string, patch: Partial<Omit<Order, "id" | "kind" | "createdAt">>): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  Object.assign(order, patch);
  if (patch.payment === "paid") order.paidAt ??= new Date().toISOString();
  await put("orders", order.id, order);
  // A late payment never reopens a cancelled order's links.
  if (patch.payment === "paid") await setEventStatus(order.eventId, (e) => (e.status === "cancelled" ? e.status : "active"));
  return order;
}

/**
 * Cancels an order (optionally as a refund) and closes every link of its event.
 * restoreOrder() undoes it.
 */
export async function cancelOrder(id: string, reason: string, refunded: boolean): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  Object.assign(order, { cancelledAt: new Date().toISOString(), cancelReason: reason, refunded });
  await put("orders", order.id, order);
  await setEventStatus(order.eventId, () => "cancelled");
  return order;
}

export async function restoreOrder(id: string): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  delete order.cancelledAt;
  delete order.cancelReason;
  delete order.refunded;
  await put("orders", order.id, order);
  await setEventStatus(order.eventId, () => (order.payment === "paid" ? "active" : "draft"));
  return order;
}

export type EventDetailsPatch = Partial<
  Pick<EventData, "partnerA" | "partnerB" | "date" | "venueName" | "venueAddress" | "mapsUrl" | "lang" | "templateId" | "musicTrackId" | "musicUrl">
>;

export async function updateEventDetails(eventId: string, patch: EventDetailsPatch): Promise<EventData | null> {
  const event = await getEvent(eventId);
  if (!event) return null;
  Object.assign(event, patch);
  await put("events", event.id, event);
  return event;
}

export async function countGuests(eventId: string): Promise<number> {
  return (await db().where<Guest>("guests", "eventId", eventId)).length;
}

// ---------------------------------------------------------------------------
// Change requests (client -> us)
// ---------------------------------------------------------------------------

export async function addChangeRequest(eventId: string, body: string): Promise<ChangeRequest> {
  const r: ChangeRequest = { id: newId("chg"), eventId, body, createdAt: new Date().toISOString() };
  await put("change_requests", r.id, r);
  return r;
}

export async function listChangeRequests(eventId?: string): Promise<ChangeRequest[]> {
  const all = eventId
    ? await db().where<ChangeRequest>("change_requests", "eventId", eventId)
    : await db().list<ChangeRequest>("change_requests");
  return all.sort(byNewest);
}

export async function resolveChangeRequest(id: string): Promise<boolean> {
  const r = await one<ChangeRequest>("change_requests", "id", id);
  if (!r) return false;
  r.resolvedAt = new Date().toISOString();
  await put("change_requests", r.id, r);
  return true;
}

// ---------------------------------------------------------------------------
// Music library (admin)
// ---------------------------------------------------------------------------

export async function listMusic(): Promise<MusicTrack[]> {
  return (await db().list<MusicTrack>("music")).sort(byNewest);
}

export function getMusic(id: string): Promise<MusicTrack | null> {
  return one<MusicTrack>("music", "id", id);
}

export async function addMusic(track: MusicTrack): Promise<MusicTrack> {
  await put("music", track.id, track);
  return track;
}

export async function deleteMusic(id: string): Promise<boolean> {
  return (await db().remove("music", "id", id)) > 0;
}

// ---------------------------------------------------------------------------
// Retention: guest data is kept for one year after the event
// ---------------------------------------------------------------------------

export const RETENTION_DAYS = 365;

/** Removes guests, replies, wishes and opens of events that ended more than a year ago. */
export async function purgeExpiredGuestData(now = new Date()): Promise<{ events: number; guests: number }> {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const expired = (await listEvents()).filter((e) => new Date(e.date).getTime() < cutoff).map((e) => e.id);
  let guests = 0;
  // Batches keep the request URL short.
  for (let i = 0; i < expired.length; i += 100) {
    const ids = expired.slice(i, i + 100);
    await db().remove("rsvps", "eventId", ids);
    await db().remove("wishes", "eventId", ids);
    await db().remove("views", "eventId", ids);
    guests += await db().remove("guests", "eventId", ids);
  }
  return { events: expired.length, guests };
}

// ---------------------------------------------------------------------------
// Pricing (admin dashboard)
// ---------------------------------------------------------------------------

export async function getPricing(): Promise<Pricing> {
  return withDefaults((await one<Pricing>("settings", "id", "pricing")) ?? undefined);
}

export async function savePricing(pricing: Pricing): Promise<Pricing> {
  await put("settings", "pricing", pricing);
  return pricing;
}
