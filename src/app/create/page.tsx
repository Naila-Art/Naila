import type { Metadata } from "next";
import Link from "next/link";
import Builder from "@/components/store/Builder";
import styles from "@/components/store/store.module.css";
import { siteSettings } from "@/lib/site";
import { getPricing, listMusic, listTemplates } from "@/lib/store";
import type { PackageId } from "@/lib/types";

export const metadata: Metadata = { title: "اعمل دعوتك" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ t?: string; p?: string }> };

export default async function CreatePage({ searchParams }: Props) {
  const { t, p } = await searchParams;
  const [templates, music, pricing] = await Promise.all([listTemplates(), listMusic(), getPricing()]);
  const site = siteSettings();
  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <div className={styles.narrow}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}>
            {site.brand}
          </Link>
        </nav>
        <h1 className={styles.pageTitle}>اعمل دعوتك</h1>
        <p className={styles.sectionLead}>هتشوف الدعوة كاملة قبل ما تدفع</p>
        <Builder pricing={pricing} templates={templates} music={music} initialTemplateId={t} initialPackageId={Number(p) as PackageId} />
      </div>
    </main>
  );
}
