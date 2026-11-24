import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, LANG_HEADER, isStorefrontPath, langPath, stripLang } from "@/lib/locale";

/**
 * Serves the Arabic storefront at /ar/... from the same pages as English, and tells the
 * pages which language to render through the LANG_HEADER request header.
 */
export function middleware(req: NextRequest) {
  const { lang, path } = stripLang(req.nextUrl.pathname);
  if (!isStorefrontPath(path)) return NextResponse.next(); // /ar/anything-else falls through to a 404

  // A visitor who chose Arabic with the language switch gets the Arabic URL. Crawlers send no
  // cookie, so they always see the English page at the English URL.
  if (lang === "en" && req.cookies.get(LANG_COOKIE)?.value === "ar") {
    const url = req.nextUrl.clone();
    url.pathname = langPath("ar", path);
    return NextResponse.redirect(url, 307);
  }

  const headers = new Headers(req.headers);
  headers.set(LANG_HEADER, lang);
  if (lang === "en") return NextResponse.next({ request: { headers } });

  const url = req.nextUrl.clone();
  url.pathname = path;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Pages only: skip API routes, Next.js assets and any file with an extension.
  matcher: ["/((?!api/|_next/|media/|.*\\.).*)"],
};
