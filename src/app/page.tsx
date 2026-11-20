import Link from "next/link";
import Icon from "@/components/Icon";
import WhatsApp from "@/components/WhatsApp";
import styles from "@/components/store/store.module.css";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import TemplateGallery from "@/components/store/TemplateGallery";
import { formatEgp, isSelfServe } from "@/lib/pricing";
import { sampleLink } from "@/lib/samples";
import { getSiteSettings, whatsappLink } from "@/lib/site";
import { getPricing, listTemplates } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Storefront home: what it is, templates, packages. */
export default async function Home() {
  const [templates, pricing, site] = await Promise.all([listTemplates(), getPricing(), getSiteSettings()]);
  const showcase = templates.find((t) => t.videoUrl);
  const wa = whatsappLink(site.whatsapp, "أهلاً، عايز أستفسر عن الدعوات");

  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <SiteHeader brand={site.brand} whatsappUrl={wa || undefined} />
      <div className={styles.wrap}>
        <section className={styles.hero}>
          <div>
            <h1>شارك أسعد لحظاتك مع الناس اللي بتفرق معاك</h1>
            <p className={styles.lead}>
              فرحك، خطوبتك، أو كتب كتابك يستاهل دعوة تليق بيه. إحنا بنساعدك توصّل فرحتك لكل حبايبك بدعوة على الموبايل
              تتفتح بختم وأنيميشن ومزيكا، وتوصل لكل واحد باسمه، ويقدروا يبعتولك تهانيهم من نفس اللينك.
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
              <video src={showcase.videoUrl} poster={showcase.posterUrl} muted autoPlay loop playsInline />
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
              <span>
                ادفع بالطريقة اللي تريحك، واللينك يوصلك على <WhatsApp /> تبعته لحبايبك
              </span>
            </li>
          </ol>
        </section>

        <section className={styles.section} id="templates">
          <h2>التصميمات</h2>
          <p className={styles.sectionLead}>دوس على أي تصميم تشوفه زي ما الضيف هيشوفه</p>
          <TemplateGallery templates={templates} />
        </section>

        <section className={styles.section} id="packages">
          <h2>الباقات</h2>
          <p className={styles.sectionLead}>سعر واحد، من غير اشتراك</p>
          <div className={styles.packageGrid}>
            {pricing.packages
              .filter((p) => p.active)
              .map((p) => (
                <div key={p.id} className={styles.packageBox} data-featured={p.id === 2}>
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
                    <Link className={styles.ctaGhost} href={`/request?p=${p.id}`}>
                      اطلبها
                    </Link>
                  )}
                  <a className={styles.sampleLink} href={sampleLink(p.id)} target="_blank" rel="noopener noreferrer">
                    <Icon name="eye" size={16} /> شوف مثال
                  </a>
                </div>
              ))}
          </div>
        </section>
      </div>

      <SiteFooter site={site} />

      {wa && (
        <a className={styles.whatsappFab} href={wa} target="_blank" rel="noopener noreferrer" aria-label="كلمنا على واتساب">
          <Icon name="whatsapp" size={26} strokeWidth={1.8} />
        </a>
      )}
    </main>
  );
}
