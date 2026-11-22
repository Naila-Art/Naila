import type { Metadata } from "next";
import SamplesView from "@/components/store/SamplesView";
import { siteSettings } from "@/lib/site";
import { getPricing } from "@/lib/store";

export const metadata: Metadata = {
  title: "Live Sample Suites | Naila — أمثلة حيّة",
};
export const dynamic = "force-dynamic";

/** Live sample invitation per package, bilingual EN / native Arabic. */
export default async function SamplesPage() {
  const [pricing, site] = [await getPricing(), siteSettings()];
  return <SamplesView brand={site.brand} pricing={pricing} />;
}
