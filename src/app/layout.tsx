import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { SiteLangProvider } from "@/lib/site-lang";
import type { Lang } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
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
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("naila_lang")?.value;
  const initialLang: Lang = cookieLang === "ar" ? "ar" : "en";

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
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <SiteLangProvider initialLang={initialLang}>{children}</SiteLangProvider>
      </body>
    </html>
  );
}
