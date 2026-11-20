import type { Metadata } from "next";
import styles from "@/components/store/store.module.css";
import SiteHeader from "@/components/store/SiteHeader";
import { INCLUDED_IN_ALL, formatEgp } from "@/lib/pricing";
import { SAMPLES, sampleLink } from "@/lib/samples";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPricing } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "أمثلة لكل باقة" };
export const dynamic = "force-dynamic";

/** One live sample invitation per package, to show clients and partners. */
export default async function SamplesPage() {
  const [pricing, site] = [await getPricing(), siteSettings()];
  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <SiteHeader brand={site.brand} whatsappUrl={whatsappLink(site.whatsapp, "أهلاً، عايز أستفسر عن الدعوات") || undefined} />
      <div className={styles.narrow}>
        <h1 className={styles.pageTitle}>شوف كل باقة شكلها إيه</h1>
        <p className={styles.sectionLead}>افتح أي دعوة على الموبايل ودوس على الختم، زي ما الضيف هيشوفها بالظبط</p>

        <ul className={styles.sampleGrid}>
          {SAMPLES.map((s) => {
            const pkg = pricing.packages.find((p) => p.id === s.packageId)!;
            return (
              <li key={s.slug} className={styles.sampleCard}>
                <h2>
                  باقة {pkg.name} · {pkg.priceNote ? `${pkg.priceNote} ` : ""}
                  {formatEgp(pkg.price)}
                </h2>
                <p className={styles.hint}>
                  مثال {CATEGORY_LABELS[s.category]}: {s.event.partnerA} و {s.event.partnerB}
                  {s.guest && ` · دعوة باسم ${s.guest.title} ${s.guest.name} ومعاها رسالة خاصة ليه`}
                </p>
                <ul className={styles.hint}>
                  {pkg.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                <a className={styles.cta} href={sampleLink(s.packageId)} target="_blank" rel="noopener noreferrer">
                  افتح الدعوة
                </a>
              </li>
            );
          })}
        </ul>
        <p className={styles.includedAll}>في كل الباقات: {INCLUDED_IN_ALL.join(" · ")}</p>
      </div>
    </main>
  );
}
