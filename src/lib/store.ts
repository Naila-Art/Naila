import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import type { EventData, Guest, GuestInput, GuestView, GuestWithStatus, Rsvp, RsvpStatus, Wish } from "./types";

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
  return db.events.find((e) => e.slug === slug) ?? null;
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
      return { id: randomUUID(), eventId, token, title: row.title, name: row.name, phone: row.phone };
    });
    db.guests.push(...created);
    return created;
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
