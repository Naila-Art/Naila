import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Document storage behind src/lib/store.ts.
 *
 * Every collection is a table of `(id, data jsonb)` rows (see supabase/schema.sql).
 * - Production / Vercel: Supabase, through its REST API with the service-role key
 *   (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * - Local development without those variables: a JSON file at data/store.json.
 */

export type Collection =
  | "events"
  | "guests"
  | "rsvps"
  | "wishes"
  | "views"
  | "templates"
  | "orders"
  | "change_requests"
  | "music"
  | "settings";

export interface Backend {
  list<T>(c: Collection): Promise<T[]>;
  /** Rows whose `field` equals `value` (or is one of `value`). `id` means the row id. */
  where<T>(c: Collection, field: string, value: string | string[]): Promise<T[]>;
  /** Inserts or replaces rows by id. */
  put(c: Collection, rows: { id: string; data: object }[]): Promise<void>;
  /** Deletes matching rows and returns how many were deleted. */
  remove(c: Collection, field: string, value: string | string[]): Promise<number>;
}

const asList = (v: string | string[]) => (Array.isArray(v) ? v : [v]);

// ---------------------------------------------------------------------------
// Supabase (PostgREST)
// ---------------------------------------------------------------------------

const PAGE = 1000; // Supabase's default max rows per request

function supabase(url: string, key: string): Backend {
  const base = `${url.replace(/\/+$/, "")}/rest/v1`;

  async function req(query: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${base}/${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase ${init.method ?? "GET"} ${query.split("?")[0]} failed: ${res.status} ${await res.text()}`);
    }
    return res;
  }

  function filter(field: string, value: string | string[]): string {
    const col = encodeURIComponent(field === "id" ? "id" : `data->>${field}`);
    if (!Array.isArray(value)) return `${col}=eq.${encodeURIComponent(value)}`;
    const quoted = value.map((v) => `"${v.replace(/["\\]/g, "\\$&")}"`).join(",");
    return `${col}=in.(${encodeURIComponent(quoted)})`;
  }

  async function select<T>(c: Collection, where?: string): Promise<T[]> {
    const out: T[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const q = `${c}?select=data&order=id${where ? `&${where}` : ""}&limit=${PAGE}&offset=${offset}`;
      const rows = (await (await req(q)).json()) as { data: T }[];
      out.push(...rows.map((r) => r.data));
      if (rows.length < PAGE) return out;
    }
  }

  return {
    list: (c) => select(c),
    async where(c, field, value) {
      if (Array.isArray(value) && value.length === 0) return [];
      return select(c, filter(field, value));
    },
    async put(c, rows) {
      if (rows.length === 0) return;
      await req(c, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      });
    },
    async remove(c, field, value) {
      if (Array.isArray(value) && value.length === 0) return 0;
      const res = await req(`${c}?select=id&${filter(field, value)}`, {
        method: "DELETE",
        headers: { Prefer: "return=representation" },
      });
      return ((await res.json()) as unknown[]).length;
    },
  };
}

// ---------------------------------------------------------------------------
// Local JSON file (development only)
// ---------------------------------------------------------------------------

type FileDb = Partial<Record<Collection, Record<string, object>>>;

const FILE = path.join(process.cwd(), "data", "store.json");
const LEGACY_FILE = path.join(process.cwd(), "data", "db.json");

/** Converts the old data/db.json layout (arrays per collection) into rows keyed by id. */
export function fromLegacy(old: Record<string, unknown>): FileDb {
  const db: FileDb = {};
  const add = (c: Collection, id: string, data: object) => ((db[c] ??= {})[id] = data);
  const arr = (k: string) => (Array.isArray(old[k]) ? (old[k] as Record<string, string>[]) : []);
  for (const [k, c] of [
    ["events", "events"],
    ["guests", "guests"],
    ["wishes", "wishes"],
    ["templates", "templates"],
    ["orders", "orders"],
    ["changeRequests", "change_requests"],
    ["music", "music"],
  ] as const) {
    for (const row of arr(k)) add(c, row.id, row);
  }
  for (const r of arr("rsvps")) add("rsvps", r.guestId ? `${r.eventId}:${r.guestId}` : randomUUID(), r);
  for (const v of arr("views")) add("views", randomUUID(), v);
  if (old.pricing) add("settings", "pricing", old.pricing as object);
  return db;
}

function seed(): FileDb {
  const eventId = "evt_demo";
  return fromLegacy({
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
  });
}

function jsonFile(): Backend {
  async function load(): Promise<FileDb> {
    try {
      return JSON.parse(await fs.readFile(FILE, "utf8")) as FileDb;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    // First run: carry over the old data/db.json if there is one, else start from the demo data.
    let db: FileDb;
    try {
      db = fromLegacy(JSON.parse(await fs.readFile(LEGACY_FILE, "utf8")));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      db = seed();
    }
    await save(db);
    return db;
  }

  async function save(db: FileDb): Promise<void> {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, FILE);
  }

  // Serialise writes so concurrent requests don't overwrite each other.
  let queue: Promise<unknown> = Promise.resolve();
  function mutate<T>(fn: (db: FileDb) => T): Promise<T> {
    const run = queue.then(async () => {
      const db = await load();
      const result = fn(db);
      await save(db);
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  const matches = (id: string, data: object, field: string, values: string[]) =>
    values.includes(field === "id" ? id : String((data as Record<string, unknown>)[field]));

  return {
    async list<T>(c: Collection) {
      return Object.values((await load())[c] ?? {}) as T[];
    },
    async where<T>(c: Collection, field: string, value: string | string[]) {
      const values = asList(value);
      return Object.entries((await load())[c] ?? {})
        .filter(([id, data]) => matches(id, data, field, values))
        .map(([, data]) => data) as T[];
    },
    put(c, rows) {
      return mutate((db) => {
        const table = (db[c] ??= {});
        for (const r of rows) table[r.id] = JSON.parse(JSON.stringify(r.data));
      });
    },
    remove(c, field, value) {
      const values = asList(value);
      return mutate((db) => {
        const table = db[c] ?? {};
        let n = 0;
        for (const [id, data] of Object.entries(table)) {
          if (matches(id, data, field, values)) {
            delete table[id];
            n++;
          }
        }
        return n;
      });
    },
  };
}

// ---------------------------------------------------------------------------

function pick(): Backend {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key) return supabase(url, key);
  if (process.env.VERCEL) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on Vercel (its filesystem is read-only).");
  }
  return jsonFile();
}

let backend: Backend | null = null;
export function db(): Backend {
  return (backend ??= pick());
}
