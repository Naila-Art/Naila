// Copies the local data (data/store.json, or the older data/db.json) into Supabase.
// Run supabase/schema.sql first, then:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-supabase.mjs
// (or: node --env-file=.env.local scripts/migrate-to-supabase.mjs)
// Rows are upserted by id, so running it twice is safe.

import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

/** Same conversion as fromLegacy() in src/lib/db.ts. */
function fromLegacy(old) {
  const db = {};
  const add = (c, id, data) => ((db[c] ??= {})[id] = data);
  const arr = (k) => (Array.isArray(old[k]) ? old[k] : []);
  for (const [k, c] of [
    ["events", "events"],
    ["guests", "guests"],
    ["wishes", "wishes"],
    ["templates", "templates"],
    ["orders", "orders"],
    ["changeRequests", "change_requests"],
    ["music", "music"],
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

const { file, db } = await load();
console.log(`Reading ${file}`);

// Parents before children isn't required (no foreign keys), but keeps the log readable.
for (const [table, rows] of Object.entries(db)) {
  const list = Object.entries(rows).map(([id, data]) => ({ id, data }));
  for (let i = 0; i < list.length; i += 500) {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(list.slice(i, i + 500)),
    });
    if (!res.ok) {
      console.error(`${table}: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
  }
  console.log(`${table}: ${list.length}`);
}
console.log("Done.");
