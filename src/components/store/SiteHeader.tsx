"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./store.module.css";
import Icon from "../Icon";

const LINKS = [
  { href: "/#templates", label: "التصميمات" },
  { href: "/#packages", label: "الباقات" },
  { href: "/samples", label: "أمثلة" },
];

/** The storefront's top bar: brand, links and the main call to action; a menu on mobile. */
export default function SiteHeader({ brand, whatsappUrl }: { brand: string; whatsappUrl?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className={styles.siteHeader}>
      <div className={styles.siteHeaderInner}>
        <Link href="/" className={styles.brand}>
          {brand}
        </Link>
        <nav className={styles.siteNav} data-open={open} aria-label="الموقع">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              كلمنا
            </a>
          )}
        </nav>
        <div className={styles.siteHeaderActions}>
          {path !== "/create" && (
            <Link href="/create" className={styles.headerCta}>
              اعمل دعوتك
            </Link>
          )}
          <button type="button" className={styles.menuToggle} aria-label="القايمة" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
