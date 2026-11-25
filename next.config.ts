import type { NextConfig } from "next";

/**
 * Next.js streams page metadata (title, canonical, hreflang) into <body> when it's slow to compute,
 * except for the crawlers listed here, which always get it in <head>. Next's default list leaves out
 * Googlebot (it runs JavaScript), but Google ignores canonical and hreflang tags outside <head>, so
 * Googlebot is added to Next's own default list.
 */
const HTML_LIMITED_BOTS =
  /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|meta-externalagent|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Pinterest|SkypeUriPreview|Yeti|googleweblight/i;

/** Media in public/: cached a day, then refreshed in the background, so repeat visits skip the download. */
const MEDIA_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  // Lets a production build run next to `next dev` (e.g. NEXT_DIST_DIR=.next-prod) without clobbering it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  htmlLimitedBots: HTML_LIMITED_BOTS,
  async headers() {
    return [
      {
        source: "/:dir(assets|templates|videos|showcase|hero|icons|music)/:path*",
        headers: [{ key: "Cache-Control", value: MEDIA_CACHE }],
      },
      { source: "/og.jpg", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      { source: "/logo.png", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      { source: "/apple-touch-icon.png", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      {
        // Font files never change under the same name.
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
