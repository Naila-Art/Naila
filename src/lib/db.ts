import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

/**
 * Document storage behind src/lib/store.ts.
 *
 * Every collection is a table of `(id, data jsonb)` rows (see db/schema.sql).
 * - Production / Vercel: Postgres on Neon (DATABASE_URL, set by the Vercel Marketplace integration).
 * - Local development: a JSON file at data/store.json, unless NAILA_DB=postgres.
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
// Postgres (Neon, over HTTP — no connection pool to manage on Vercel)
// ---------------------------------------------------------------------------

const COLLECTIONS: readonly Collection[] = [
  "events", "guests", "rsvps", "wishes", "views", "templates", "orders", "change_requests", "music", "settings",
];

function postgres(url: string): Backend {
  const sql = neon(url);

  // Table and field names are interpolated (so the expression indexes are used); both are checked here.
  const table = (c: Collection) => {
    if (!COLLECTIONS.includes(c)) throw new Error(`Unknown collection: ${c}`);
    return `public.${c}`;
  };
  const column = (field: string) => {
    if (field === "id") return "id";
    if (!/^[A-Za-z]+$/.test(field)) throw new Error(`Invalid field: ${field}`);
    return `data->>'${field}'`;
  };

  return {
    async list<T>(c: Collection) {
      const rows = await sql.query(`select data from ${table(c)} order by id`);
      return rows.map((r) => r.data as T);
    },
    async where<T>(c: Collection, field: string, value: string | string[]) {
      const values = asList(value);
      if (values.length === 0) return [];
      const rows = await sql.query(`select data from ${table(c)} where ${column(field)} = any($1::text[]) order by id`, [values]);
      return rows.map((r) => r.data as T);
    },
    async put(c, rows) {
      if (rows.length === 0) return;
      await sql.query(
        `insert into ${table(c)} (id, data)
         select r->>'id', r->'data' from jsonb_array_elements($1::jsonb) r
         on conflict (id) do update set data = excluded.data`,
        [JSON.stringify(rows)],
      );
    },
    async remove(c, field, value) {
      const values = asList(value);
      if (values.length === 0) return 0;
      const rows = await sql.query(`delete from ${table(c)} where ${column(field)} = any($1::text[]) returning id`, [values]);
      return rows.length;
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
  const url = process.env.DATABASE_URL?.trim();
  // `vercel env pull` also puts DATABASE_URL in .env.local, and it is the live database, so local
  // development only uses it when asked to (NAILA_DB=postgres); otherwise it stays on the local file.
  const usePostgres = process.env.VERCEL || process.env.NAILA_DB === "postgres";
  if (usePostgres) {
    if (!url) throw new Error("DATABASE_URL must be set (Neon via the Vercel Marketplace); Vercel's filesystem is read-only.");
    return postgres(url);
  }
  return jsonFile();
}

let backend: Backend | null = null;
export function db(): Backend {
  return (backend ??= pick());
}
