import Link from "next/link";
import styles from "@/components/store/store.module.css";
import TemplateGallery from "@/components/store/TemplateGallery";
import {
  ADDON_LABELS,
  NAMES_TIER_IDS,
  anyAddonEnabled,
  formatEgp,
  isSelfServe,
} from "@/lib/pricing";
import { siteSettings, whatsappLink } from "@/lib/site";
import { getPricing, listTemplates } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Storefront home: what it is, templates, packages. */
export default async function Home() {
  const [templates, pricing] = await Promise.all([
    listTemplates(),
    getPricing(),
  ]);
  const site = siteSettings();
  const showcase = templates.find((t) => t.videoUrl);
  const wa = whatsappLink(site.whatsapp, "أهلاً، عايز أستفسر عن الدعوات");

  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}>
            {site.brand}
          </Link>
          <div className={styles.navLinks}>
            <a href="#templates">التصميمات</a>
            <a href="#packages">الأسعار</a>
          </div>
        </nav>

        <section className={styles.hero}>
          <div>
            <h1>دعوة فرحك على الموبايل، تتفتح بختم وتوصل لكل حد باسمه</h1>
            <p className={styles.lead}>
              لينك واحد يتبعت على واتساب: المعزوم يدوس على الختم، الدعوة تتفتح
              بأنيميشن ومزيكا، يأكد حضوره، يبعت تهنئة، ويلاقي اللوكيشن. وأنت
              تتابع مين فتح ومين أكد من صفحتك.
            </p>
            <div className={styles.ctaRow}>
              <Link className={styles.cta} href="/create">
                اعمل دعوتك
              </Link>
              <a className={styles.ctaGhost} href="#templates">
                شوف التصميمات
              </a>
            </div>
          </div>
          <div className={styles.heroPhone} aria-hidden>
            {showcase?.videoUrl ? (
              <video
                src={showcase.videoUrl}
                poster={showcase.posterUrl}
                muted
                autoPlay
                loop
                playsInline
              />
            ) : (
              <span className={styles.heroSeal} />
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2>بتمشي إزاي؟</h2>
          <p className={styles.sectionLead}>من غير حساب ولا باسورد</p>
          <ol className={styles.steps}>
            <li>
              <strong>اختار التصميم</strong>
              <span>فرح، خطوبة، أو كتب كتاب</span>
            </li>
            <li>
              <strong>اكتب البيانات وشوف دعوتك</strong>
              <span>الأسامي والتاريخ والمكان، وتشوفها قبل ما تدفع</span>
            </li>
            <li>
              <strong>ادفع وابعت</strong>
              <span>فيزا أو إنستاباي، وبعدها تبعت اللينكات على واتساب</span>
            </li>
          </ol>
        </section>

        <section className={styles.section} id="templates">
          <h2>التصميمات</h2>
          <p className={styles.sectionLead}>
            دوس على أي تصميم تشوفه زي ما المعزوم هيشوفه
          </p>
          <TemplateGallery templates={templates} />
        </section>

        <section className={styles.section} id="packages">
          <h2>الباقات</h2>
          <p className={styles.sectionLead}>سعر واحد، من غير اشتراك</p>
          <div className={styles.packageGrid}>
            {pricing.packages
              .filter((p) => p.active)
              .map((p) => (
                <div
                  key={p.id}
                  className={styles.packageBox}
                  data-featured={p.id === 2}
                >
                  <h3>{p.name}</h3>
                  <div className={styles.price}>
                    {p.priceNote && <small>{p.priceNote}</small>}
                    {formatEgp(p.price)}
                  </div>
                  <ul>
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  {isSelfServe(p.id) ? (
                    <Link className={styles.cta} href={`/create?p=${p.id}`}>
                      ابدأ
                    </Link>
                  ) : (
                    <Link
                      className={styles.ctaGhost}
                      href={`/request?p=${p.id}`}
                    >
                      اطلبها
                    </Link>
                  )}
                </div>
              ))}
          </div>

          {anyAddonEnabled(pricing) && (
            <div className={styles.addonList}>
              <h3>إضافات على أي باقة</h3>
              <ul>
                {pricing.addonsEnabled.arabic && (
                  <li>
                    <span>{ADDON_LABELS.arabic}</span>
                    <span>+{pricing.addons.arabic}</span>
                  </li>
                )}
                {pricing.addonsEnabled.maps && (
                  <li>
                    <span>{ADDON_LABELS.maps}</span>
                    <span>+{pricing.addons.maps}</span>
                  </li>
                )}
                {pricing.addonsEnabled.customMusic && (
                  <li>
                    <span>{ADDON_LABELS.customMusic}</span>
                    <span>+{pricing.addons.customMusic}</span>
                  </li>
                )}
                {pricing.addonsEnabled.names &&
                  NAMES_TIER_IDS.map((id) => pricing.namesTiers[id]).map(
                    (tier) => (
                      <li key={tier.label}>
                        <span>
                          {ADDON_LABELS.names} ({tier.label})
                        </span>
                        <span>+{tier.price}</span>
                      </li>
                    ),
                  )}
              </ul>
            </div>
          )}
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          © {site.brand}
          {wa && (
            <>
              {" · "}
              <a href={wa}>كلمنا على واتساب</a>
            </>
          )}
        </div>
      </footer>

      {wa && (
        <a
          className={styles.whatsappFab}
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="كلمنا على واتساب"
        >
          ✆
        </a>
      )}
    </main>
  );
}
