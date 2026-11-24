import Link from "next/link";
import styles from "./store.module.css";
import Icon from "../Icon";
import type { SiteSettings } from "@/lib/site";

/** Footer: brand, links, social icons and WhatsApp (all from the dashboard's site settings). */
export default function SiteFooter({ site }: { site: SiteSettings }) {
  const socials = [
    { key: "facebook", href: site.socials.facebook, label: "فيسبوك" },
    { key: "instagram", href: site.socials.instagram, label: "إنستجرام" },
    { key: "tiktok", href: site.socials.tiktok, label: "تيك توك" },
  ] as const;
  const wa = site.whatsapp ? `https://wa.me/${site.whatsapp}` : "";
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.siteFooterInner}>
        <div className={styles.footerBrand}>
          <strong>{site.brand}</strong>
          <span>دعوات رقمية للفرح والخطوبة وكتب الكتاب</span>
        </div>
        <nav className={styles.footerLinks} aria-label="روابط">
          <Link href="/#templates">التصميمات</Link>
          <Link href="/#packages">الباقات</Link>
          <Link href="/samples">أمثلة</Link>
          <Link href="/create">اعمل دعوتك</Link>
        </nav>
        <div className={styles.socials}>
          {socials
            .filter((s) => s.href)
            .map((s) => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={styles.social}>
                <Icon name={s.key} size={20} />
              </a>
            ))}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={styles.footerWa}>
              <Icon name="whatsapp" size={20} /> واتساب
            </a>
          )}
        </div>
      </div>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} {site.brand}
      </p>
    </footer>
  );
}
