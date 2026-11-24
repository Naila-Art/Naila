import type { Lang } from "./types";

/**
 * Language in the URL for the public storefront pages.
 * English lives at /, /samples, /create, /request, /t/{id}; Arabic at the same paths under /ar.
 * Invitations (/i), client pages (/c) and the admin keep their own language handling.
 */

/** Request header set by src/middleware.ts with the page's language. */
export const LANG_HEADER = "x-naila-lang";

/** Cookie remembering the visitor's explicit language choice. */
export const LANG_COOKIE = "naila_lang";

const STOREFRONT = /^\/(?:samples|create|request|t\/[^/]+)?\/?$/;

/** True for storefront paths (without the /ar prefix). */
export function isStorefrontPath(path: string): boolean {
  return STOREFRONT.test(path);
}

/** Splits "/ar/create" into { lang: "ar", path: "/create" }. */
export function stripLang(pathname: string): { lang: Lang; path: string } {
  if (pathname === "/ar" || pathname.startsWith("/ar/")) return { lang: "ar", path: pathname.slice(3) || "/" };
  return { lang: "en", path: pathname };
}

/** "/create" -> "/ar/create" for Arabic, unchanged for English. */
export function langPath(lang: Lang, path: string): string {
  if (lang !== "ar") return path;
  return path === "/" ? "/ar" : `/ar${path}`;
}

/** Localizes an internal storefront link ("/create?t=x", "/#faq"); other hrefs pass through. */
export function localeHref(lang: Lang, href: string): string {
  if (lang !== "ar" || !href.startsWith("/")) return href;
  const [, rawPath, rest] = href.match(/^([^?#]*)(.*)$/)!;
  const path = rawPath || "/";
  if (stripLang(path).lang === "ar" || !isStorefrontPath(path)) return href;
  return langPath("ar", path) + rest;
}
