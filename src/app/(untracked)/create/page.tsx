import Builder from "@/components/store/Builder";
import styles from "@/components/store/store.module.css";
import { getPricing, getTemplateMusicMap, listMusic, listTemplates } from "@/lib/store";
import type { PackageId } from "@/lib/types";
import { storefrontMetadata } from "@/lib/seo";

// One canonical /create: the ?t=, ?p=, and ?m= preselections are the same page.
export function generateMetadata() {
  return storefrontMetadata(
    "/create",
    { en: "Design Your Digital Invitation | Naila", ar: "صمّمي دعوتك الرقمية | نايلة" },
    {
      en: "Choose a design, add your names, date, venue and music, and preview your invitation for free before you pay.",
      ar: "اختاري التصميم، وأضيفي الأسماء والموعد والمكان والموسيقى، وعايني دعوتك مجانًا قبل الدفع.",
    },
  );
}
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ t?: string; p?: string; m?: string }> };

export default async function CreatePage({ searchParams }: Props) {
  const { t, p, m } = await searchParams;
  const [templates, music, templateMusicMap, pricing] = await Promise.all([
    listTemplates(),
    listMusic(),
    getTemplateMusicMap(),
    getPricing(),
  ]);

  return (
    <main className={styles.studioViewport}>
      <div className={styles.studioBgPhoto} aria-hidden="true" />
      <div className={styles.studioBgOverlay} aria-hidden="true" />
      <Builder
        pricing={pricing}
        templates={templates}
        music={music}
        templateMusicMap={templateMusicMap}
        initialTemplateId={t}
        initialPackageId={Number(p) as PackageId}
        initialMusicTrackId={m}
      />
    </main>
  );
}
