/**
 * The invitation link the client picks themselves: /i/{slug}, e.g. /i/omar-salma.
 * Shared by the builder (live check while typing) and the server (final check on save).
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Words we keep for ourselves (samples, pages and anything that could look official). */
const RESERVED = new Set([
  "demo",
  "demo-en",
  "admin",
  "api",
  "order",
  "create",
  "samples",
  "request",
  "preview",
  "test",
  "new",
  "help",
  "support",
  "login",
]);

/** Turns what the client typed into link form: lower case, spaces and dots become hyphens. */
export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type SlugProblem = "slug_short" | "slug_long" | "slug_chars" | "slug_reserved";

/** Checks the shape only; whether it's free is the server's job. */
export function slugProblem(slug: string): SlugProblem | null {
  if (slug.length < SLUG_MIN) return "slug_short";
  if (slug.length > SLUG_MAX) return "slug_long";
  if (!SLUG_RE.test(slug)) return "slug_chars";
  if (RESERVED.has(slug) || slug.startsWith("sample")) return "slug_reserved";
  return null;
}

/** A ready-made suggestion from the couple's names when they're written in English letters. */
export function suggestSlug(a: string, b: string): string {
  const s = normalizeSlug(`${a} ${b}`).replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slugProblem(s) ? "" : s;
}

export const SLUG_ERRORS: Record<string, string> = {
  slug_short: `اللينك لازم يكون ${SLUG_MIN} حروف على الأقل.`,
  slug_long: `اللينك لازم يكون ${SLUG_MAX} حرف بالكتير.`,
  slug_chars: "استخدم حروف إنجليزي صغيرة وأرقام وشرطة (-) بس.",
  slug_reserved: "الكلمة دي محجوزة، اختار غيرها.",
  slug_taken: "اللينك ده محجوز لحد تاني، جرب غيره.",
};
