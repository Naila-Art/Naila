import Link from "next/link";
import { localeHref } from "@/lib/locale";
import { getPackage, type Pricing } from "@/lib/pricing";
import { TEMPLATE_EDITORIAL_META, templateDisplayName } from "@/lib/templates";
import { STYLE_LABELS, type Lang, type Template } from "@/lib/types";
import { CATEGORY_COPY } from "./storeCopy";
import styles from "./templateIntro.module.css";

const COPY = {
  en: {
    eyebrowSuffix: "digital invitation",
    about: (category: string) =>
      `A digital ${category.toLowerCase()} invitation your guests open on their phone: a cinematic opening, your names and evening details, a live countdown and one-tap RSVP. Add your own names, date, venue and music, then send one link to everyone, or a personal link to each guest.`,
    from: (price: string) => `From ${price} EGP · preview free before you pay`,
    cta: (name: string) => `Design with ${name}`,
    samples: "Open a live sample",
    all: "All designs",
    more: (style: string) => `More ${style} designs`,
  },
  ar: {
    eyebrowSuffix: "دعوة رقمية",
    about: (category: string) =>
      `دعوة ${category} رقمية يفتحها ضيوفك على موبايلاتهم: افتتاحية سينمائية، أسماؤكما وتفاصيل الليلة، عدّ تنازلي، وتأكيد حضور بضغطة واحدة. أضيفي أسماءكما والموعد والمكان والموسيقى، وابعتي رابطًا واحدًا للجميع أو رابطًا باسم كل ضيف.`,
    from: (price: string) => `ابتداءً من ${price} ج.م · عاينيها مجانًا قبل الدفع`,
    cta: (name: string) => `صمّمي بتصميم ${name}`,
    samples: "افتحي دعوة حيّة",
    all: "كل التصميمات",
    more: (style: string) => `تصميمات أخرى: ${style}`,
  },
} as const;

/**
 * The template page's own content, rendered on the server below the live preview: the design's
 * name (the page heading), what it is, its starting price and links to similar designs.
 */
export default function TemplateIntro({
  template,
  related,
  pricing,
  lang,
}: {
  template: Template;
  related: Template[];
  pricing: Pricing;
  lang: Lang;
}) {
  const c = COPY[lang];
  const meta = TEMPLATE_EDITORIAL_META[template.id];
  const name = templateDisplayName(template, lang);
  const category = CATEGORY_COPY[lang][template.category];
  const style = template.style ? STYLE_LABELS[template.style][lang] : null;
  const tagline = lang === "ar" ? meta?.taglineAr : meta?.taglineEn;
  const price = getPackage(pricing, 1)?.price;

  return (
    <section className={styles.intro} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} aria-labelledby="template-name">
      <p className={styles.eyebrow}>
        {category} · {style ?? c.eyebrowSuffix}
      </p>
      <h1 id="template-name" className={styles.name}>
        {name}
      </h1>
      {tagline && <p className={styles.tagline}>{tagline}</p>}
      <p className={styles.about}>{c.about(category)}</p>
      {price && <p className={styles.price}>{c.from(price.toLocaleString(lang === "ar" ? "ar-EG" : "en-US"))}</p>}

      <div className={styles.actions}>
        <Link href={localeHref(lang, `/create?t=${template.id}`)} className={styles.primary}>
          {c.cta(name)}
        </Link>
        <Link href={localeHref(lang, "/samples")} className={styles.secondary}>
          {c.samples}
        </Link>
      </div>

      {related.length > 0 && (
        <nav className={styles.related} aria-label={c.more(style ?? category)}>
          <h2 className={styles.relatedTitle}>{c.more(style ?? category)}</h2>
          <ul>
            {related.map((t) => (
              <li key={t.id}>
                <Link href={localeHref(lang, `/t/${t.id}`)}>{templateDisplayName(t, lang)}</Link>
              </li>
            ))}
            <li>
              <Link href={localeHref(lang, "/#templates")}>{c.all}</Link>
            </li>
          </ul>
        </nav>
      )}
    </section>
  );
}
