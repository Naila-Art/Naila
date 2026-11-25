import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, LANG_HEADER } from "@/lib/locale";
import { siteUrl } from "@/lib/seo";
import { SiteLangProvider } from "@/lib/site-lang";
import type { Lang } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "Naila",
  title: "Naila — Editorial Digital Invitations | نايلة للدعوات الرقمية",
  description:
    "Bespoke digital wedding, engagement, and katb kitab invitations with wax-seal openings, music, named guest links, and instant RSVP tracking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120d10",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Storefront pages get their language from the URL (src/middleware.ts); other pages keep the visitor's choice.
  const urlLang = (await headers()).get(LANG_HEADER);
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value;
  const initialLang: Lang = urlLang === "ar" || urlLang === "en" ? urlLang : cookieLang === "ar" ? "ar" : "en";

  return (
    <html lang={initialLang}>
      <head>
        <link
          rel="preload"
          href="/fonts/libre-caslon-condensed/LibreCaslonCondensed-Italic-Latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/libre-caslon-condensed/LibreCaslonCondensed-Regular-Latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap"
        />
      </head>
      <body>
        <SiteLangProvider initialLang={initialLang}>{children}</SiteLangProvider>
      </body>
    </html>
  );
}
