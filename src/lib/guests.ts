import type { GuestInput } from "./types";

/** Shared by the browser (import preview) and the server (final validation). */

export const MAX_TITLE = 30;
export const MAX_GUEST_NAME = 80;
/** Personal note shown on one guest's invitation. */
export const MAX_GUEST_MESSAGE = 300;
export const MAX_GUESTS_PER_IMPORT = 2000;

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

function toLatinDigits(s: string): string {
  return s.replace(ARABIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * Normalises a phone number to international form (+20… for Egypt).
 * Handles what Excel does to numbers: 01001234567 typed in a number cell becomes 1001234567.
 * Returns null when it doesn't look like a phone number at all.
 */
export function normalizePhone(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  let s = toLatinDigits(String(raw)).trim();
  const plus = s.startsWith("+") || s.startsWith("00");
  s = s.replace(/\D/g, "");
  if (s.startsWith("00")) s = s.slice(2);
  if (/^01\d{9}$/.test(s)) s = `20${s.slice(1)}`; // 01xxxxxxxxx (or +01xxxxxxxxx) → 201xxxxxxxxx
  else if (!plus && /^1\d{9}$/.test(s)) s = `20${s}`; // leading 0 lost in Excel
  // No country code starts with 0, and an Egyptian mobile is always 20 + 1x + 8 digits;
  // anything else opens WhatsApp without a chat.
  if (s.startsWith("0")) return null;
  if (s.startsWith("20") && !/^201[0125]\d{8}$/.test(s)) return null;
  return /^\d{8,15}$/.test(s) ? `+${s}` : null;
}

export interface ParsedGuest extends GuestInput {
  /** Row number in the sheet (1-based, as Excel shows it). */
  row: number;
  error?: "name_missing" | "name_too_long" | "title_too_long" | "phone_invalid" | "message_too_long";
  duplicate?: boolean;
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return "";
  return String(v).replace(/\s+/g, " ").trim();
}

/** Like cell() but keeps line breaks, for the personal message. */
function multiline(v: unknown): string {
  if (v === null || v === undefined || v instanceof Date) return "";
  return String(v)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateGuest(
  input: { title?: unknown; name?: unknown; phone?: unknown; message?: unknown },
  row = 0,
): ParsedGuest {
  const title = cell(input.title);
  const name = cell(input.name);
  const phoneRaw = cell(input.phone);
  const phone = phoneRaw ? normalizePhone(input.phone) : null;
  const message = multiline(input.message);
  const guest: ParsedGuest = { row, title: title || undefined, name, phone: phone ?? undefined, message: message || undefined };
  if (!name) guest.error = "name_missing";
  else if (name.length > MAX_GUEST_NAME) guest.error = "name_too_long";
  else if (title.length > MAX_TITLE) guest.error = "title_too_long";
  else if (phoneRaw && !phone) guest.error = "phone_invalid";
  else if (message.length > MAX_GUEST_MESSAGE) guest.error = "message_too_long";
  return guest;
}

const HEADERS: Record<"title" | "name" | "phone" | "message", RegExp> = {
  title: /^(title|اللقب|لقب|الصفة)$/i,
  name: /^(name|full ?name|الاسم|اسم|الإسم)$/i,
  phone: /^(phone|mobile|whatsapp|number|رقم|الرقم|الموبايل|موبايل|التليفون|تليفون|الهاتف|واتساب|رقم الموبايل|رقم التليفون|رقم الهاتف)$/i,
  message: /^(message|note|personal message|رسالة|الرسالة|رسالة خاصة|الرسالة الخاصة|ملاحظة)$/i,
};

/**
 * Turns spreadsheet rows into guests. Columns are found by header (Arabic or English).
 * Without a recognised header row: 4 columns = title, name, phone, message; 3 = title, name, phone;
 * 2 = name, phone; 1 = name.
 */
export function parseSheet(rows: unknown[][]): ParsedGuest[] {
  const nonEmpty = rows.filter((r) => r.some((c) => cell(c) !== ""));
  if (nonEmpty.length === 0) return [];

  const header = nonEmpty[0].map(cell);
  const col = { title: -1, name: -1, phone: -1, message: -1 };
  header.forEach((h, i) => {
    for (const key of Object.keys(HEADERS) as (keyof typeof HEADERS)[]) {
      if (col[key] === -1 && HEADERS[key].test(h)) col[key] = i;
    }
  });

  let dataRows = nonEmpty;
  if (col.name !== -1) {
    dataRows = nonEmpty.slice(1);
  } else {
    const width = Math.max(...nonEmpty.map((r) => r.length));
    if (width >= 4) Object.assign(col, { title: 0, name: 1, phone: 2, message: 3 });
    else if (width === 3) Object.assign(col, { title: 0, name: 1, phone: 2 });
    else if (width === 2) Object.assign(col, { name: 0, phone: 1 });
    else col.name = 0;
  }

  const seen = new Set<string>();
  return dataRows.map((r) => {
    const g = validateGuest(
      {
        title: col.title >= 0 ? r[col.title] : "",
        name: r[col.name],
        phone: col.phone >= 0 ? r[col.phone] : "",
        message: col.message >= 0 ? r[col.message] : "",
      },
      rows.indexOf(r) + 1,
    );
    const key = guestKey(g);
    if (!g.error && seen.has(key)) g.duplicate = true;
    seen.add(key);
    return g;
  });
}

/**
 * Two rows are the same guest only if title, name and phone all match.
 * (A shared phone alone isn't a duplicate: a husband and wife may share one number.)
 */
export function guestKey(g: GuestInput): string {
  return `${(g.title ?? "").trim()}|${g.name.trim()}|${g.phone ?? ""}`.toLowerCase();
}

/** Minimal CSV parser (quotes, commas, semicolons, newlines) for .csv uploads. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** CSV with a BOM so Excel opens Arabic correctly. */
export function toCsv(rows: (string | undefined)[][]): string {
  const esc = (v: string | undefined) => {
    const s = v ?? "";
    // Leading =,+,-,@ would be run as a formula in Excel — prefix with a quote.
    const safe = /^[=+\-@]/.test(s) && !/^\+\d+$/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
