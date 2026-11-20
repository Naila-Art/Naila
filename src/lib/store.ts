import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import { builtInTemplates } from "./templates";
import { withDefaults, type Pricing } from "./pricing";
import { SAMPLES, isSampleSlug } from "./samples";
import type {
  AdminUser,
  ChangeRequest,
  EventData,
  Guest,
  GuestInput,
  GuestView,
  GuestWithStatus,
  MusicTrack,
  Order,
  PaymentMethodConfig,
  Rsvp,
  RsvpStatus,
  Template,
  Wish,
} from "./types";

/**
 * Data access for the invitation pages.
 *
 * Stage 1 uses a local JSON file (data/db.json) so we can build without a
 * database. Every function here maps 1:1 to a Supabase query later
 * (see supabase/schema.sql); pages and API routes only call these functions.
 * NOTE: the JSON file does not persist on Vercel — Supabase replaces it before deploy.
 */

interface Db {
  events: EventData[];
  guests: Guest[];
  rsvps: Rsvp[];
  wishes: Wish[];
  views: GuestView[];
  /** Uploaded from the admin dashboard. Optional so older db.json files still load. */
  templates?: Template[];
  orders?: Order[];
  changeRequests?: ChangeRequest[];
  music?: MusicTrack[];
  /** Saved from the admin dashboard; DEFAULT_PRICING until then. */
  pricing?: Pricing;
  admins?: AdminUser[];
  /** scrypt hash of the finance page password (separate from the login). */
  financePasswordHash?: string;
  /** Saved from the dashboard; defaults until then. */
  paymentMethods?: PaymentMethodConfig[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function seed(): Db {
  const eventId = "evt_demo";
  return {
    events: [
      {
        id: eventId,
        slug: "demo",
        manageToken: "m7q2x9k4t8w3z6p1",
        templateId: "ivory-seal",
        lang: "ar",
        partnerA: "أحمد",
        partnerB: "سارة",
        date: "2027-02-14T19:00:00+02:00",
        venueName: "قاعة الماسة",
        venueAddress: "القاهرة الجديدة",
        mapsUrl: "https://maps.google.com/?q=30.0074,31.4913",
        generalText: "يشرفنا حضوركم حفل زفافنا",
        personalText: "تشرفنا بحضورك يا {title} {name}",
      },
      {
        id: "evt_demo_en",
        slug: "demo-en",
        manageToken: "e5n8c2v7b4h9j3r6",
        templateId: "ivory-seal",
        lang: "en",
        partnerA: "Omar",
        partnerB: "Laila",
        date: "2027-04-02T18:30:00+02:00",
        venueName: "The Garden Hall",
        venueAddress: "Cairo",
        mapsUrl: "https://maps.google.com/?q=30.0444,31.2357",
        generalText: "Together with their families, invite you to celebrate their wedding",
        personalText: "We would be honoured by your presence, {title} {name}",
      },
    ],
    guests: [
      { id: "gst_1", eventId, token: "k3x9m2p7qa", title: "أستاذ", name: "محمود", phone: "+201000000000" },
      { id: "gst_2", eventId, token: "w8t4z6n1re", title: "", name: "منى" },
      { id: "gst_3", eventId: "evt_demo_en", token: "p5d2h8v3kc", title: "Mr.", name: "Karim" },
    ],
    rsvps: [],
    wishes: [],
    views: [],
    templates: [],
    orders: [],
    changeRequests: [],
    music: [],
  };
}

async function read(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const db = seed();
    await write(db);
    return db;
  }
}

async function write(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

// Serialise writes so concurrent requests don't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function getEventBySlug(slug: string): Promise<EventData | null> {
  const db = await read();
  const found = db.events.find((e) => e.slug === slug);
  if (found || !isSampleSlug(slug)) return found ?? null;
  // Sample invitations are created the first time someone opens one.
  await ensureSamples();
  return (await read()).events.find((e) => e.slug === slug) ?? null;
}

/** Creates any missing sample invitation (one per package) with its named guest. */
function ensureSamples(): Promise<void> {
  return mutate((db) => {
    for (const s of SAMPLES) {
      if (db.events.some((e) => e.slug === s.slug)) continue;
      const eventId = `evt_${s.slug.replace("-", "_")}`;
      db.events.push({
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
      });
      if (s.guest && !db.guests.some((g) => g.token === s.guest!.token)) {
        const { token, ...guest } = s.guest;
        db.guests.push({ id: randomUUID(), eventId, token, ...guest });
      }
    }
  });
}

export async function getGuestByToken(eventId: string, token: string): Promise<Guest | null> {
  const db = await read();
  return db.guests.find((g) => g.eventId === eventId && g.token === token) ?? null;
}

export async function getRsvpForGuest(eventId: string, guestId: string): Promise<Rsvp | null> {
  const db = await read();
  return db.rsvps.find((r) => r.eventId === eventId && r.guestId === guestId) ?? null;
}

/** Called when the guest taps the seal — not on page load, so WhatsApp's link-preview bot isn't counted. */
export function recordView(view: Omit<GuestView, "openedAt">): Promise<void> {
  return mutate((db) => {
    db.views.push({ ...view, openedAt: new Date().toISOString() });
  });
}

/** One reply per named guest (updates on change). General-link replies are appended. */
export function upsertRsvp(input: { eventId: string; guestId?: string; name: string; status: RsvpStatus }): Promise<Rsvp> {
  return mutate((db) => {
    const rsvp: Rsvp = { ...input, createdAt: new Date().toISOString() };
    const i = input.guestId
      ? db.rsvps.findIndex((r) => r.eventId === input.eventId && r.guestId === input.guestId)
      : -1;
    if (i >= 0) db.rsvps[i] = rsvp;
    else db.rsvps.push(rsvp);
    return rsvp;
  });
}

// ---------------------------------------------------------------------------
// Client page (/c/{manageToken})
// ---------------------------------------------------------------------------

/** 10-char lowercase token, ~50 bits — unguessable for a per-guest link. */
function newGuestToken(taken: Set<string>): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l confusion
  for (;;) {
    const bytes = randomBytes(10);
    const token = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    if (!taken.has(token)) return token;
  }
}

export async function getEventByManageToken(manageToken: string): Promise<EventData | null> {
  const db = await read();
  return db.events.find((e) => e.manageToken === manageToken) ?? null;
}

export async function getEventDashboard(eventId: string) {
  const db = await read();
  const views = db.views.filter((v) => v.eventId === eventId);
  const rsvps = db.rsvps.filter((r) => r.eventId === eventId);

  const firstOpen = new Map<string, string>();
  for (const v of views) {
    if (v.guestId && !firstOpen.has(v.guestId)) firstOpen.set(v.guestId, v.openedAt);
  }
  const rsvpByGuest = new Map(rsvps.filter((r) => r.guestId).map((r) => [r.guestId!, r.status]));

  const guests: GuestWithStatus[] = db.guests
    .filter((g) => g.eventId === eventId)
    .map((g) => ({ ...g, openedAt: firstOpen.get(g.id), rsvp: rsvpByGuest.get(g.id) }));

  return {
    guests,
    /** Replies that came through the general link (guest typed their own name). */
    generalRsvps: rsvps.filter((r) => !r.guestId),
    /** Opens of the general link (not tied to a guest). */
    generalOpens: views.filter((v) => !v.guestId).length,
    wishes: db.wishes.filter((w) => w.eventId === eventId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function addGuests(eventId: string, rows: GuestInput[]): Promise<Guest[]> {
  return mutate((db) => {
    const taken = new Set(db.guests.map((g) => g.token));
    const created = rows.map((row): Guest => {
      const token = newGuestToken(taken);
      taken.add(token);
      return { id: randomUUID(), eventId, token, title: row.title, name: row.name, phone: row.phone, message: row.message };
    });
    db.guests.push(...created);
    return created;
  });
}

/** Sets or clears a guest's personal message. */
export function updateGuestMessage(eventId: string, guestId: string, message: string | undefined): Promise<boolean> {
  return mutate((db) => {
    const guest = db.guests.find((g) => g.eventId === eventId && g.id === guestId);
    if (!guest) return false;
    guest.message = message;
    return true;
  });
}

export function deleteGuest(eventId: string, guestId: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.guests.length;
    db.guests = db.guests.filter((g) => !(g.eventId === eventId && g.id === guestId));
    if (db.guests.length === before) return false;
    db.rsvps = db.rsvps.filter((r) => r.guestId !== guestId);
    db.views = db.views.filter((v) => v.guestId !== guestId);
    return true;
  });
}

export function updateEventTexts(eventId: string, texts: { generalText: string; personalText: string }): Promise<void> {
  return mutate((db) => {
    const event = db.events.find((e) => e.id === eventId);
    if (event) Object.assign(event, texts);
  });
}

export function addWish(input: { eventId: string; guestId?: string; name: string; body: string }): Promise<Wish> {
  return mutate((db) => {
    const wish: Wish = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    db.wishes.push(wish);
    return wish;
  });
}

// ---------------------------------------------------------------------------
// Templates (admin dashboard)
// ---------------------------------------------------------------------------

/** Uploaded templates first (newest first), then the built-in fallback. */
export async function listTemplates(): Promise<Template[]> {
  const db = await read();
  const uploaded = [...(db.templates ?? [])].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return [...uploaded, ...builtInTemplates];
}

export async function findTemplate(id: string): Promise<Template | null> {
  return (await listTemplates()).find((t) => t.id === id) ?? null;
}

/** Never fails: an unknown id (e.g. a deleted template) falls back to the built-in envelope. */
export async function getTemplate(id: string): Promise<Template> {
  return (await findTemplate(id)) ?? builtInTemplates[0];
}

export function addTemplate(template: Template): Promise<Template> {
  return mutate((db) => {
    db.templates = [...(db.templates ?? []), template];
    return template;
  });
}

/** Removes an uploaded template. Returns how many events were using it (they fall back to the built-in one). */
export function deleteTemplate(id: string): Promise<{ deleted: boolean; eventsUsing: number }> {
  return mutate((db) => {
    const before = db.templates?.length ?? 0;
    db.templates = (db.templates ?? []).filter((t) => t.id !== id);
    return { deleted: db.templates.length < before, eventsUsing: db.events.filter((e) => e.templateId === id).length };
  });
}

export async function templateUsage(): Promise<Record<string, number>> {
  const db = await read();
  const usage: Record<string, number> = {};
  for (const e of db.events) usage[e.templateId] = (usage[e.templateId] ?? 0) + 1;
  return usage;
}

// ---------------------------------------------------------------------------
// Storefront orders
// ---------------------------------------------------------------------------

/** Random lowercase id/token from an unambiguous alphabet. */
export function randomToken(length: number): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(length), (b) => alphabet[b % alphabet.length]).join("");
}

export const newId = (prefix: string) => `${prefix}_${randomBytes(5).toString("hex")}`;

/** Creates the draft event and its order together (packages 1-2, built in the storefront). */
export function createDraft(
  event: Omit<EventData, "id" | "slug" | "manageToken" | "orderId" | "status" | "createdAt">,
  order: Omit<Order, "id" | "eventId" | "kind" | "payment" | "createdAt">,
): Promise<{ event: EventData; order: Order }> {
  return mutate((db) => {
    const slugs = new Set(db.events.map((e) => e.slug));
    let slug = randomToken(8);
    while (slugs.has(slug)) slug = randomToken(8);
    const now = new Date().toISOString();
    const eventId = newId("evt");
    const orderId = newId("ord");
    const e: EventData = { ...event, id: eventId, slug, manageToken: randomToken(20), orderId, status: "draft", createdAt: now };
    const o: Order = { ...order, id: orderId, eventId, kind: "self", payment: "unpaid", createdAt: now };
    db.events.push(e);
    (db.orders ??= []).push(o);
    return { event: e, order: o };
  });
}

/** A request for packages 3-4: no event yet, our team follows up on WhatsApp. */
export function createCustomRequest(order: Omit<Order, "id" | "kind" | "payment" | "createdAt" | "stage">): Promise<Order> {
  return mutate((db) => {
    const o: Order = { ...order, id: newId("ord"), kind: "custom", payment: "unpaid", stage: "new", createdAt: new Date().toISOString() };
    (db.orders ??= []).push(o);
    return o;
  });
}

/**
 * Packages 3-4: once we've talked to the client, we create their invitation page from the dashboard.
 * The client then fills in the details and their guests (names + personal messages) on /c/{manageToken}.
 */
export function createEventForOrder(
  orderId: string,
  event: Omit<EventData, "id" | "slug" | "manageToken" | "orderId" | "status" | "createdAt">,
): Promise<EventData | null> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === orderId);
    if (!order || order.eventId) return null;
    const slugs = new Set(db.events.map((e) => e.slug));
    let slug = randomToken(8);
    while (slugs.has(slug)) slug = randomToken(8);
    const e: EventData = {
      ...event,
      id: newId("evt"),
      slug,
      manageToken: randomToken(20),
      orderId,
      status: order.payment === "paid" ? "active" : "draft",
      createdAt: new Date().toISOString(),
    };
    db.events.push(e);
    order.eventId = e.id;
    return e;
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = await read();
  return db.orders?.find((o) => o.id === id) ?? null;
}

export async function listOrders(): Promise<Order[]> {
  const db = await read();
  return [...(db.orders ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listEvents(): Promise<EventData[]> {
  return (await read()).events;
}

/** Updates an order. Marking it paid also activates its event. Returns null when it doesn't exist. */
export function updateOrder(id: string, patch: Partial<Omit<Order, "id" | "kind" | "createdAt">>): Promise<Order | null> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === id);
    if (!order) return null;
    Object.assign(order, patch);
    if (patch.payment === "paid") {
      order.paidAt ??= new Date().toISOString();
      const event = db.events.find((e) => e.id === order.eventId);
      // A late payment never reopens a cancelled order's links.
      if (event && event.status !== "cancelled") event.status = "active";
    }
    return order;
  });
}

/**
 * Cancels an order (optionally as a refund) and closes every link of its event.
 * restoreOrder() undoes it.
 */
export function cancelOrder(id: string, reason: string, refunded: boolean): Promise<Order | null> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === id);
    if (!order) return null;
    Object.assign(order, { cancelledAt: new Date().toISOString(), cancelReason: reason, refunded });
    const event = db.events.find((e) => e.id === order.eventId);
    if (event) event.status = "cancelled";
    return order;
  });
}

export function restoreOrder(id: string): Promise<Order | null> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === id);
    if (!order) return null;
    delete order.cancelledAt;
    delete order.cancelReason;
    delete order.refunded;
    const event = db.events.find((e) => e.id === order.eventId);
    if (event) event.status = order.payment === "paid" ? "active" : "draft";
    return order;
  });
}

export type EventDetailsPatch = Partial<
  Pick<EventData, "partnerA" | "partnerB" | "date" | "venueName" | "venueAddress" | "mapsUrl" | "lang" | "templateId" | "musicTrackId" | "musicUrl">
>;

export function updateEventDetails(eventId: string, patch: EventDetailsPatch): Promise<EventData | null> {
  return mutate((db) => {
    const event = db.events.find((e) => e.id === eventId);
    if (!event) return null;
    Object.assign(event, patch);
    return event;
  });
}

export async function countGuests(eventId: string): Promise<number> {
  return (await read()).guests.filter((g) => g.eventId === eventId).length;
}

// ---------------------------------------------------------------------------
// Change requests (client -> us)
// ---------------------------------------------------------------------------

export function addChangeRequest(eventId: string, body: string): Promise<ChangeRequest> {
  return mutate((db) => {
    const r: ChangeRequest = { id: newId("chg"), eventId, body, createdAt: new Date().toISOString() };
    (db.changeRequests ??= []).push(r);
    return r;
  });
}

export async function listChangeRequests(eventId?: string): Promise<ChangeRequest[]> {
  const all = (await read()).changeRequests ?? [];
  return all.filter((r) => !eventId || r.eventId === eventId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resolveChangeRequest(id: string): Promise<boolean> {
  return mutate((db) => {
    const r = db.changeRequests?.find((x) => x.id === id);
    if (!r) return false;
    r.resolvedAt = new Date().toISOString();
    return true;
  });
}

// ---------------------------------------------------------------------------
// Music library (admin)
// ---------------------------------------------------------------------------

export async function listMusic(): Promise<MusicTrack[]> {
  return [...((await read()).music ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMusic(id: string): Promise<MusicTrack | null> {
  return (await read()).music?.find((m) => m.id === id) ?? null;
}

export function addMusic(track: MusicTrack): Promise<MusicTrack> {
  return mutate((db) => {
    (db.music ??= []).push(track);
    return track;
  });
}

export function deleteMusic(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.music?.length ?? 0;
    db.music = (db.music ?? []).filter((m) => m.id !== id);
    return db.music.length < before;
  });
}

// ---------------------------------------------------------------------------
// Retention: guest data is kept for one year after the event
// ---------------------------------------------------------------------------

export const RETENTION_DAYS = 365;

/** Removes guests, replies, wishes and opens of events that ended more than a year ago. */
export function purgeExpiredGuestData(now = new Date()): Promise<{ events: number; guests: number }> {
  return mutate((db) => {
    const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const expired = new Set(db.events.filter((e) => new Date(e.date).getTime() < cutoff).map((e) => e.id));
    if (expired.size === 0) return { events: 0, guests: 0 };
    const guestsBefore = db.guests.length;
    db.guests = db.guests.filter((g) => !expired.has(g.eventId));
    db.rsvps = db.rsvps.filter((r) => !expired.has(r.eventId));
    db.wishes = db.wishes.filter((w) => !expired.has(w.eventId));
    db.views = db.views.filter((v) => !expired.has(v.eventId));
    return { events: expired.size, guests: guestsBefore - db.guests.length };
  });
}

// ---------------------------------------------------------------------------
// Pricing (admin dashboard)
// ---------------------------------------------------------------------------

export async function getPricing(): Promise<Pricing> {
  return withDefaults((await read()).pricing);
}

export function savePricing(pricing: Pricing): Promise<Pricing> {
  return mutate((db) => {
    db.pricing = pricing;
    return pricing;
  });
}

// ---------------------------------------------------------------------------
// Dashboard accounts
// ---------------------------------------------------------------------------

export async function listAdminUsers(): Promise<AdminUser[]> {
  return (await read()).admins ?? [];
}

export async function getAdminUser(id: string): Promise<AdminUser | null> {
  return (await read()).admins?.find((a) => a.id === id) ?? null;
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const e = email.trim().toLowerCase();
  return (await read()).admins?.find((a) => a.email === e) ?? null;
}

/** Adds an account; returns null if the email is taken. */
export function addAdminUser(user: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser | null> {
  return mutate((db) => {
    const email = user.email.trim().toLowerCase();
    if ((db.admins ?? []).some((a) => a.email === email)) return null;
    const created: AdminUser = { ...user, email, id: newId("adm"), createdAt: new Date().toISOString() };
    (db.admins ??= []).push(created);
    return created;
  });
}

export function updateAdminPassword(id: string, passwordHash: string): Promise<boolean> {
  return mutate((db) => {
    const a = db.admins?.find((x) => x.id === id);
    if (!a) return false;
    a.passwordHash = passwordHash;
    return true;
  });
}

/** Removes an account, but never the last one. */
export function deleteAdminUser(id: string): Promise<"ok" | "not_found" | "last"> {
  return mutate((db) => {
    const list = db.admins ?? [];
    if (!list.some((a) => a.id === id)) return "not_found";
    if (list.length <= 1) return "last";
    db.admins = list.filter((a) => a.id !== id);
    return "ok";
  });
}

// ---------------------------------------------------------------------------
// Finance page password
// ---------------------------------------------------------------------------

export async function getFinancePasswordHash(): Promise<string | null> {
  return (await read()).financePasswordHash ?? null;
}

export function setFinancePasswordHash(hash: string): Promise<void> {
  return mutate((db) => {
    db.financePasswordHash = hash;
  });
}

// ---------------------------------------------------------------------------
// Package 3+: client references and brief
// ---------------------------------------------------------------------------

export function addOrderReference(orderId: string, ref: NonNullable<Order["references"]>[number]): Promise<Order | null> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === orderId);
    if (!order) return null;
    (order.references ??= []).push(ref);
    return order;
  });
}

export function removeOrderReference(orderId: string, url: string): Promise<boolean> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === orderId);
    if (!order?.references) return false;
    const before = order.references.length;
    order.references = order.references.filter((r) => r.url !== url);
    return order.references.length < before;
  });
}

export function updateOrderBrief(orderId: string, notes: string): Promise<boolean> {
  return mutate((db) => {
    const order = db.orders?.find((o) => o.id === orderId);
    if (!order) return false;
    order.brief = { category: order.brief?.category ?? "wedding", date: order.brief?.date, notes };
    return true;
  });
}

// ---------------------------------------------------------------------------
// Payment methods (dashboard)
// ---------------------------------------------------------------------------

/** Starting set: Instapay (from INSTAPAY_HANDLE if set), wallets off, card on (shown only once Paymob keys exist). */
function defaultPaymentMethods(): PaymentMethodConfig[] {
  const instapay = process.env.INSTAPAY_HANDLE?.trim() ?? "";
  return [
    { id: "instapay", name: "إنستاباي", kind: "transfer", account: instapay, active: Boolean(instapay) },
    { id: "vodafone_cash", name: "فودافون كاش", kind: "transfer", account: "", active: false },
    { id: "card", name: "فيزا / ميزة / أبل باي", kind: "card", account: "", active: true },
  ];
}

export async function listPaymentMethods(): Promise<PaymentMethodConfig[]> {
  return (await read()).paymentMethods ?? defaultPaymentMethods();
}

export function savePaymentMethods(methods: PaymentMethodConfig[]): Promise<PaymentMethodConfig[]> {
  return mutate((db) => {
    db.paymentMethods = methods;
    return methods;
  });
}
