import LandingExperience from "@/components/landing/LandingExperience";
import { getSiteSettings, whatsappLink } from "@/lib/site";
import { getPricing, listTemplates } from "@/lib/store";
import { requestLang, siteUrl, storefrontMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return storefrontMetadata(
    "/",
    {
      en: "Naila — Digital Wedding & Engagement Invitations",
      ar: "نايلة — دعوات زفاف وخطوبة رقمية",
    },
    {
      en: "Bespoke digital wedding, engagement and katb kitab invitations with wax-seal openings, music, a personal link for every guest and live RSVP tracking.",
      ar: "دعوات رقمية فاخرة للفرح والخطوبة وكتب الكتاب: افتتاحية بختم الشمع، موسيقى، رابط باسم كل ضيف، ومتابعة الردود لحظة بلحظة.",
    },
  );
}

/** Naila Editorial Storefront — Pixel-perfect Cordially visual & motion design system. */
export default async function Home() {
  const [templates, pricing, site] = await Promise.all([listTemplates(), getPricing(), getSiteSettings()]);
  const wa = whatsappLink(site.whatsapp, "Hello! I'd love to inquire about Naila digital invitations.");
  const url = siteUrl();
  const lang = await requestLang();
  // Who we are, for search engines: the business and its website (both languages).
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${url}/#organization`, name: site.brand, url },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: site.brand,
        inLanguage: lang === "ar" ? "ar" : "en",
        publisher: { "@id": `${url}/#organization` },
      },
    ],
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
    />
    <LandingExperience
      brand={site.brand}
      templates={templates}
      pricing={pricing}
      whatsappUrl={wa || undefined}
    />
    </>
  );
}
