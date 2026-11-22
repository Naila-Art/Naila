"use client";

import Link from "next/link";
import { ArrowUpRight, Languages } from "lucide-react";
import styles from "./store.module.css";
import {
  CATEGORY_COPY,
  INCLUDED_IN_ALL_COPY,
  STORE_COPY,
  formatStorePrice,
  packageDisplayName,
  packageDisplayPoints,
} from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import type { Pricing } from "@/lib/pricing";
import { SAMPLES, sampleLink } from "@/lib/samples";

export default function SamplesView({
  brand,
  pricing,
}: {
  brand: string;
  pricing: Pricing;
}) {
  const { lang, toggleLang } = useSiteLang();
  const isAr = lang === "ar";
  const copy = STORE_COPY[lang];
  const sCopy = copy.samples;

  return (
    <main className={styles.page} dir={isAr ? "rtl" : "ltr"} lang={lang}>
      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand} translate="no">
            {brand}
          </Link>
          <div className={styles.navLinks}>
            <Link href="/#templates">{sCopy.navTemplates}</Link>
            <Link href="/#features">{sCopy.navFeatures}</Link>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={copy.switchLangAria}
              className={styles.studioLangBtn}
            >
              <Languages size={14} strokeWidth={1.7} aria-hidden="true" />
              <span>{copy.switchLangTitle}</span>
            </button>
            <Link
              href="/create"
              className={styles.cta}
              style={{ minHeight: "2.35rem", paddingInline: "1.1rem" }}
            >
              {sCopy.navStart}
            </Link>
          </div>
        </nav>

        <p className={styles.sampleEyebrow}>{sCopy.eyebrow}</p>
        <h1 className={styles.pageTitle} style={{ marginTop: "0.75rem" }}>
          {sCopy.title}
        </h1>
        <p className={styles.sectionLead}>{sCopy.lead}</p>

        <ul className={styles.sampleGrid}>
          {SAMPLES.map((s) => {
            const pkg = pricing.packages.find((p) => p.id === s.packageId)!;
            const couple = isAr
              ? `${s.event.partnerA} و ${s.event.partnerB}`
              : `${s.event.partnerA} & ${s.event.partnerB}`;
            return (
              <li key={s.slug} className={styles.sampleCard}>
                <div>
                  <p className={styles.sampleEyebrow}>
                    {packageDisplayName(pkg, lang)} ·{" "}
                    {formatStorePrice(pkg.price, lang, pkg.priceNote)}
                  </p>
                  <h2>
                    {packageDisplayName(pkg, lang)} — {couple}
                  </h2>
                  <p className={styles.hint} style={{ marginTop: "0.5rem" }}>
                    {CATEGORY_COPY[lang][s.category]} · {s.event.venueName}
                    {s.guest
                      ? ` · ${sCopy.namedNote(s.guest.title, s.guest.name)}`
                      : ` · ${sCopy.generalLink}`}
                  </p>
                  <ul
                    className={styles.samplePoints}
                    style={{ marginTop: "1.1rem" }}
                  >
                    {packageDisplayPoints(pkg, lang).map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
                >
                  <a
                    className={styles.cta}
                    href={sampleLink(s.packageId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {sCopy.openLive}
                    <ArrowUpRight size={15} />
                  </a>
                  <Link
                    href={
                      s.packageId <= 2
                        ? `/create?p=${s.packageId}`
                        : `/request?p=${s.packageId}`
                    }
                    className={styles.ctaGhost}
                  >
                    {sCopy.chooseTier}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <p className={styles.includedAll}>
          {sCopy.includedPrefix} {INCLUDED_IN_ALL_COPY[lang].join(" · ")}
        </p>
      </div>
    </main>
  );
}
