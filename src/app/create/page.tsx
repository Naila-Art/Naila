import type { Metadata } from "next";
import Builder from "@/components/store/Builder";
import styles from "@/components/store/store.module.css";
import SiteHeader from "@/components/store/SiteHeader";
import { getSiteSettings, whatsappLink } from "@/lib/site";
import { getPricing, listMusic, listTemplates } from "@/lib/store";
import type { PackageId } from "@/lib/types";

export const metadata: Metadata = { title: "اعمل دعوتك" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ t?: string; p?: string }> };

export default async function CreatePage({ searchParams }: Props) {
  const { t, p } = await searchParams;
  const [templates, music, pricing] = await Promise.all([listTemplates(), listMusic(), getPricing()]);
  const site = await getSiteSettings();
  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <SiteHeader brand={site.brand} whatsappUrl={whatsappLink(site.whatsapp, "أهلاً، عايز أستفسر عن الدعوات") || undefined} />
      <div className={styles.narrow}>
        <h1 className={styles.pageTitle}>اعمل دعوتك</h1>
        <p className={styles.sectionLead}>هتشوف الدعوة كاملة قبل ما تدفع</p>
        <Builder pricing={pricing} templates={templates} music={music} initialTemplateId={t} initialPackageId={Number(p) as PackageId} />
      </div>
    </main>
  );
}
