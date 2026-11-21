/** Package 3+: the optional link to the client's files (e.g. Google Drive). */
const LINK = /^https?:\/\/\S{3,}$/i;

export function parseBriefLink(raw: unknown): { ok: true; link?: string } | { ok: false } {
  if (raw === undefined || raw === null || raw === "") return { ok: true };
  const link = typeof raw === "string" ? raw.trim() : "";
  if (!link) return { ok: true };
  return link.length <= 500 && LINK.test(link) ? { ok: true, link } : { ok: false };
}
