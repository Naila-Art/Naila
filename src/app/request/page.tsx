import type { Metadata } from "next";
import Link from "next/link";
import RequestForm from "@/components/store/RequestForm";
import styles from "@/components/store/store.module.css";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPackage } from "@/lib/pricing";
import { getPricing } from "@/lib/store";

export const metadata: Metadata = {
  title: "Commission a Bespoke Suite | Naila",
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ p?: string }> };

export default async function RequestPage({ searchParams }: Props) {
  const pricing = await getPricing();
  const wanted = (await searchParams).p === "4" ? 4 : 3;
  const pkg = [wanted, wanted === 4 ? 3 : 4]
    .map((id) => getPackage(pricing, id))
    .find((p) => p?.active);
  const site = siteSettings();
  const wa = whatsappLink(
    site.whatsapp,
    "Hello! I'd like to commission a bespoke digital invitation suite."
  );

  return (
    <main className={styles.studioViewport}>
      <div className={styles.studioBgPhoto} aria-hidden="true" />
      <div className={styles.studioBgOverlay} aria-hidden="true" />
      {pkg ? (
        <RequestForm pkg={pkg} whatsappUrl={wa} />
      ) : (
        <div className={styles.studioCard} style={{ maxWidth: "36rem" }}>
          <h1 className={styles.studioTitle}>Bespoke suites unavailable</h1>
          <p className={styles.studioSubtitle}>
            Custom tiers are currently paused. Reach out on WhatsApp or start with one of our ready editorial suites.
          </p>
          <div className={styles.studioFooterRow}>
            <Link href="/" className={styles.ctaGhost}>
              Return home
            </Link>
            <Link href="/create" className={styles.cta}>
              Create invitation
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
