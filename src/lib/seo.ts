import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { LANG_HEADER, langPath } from "./locale";
import type { Lang } from "./types";

/** Public site address; also the base for canonical, hreflang and Open Graph URLs. */
export function siteUrl(): string {
  return (process.env.SITE_URL?.trim() || "https://naila.mavoid.com").replace(/\/+$/, "");
}

/** The storefront page's language, from its URL (/ar/... is Arabic). Set by src/middleware.ts. */
export async function requestLang(): Promise<Lang> {
  return (await headers()).get(LANG_HEADER) === "ar" ? "ar" : "en";
}

export type Bilingual = Record<Lang, string>;

/** Share image for the storefront (public/og.jpg, 1200×630). */
const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630 };

/**
 * Metadata for a storefront page that exists in English at `path` and in Arabic at /ar`path`:
 * title, description, canonical, hreflang alternates and a share preview.
 */
export async function storefrontMetadata(
  path: string,
  title: Bilingual,
  description: Bilingual,
  opts: { noindex?: boolean } = {},
): Promise<Metadata> {
  const lang = await requestLang();
  const canonical = langPath(lang, path);
  return {
    title: title[lang],
    description: description[lang],
    alternates: {
      canonical,
      languages: { en: path, ar: langPath("ar", path), "x-default": path },
    },
    openGraph: {
      type: "website",
      siteName: "Naila",
      url: canonical,
      title: title[lang],
      description: description[lang],
      locale: lang === "ar" ? "ar_EG" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar_EG",
      images: [{ ...OG_IMAGE, alt: title[lang] }],
    },
    twitter: { card: "summary_large_image", title: title[lang], description: description[lang], images: [OG_IMAGE.url] },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
