import { stripLang } from "./locale";

export function hasTrackableReferrer(referrer: string, host: string): boolean {
  if (!referrer) return true;
  if (!host) return false;

  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const { hostname } = new URL(`https://${host}`);
    if (url.hostname !== hostname) return true;

    // A same-site referrer from outside the public storefront can contain a private link.
    const { path } = stripLang(url.pathname);
    return /^\/(?:samples|t\/[^/]+)?\/?$/.test(path);
  } catch {
    return false;
  }
}
