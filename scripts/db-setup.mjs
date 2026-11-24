// Creates the tables in Postgres (db/schema.sql) and, with --import-local, copies the local
// development data (data/store.json, or the older data/db.json) into it.
//   node --env-file=.env.local scripts/db-setup.mjs [--import-local]
// Safe to run more than once: the schema uses "if not exists" and rows are upserted by id.

import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL (vercel env pull puts it in .env.local).");
  process.exit(1);
}
const sql = neon(url);

// The HTTP driver runs one statement per call; split the schema on top-level semicolons
// (the do-block is kept whole by its $$ quoting).
const schema = await readFile("db/schema.sql", "utf8");
const statements = [];
let current = "";
let inDollar = false;
for (const line of schema.split("\n")) {
  if (line.trim().startsWith("--")) continue;
  current += line + "\n";
  if ((line.match(/\$\$/g) ?? []).length % 2 === 1) inDollar = !inDollar;
  if (!inDollar && line.trim().endsWith(";")) {
    statements.push(current.trim());
    current = "";
  }
}
for (const s of statements) await sql.query(s);
console.log(`Schema applied (${statements.length} statements).`);

if (!process.argv.includes("--import-local")) process.exit(0);

/** Same conversion as fromLegacy() in src/lib/db.ts. */
function fromLegacy(old) {
  const db = {};
  const add = (c, id, data) => ((db[c] ??= {})[id] = data);
  const arr = (k) => (Array.isArray(old[k]) ? old[k] : []);
  for (const [k, c] of [
    ["events", "events"], ["guests", "guests"], ["wishes", "wishes"], ["templates", "templates"],
    ["orders", "orders"], ["changeRequests", "change_requests"], ["music", "music"],
  ]) {
    for (const row of arr(k)) add(c, row.id, row);
  }
  for (const r of arr("rsvps")) add("rsvps", r.guestId ? `${r.eventId}:${r.guestId}` : randomUUID(), r);
  for (const v of arr("views")) add("views", randomUUID(), v);
  if (old.pricing) add("settings", "pricing", old.pricing);
  return db;
}

async function load() {
  try {
    return { file: "data/store.json", db: JSON.parse(await readFile("data/store.json", "utf8")) };
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  return { file: "data/db.json", db: fromLegacy(JSON.parse(await readFile("data/db.json", "utf8"))) };
}

const TABLES = new Set(["events", "guests", "rsvps", "wishes", "views", "templates", "orders", "change_requests", "music", "settings"]);
const { file, db } = await load();
console.log(`Importing ${file}`);
for (const [table, rows] of Object.entries(db)) {
  if (!TABLES.has(table)) continue;
  const list = Object.entries(rows).map(([id, data]) => ({ id, data }));
  if (list.length === 0) continue;
  await sql.query(
    `insert into public.${table} (id, data)
     select r->>'id', r->'data' from jsonb_array_elements($1::jsonb) r
     on conflict (id) do update set data = excluded.data`,
    [JSON.stringify(list)],
  );
  console.log(`${table}: ${list.length}`);
}
