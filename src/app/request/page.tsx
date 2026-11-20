import type { Metadata } from "next";
import Link from "next/link";
import RequestForm from "@/components/store/RequestForm";
import styles from "@/components/store/store.module.css";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPackage } from "@/lib/pricing";
import { getPricing } from "@/lib/store";

export const metadata: Metadata = { title: "اطلب دعوة خاصة" };

type Props = { searchParams: Promise<{ p?: string }> };

export default async function RequestPage({ searchParams }: Props) {
  const pricing = await getPricing();
  const wanted = (await searchParams).p === "4" ? 4 : 3;
  // If the asked-for package is off sale, fall back to the other custom one.
  const pkg = [wanted, wanted === 4 ? 3 : 4].map((id) => getPackage(pricing, id)).find((p) => p?.active);
  const site = siteSettings();
  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <div className={styles.narrow}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}>
            {site.brand}
          </Link>
        </nav>
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
