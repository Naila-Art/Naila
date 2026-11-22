import LandingExperience from "@/components/landing/LandingExperience";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPricing, listTemplates } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Naila Editorial Storefront — Pixel-perfect Cordially visual & motion design system. */
export default async function Home() {
  const [templates, pricing] = await Promise.all([
    listTemplates(),
    getPricing(),
  ]);
  const site = siteSettings();
  const wa = whatsappLink(site.whatsapp, "Hello! I'd love to inquire about Naila digital invitations.");

  return (
    <LandingExperience
      brand={site.brand}
      templates={templates}
      pricing={pricing}
      whatsappUrl={wa || undefined}
    />
  );
}
