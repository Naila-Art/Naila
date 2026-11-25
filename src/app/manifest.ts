import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naila — Editorial Digital Invitations",
    short_name: "Naila",
    description:
      "Bespoke digital wedding, engagement, and katb kitab invitations with wax-seal openings, music, named guest links, and instant RSVP tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcf6ea",
    theme_color: "#120d10",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
