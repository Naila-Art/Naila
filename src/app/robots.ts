import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * Private pages (invitations, client pages) stay crawlable so search engines can read their
 * noindex tag; only the API and the admin dashboard are blocked.
 */
export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
