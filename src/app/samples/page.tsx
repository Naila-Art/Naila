import SamplesView from "@/components/store/SamplesView";
import { siteSettings } from "@/lib/site";
import { getPricing } from "@/lib/store";
import { storefrontMetadata } from "@/lib/seo";

export function generateMetadata() {
  return storefrontMetadata(
    "/samples",
    { en: "Live Sample Invitations | Naila", ar: "أمثلة دعوات حيّة | نايلة" },
    {
      en: "Open real Naila invitations for every package: the wax-seal opening, music, RSVP and wishes, exactly as your guests will see them.",
      ar: "افتحي دعوات نايلة الحقيقية لكل باقة: افتتاحية ختم الشمع والموسيقى وتأكيد الحضور والتهاني، تمامًا كما سيراها ضيوفك.",
    },
  );
}
export const dynamic = "force-dynamic";

/** Live sample invitation per package, bilingual EN / native Arabic. */
export default async function SamplesPage() {
  const [pricing, site] = [await getPricing(), siteSettings()];
  return <SamplesView brand={site.brand} pricing={pricing} />;
}
