import type { Metadata } from "next";
import Builder from "@/components/store/Builder";
import styles from "@/components/store/store.module.css";
import { getPricing, listMusic, listTemplates } from "@/lib/store";
import type { PackageId } from "@/lib/types";

export const metadata: Metadata = {
  title: "Create Your Invitation | Naila",
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ t?: string; p?: string }> };

export default async function CreatePage({ searchParams }: Props) {
  const { t, p } = await searchParams;
  const [templates, music, pricing] = await Promise.all([
    listTemplates(),
    listMusic(),
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
        initialTemplateId={t}
        initialPackageId={Number(p) as PackageId}
      />
    </main>
  );
}
