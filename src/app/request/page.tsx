import Link from "next/link";
import RequestForm from "@/components/store/RequestForm";
import styles from "@/components/store/store.module.css";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPackage } from "@/lib/pricing";
import { getPricing } from "@/lib/store";
import { localeHref } from "@/lib/locale";
import { requestLang, storefrontMetadata } from "@/lib/seo";
import type { Pricing } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ p?: string }> };

/** The bespoke package to show: the one asked for (?p=4), else the other one, if active. */
function bespokePackage(pricing: Pricing, p?: string) {
  const wanted = p === "4" ? 4 : 3;
  return [wanted, wanted === 4 ? 3 : 4].map((id) => getPackage(pricing, id)).find((x) => x?.active);
}

export async function generateMetadata({ searchParams }: Props) {
  const available = Boolean(bespokePackage(await getPricing(), (await searchParams).p));
  return storefrontMetadata(
    "/request",
    { en: "Bespoke Invitation Suite | Naila", ar: "تصميم دعوة حصري | نايلة" },
    {
      en: "Commission a fully custom invitation suite: a personal message for every guest, your own music and a design made for your wedding.",
      ar: "اطلبي دعوة مصمّمة خصيصًا لكِ: رسالة شخصية لكل ضيف، وموسيقاكِ الخاصة، وتصميم مخصّص لفرحك.",
    },
    // While bespoke suites are paused the page is only a notice: keep it out of search results.
    { noindex: !available },
  );
}

export default async function RequestPage({ searchParams }: Props) {
  const pricing = await getPricing();
  const pkg = bespokePackage(pricing, (await searchParams).p);
  const lang = await requestLang();
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
            <Link href={localeHref(lang, "/")} className={styles.ctaGhost}>
              Return home
            </Link>
            <Link href={localeHref(lang, "/create")} className={styles.cta}>
              Create invitation
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
