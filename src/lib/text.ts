import type { Guest } from "./types";

/** Fills {title}/{name} (or {اللقب}/{الاسم}) and tidies the spaces left by an empty title. */
export function fillPersonalText(template: string, guest: Pick<Guest, "title" | "name">): string {
  const title = guest.title?.trim() ?? "";
  return template
    .replace(/\{(title|اللقب)\}/g, title)
    .replace(/\{(name|الاسم)\}/g, guest.name.trim())
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Guest name with title, e.g. "أستاذ محمود". */
export function displayName(guest: Pick<Guest, "title" | "name">): string {
  return [guest.title?.trim(), guest.name.trim()].filter(Boolean).join(" ");
}

/**
 * Arabic-Indic digits for prices. The Arabic thousands separator (٬) sits high in our Arabic
 * font and looks like a stray mark, so 4-digit numbers are left ungrouped (١٠٠٠) and larger
 * ones are grouped with a thin space (١٠ ٠٠٠).
 */
export function formatArabicNumber(n: number): string {
  if (Math.abs(n) < 10_000) return n.toLocaleString("ar-EG", { useGrouping: false });
  return n.toLocaleString("ar-EG").replace(/٬/g, " ");
}
