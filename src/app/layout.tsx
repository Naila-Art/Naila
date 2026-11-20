import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Invitations",
  description: "Digital wedding, engagement and katb kitab invitations",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar">
      <head>
        {/* Loaded at runtime (not next/font) so builds don't depend on reaching Google Fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Cormorant+Garamond:wght@400;500&family=Tajawal:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
