import type { Metadata } from "next";
import RequestForm from "@/components/store/RequestForm";
import styles from "@/components/store/store.module.css";
import SiteHeader from "@/components/store/SiteHeader";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPackage } from "@/lib/pricing";
import { getPricing } from "@/lib/store";

export const metadata: Metadata = { title: "اطلب دعوة خاصة" };

type Props = { searchParams: Promise<{ p?: string }> };

export default async function RequestPage({ searchParams }: Props) {
  const pricing = await getPricing();
  await searchParams;
  // Only the open-ended package is a request now; packages 1-3 are ordered from /create.
  const pkg = [getPackage(pricing, 4)].find((p) => p?.active);
  const site = siteSettings();
  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <SiteHeader brand={site.brand} whatsappUrl={whatsappLink(site.whatsapp, "أهلاً، عايز أستفسر عن الدعوات") || undefined} />
      <div className={styles.narrow}>
        <h1 className={styles.pageTitle}>دعوة متصممة مخصوص ليك</h1>
        <p className={styles.sectionLead}>سيب بياناتك وفريقنا هيكلمك على واتساب</p>
        {pkg ? (
          <RequestForm pkg={pkg} whatsappUrl={whatsappLink(site.whatsapp, "أهلاً، عايز دعوة متصممة مخصوص")} />
        ) : (
          <p className={styles.sectionLead}>الباقات دي مش متاحة دلوقتي. كلمنا على واتساب.</p>
        )}
      </div>
    </main>
  );
}
