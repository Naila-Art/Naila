import type { Metadata } from "next";
import Link from "next/link";
import RequestForm from "@/components/store/RequestForm";
import styles from "@/components/store/store.module.css";
import { siteSettings, whatsappLink } from "@/lib/site";
import type { PackageId } from "@/lib/types";

export const metadata: Metadata = { title: "اطلب دعوة خاصة" };

type Props = { searchParams: Promise<{ p?: string }> };

export default async function RequestPage({ searchParams }: Props) {
  const packageId = ((await searchParams).p === "4" ? 4 : 3) as PackageId;
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
        <RequestForm packageId={packageId} whatsappUrl={whatsappLink(site.whatsapp, "أهلاً، عايز دعوة متصممة مخصوص")} />
      </div>
    </main>
  );
}
