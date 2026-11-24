"use client";

import type { RefObject } from "react";
import { ChevronDown, Languages } from "lucide-react";
import Link from "next/link";
import TrialCta from "./TrialCta";
import { formatLandingPrice, type Currency, type LandingCopy } from "./copy";
import type { Lang } from "@/lib/types";
import styles from "./landing.module.css";
import { localeHref } from "@/lib/locale";

export interface FooterHandoffState {
  progress: number;
  brandDx: number;
  brandDy: number;
  brandScale: number;
  ctaDx: number;
  ctaDy: number;
  ctaScale: number;
  docked: boolean;
}

interface LandingHeaderProps {
  brand: string;
  copy: LandingCopy;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  startingPriceEgp: number;
  tone: "light" | "dark";
  scrolled: boolean;
  handoff: FooterHandoffState;
  brandRef: RefObject<HTMLAnchorElement | null>;
  ctasRef: RefObject<HTMLDivElement | null>;
}

export default function LandingHeader({
  brand,
  copy,
  lang,
  onLangChange,
  currency,
  onCurrencyChange,
  startingPriceEgp,
  tone,
  scrolled,
  handoff,
  brandRef,
  ctasRef,
}: LandingHeaderProps) {
  const isLightText = tone === "light";
  const priceLabel = formatLandingPrice(startingPriceEgp, currency, lang);

  // Middle links, currency pill, and progressive blur dissolve early (0 -> 0.45)
  // while Brand wordmark & CTA pair glide smoothly down into the Footer!
  const chromeOpacity = Math.max(0, 1 - handoff.progress * 2.35);
  const morphActive = handoff.progress > 0.005;
  const brandOpacity = handoff.docked ? 0 : 1;
  const ctaOpacity = handoff.docked ? 0 : 1;
  const italicizeBrand = handoff.progress > 0.55;

  return (
    <>
      <header
        data-testid="landing-header"
        data-tone={tone}
        data-scrolled={scrolled ? "true" : "false"}
        data-docked={handoff.docked ? "true" : "false"}
        className={styles.header}
        style={{
          pointerEvents: handoff.docked ? "none" : undefined,
        }}
      >
        {/* 4-Layer Progressive Backdrop Blur */}
        <div
          aria-hidden="true"
          className={styles.headerBlurRoot}
          style={{ opacity: scrolled ? chromeOpacity : 0 }}
        >
          <span className={`${styles.headerBlurLayer} ${styles.blurSoft}`} />
          <span className={`${styles.headerBlurLayer} ${styles.blurMedium}`} />
          <span className={`${styles.headerBlurLayer} ${styles.blurStrong}`} />
          <span className={`${styles.headerBlurLayer} ${styles.blurEdge}`} />
        </div>

        {/* Soft Top Gradient Wash */}
        <div
          aria-hidden="true"
          className={`${styles.headerWash} ${
            isLightText ? styles.headerWashLight : styles.headerWashDark
          }`}
          style={{ opacity: chromeOpacity }}
        />

        <nav aria-label="Primary navigation" className={styles.nav}>
          {/* Brand Wordmark — FLIP-glides down into Footer brand slot */}
          <Link
            ref={brandRef}
            href={localeHref(lang, "/")}
            translate="no"
            data-tx={handoff.brandDx.toFixed(2)}
            data-ty={handoff.brandDy.toFixed(2)}
            className={`notranslate ${styles.brandLink} ${
              isLightText ? styles.brandLight : styles.brandDark
            }`}
            style={{
              opacity: brandOpacity,
              transform: morphActive
                ? `translate3d(${handoff.brandDx.toFixed(2)}px, ${handoff.brandDy.toFixed(2)}px, 0) scale(${handoff.brandScale.toFixed(4)})`
                : undefined,
              transformOrigin: "left top",
              willChange: morphActive ? "transform, opacity" : undefined,
            }}
          >
            <span
              className={styles.brandWordmark}
              style={{
                fontStyle: italicizeBrand ? "italic" : "normal",
              }}
            >
              {brand}
            </span>
            <span
              className={`${styles.brandSub} ${
                scrolled || morphActive ? styles.brandSubHidden : ""
              }`}
            >
              {copy.brandSub}
            </span>
          </Link>

          {/* Center Nav Links — dissolve cleanly as handoff begins */}
          <div
            className={`${styles.navLinks} ${
              isLightText ? styles.navLinksLight : styles.navLinksDark
            }`}
            style={{
              opacity: chromeOpacity,
              pointerEvents: chromeOpacity < 0.1 ? "none" : undefined,
            }}
          >
            <a href="#features">{copy.nav.features}</a>
            <a href="#reviews">{copy.nav.reviews}</a>
            <a href="#faq">{copy.nav.faq}</a>
          </div>

          <div className={styles.navActions}>
            {/* Mobile inline language toggle */}
            <button
              type="button"
              onClick={() => onLangChange(lang === "en" ? "ar" : "en")}
              aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
              title={lang === "en" ? "العربية" : "English"}
              className={`${styles.mobileLangBtn} ${
                isLightText ? styles.glassBtnLight : styles.glassBtnDark
              }`}
              style={{ opacity: chromeOpacity }}
            >
              <Languages size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>

            {/* Currency Toggle Pill — dissolves cleanly as handoff begins */}
            <button
              type="button"
              onClick={() =>
                onCurrencyChange(currency === "EGP" ? "USD" : "EGP")
              }
              aria-label={`Currency: ${currency}`}
              className={`${styles.currencyPill} ${
                isLightText ? styles.glassBtnLight : styles.glassBtnDark
              }`}
              style={{
                opacity: chromeOpacity,
                pointerEvents: chromeOpacity < 0.1 ? "none" : undefined,
              }}
            >
              <span aria-hidden="true" className={styles.currencyFlag}>
                {currency === "EGP" ? "🇪🇬" : "🇺🇸"}
              </span>
              <span>
                {lang === "ar"
                  ? currency === "EGP"
                    ? "ج.م"
                    : "دولار"
                  : currency}
              </span>
              <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>

            {/* Shared CTA Pair — FLIP-glides smoothly down to Footer center! */}
            <div
              ref={ctasRef}
              data-tx={handoff.ctaDx.toFixed(2)}
              data-ty={handoff.ctaDy.toFixed(2)}
              className={styles.navCtaPair}
              style={{
                opacity: ctaOpacity,
                transform: morphActive
                  ? `translate3d(${handoff.ctaDx.toFixed(2)}px, ${handoff.ctaDy.toFixed(2)}px, 0) scale(${handoff.ctaScale.toFixed(4)})`
                  : undefined,
                transformOrigin: "center center",
                willChange: morphActive ? "transform, opacity" : undefined,
              }}
            >
              <a
                href="#templates"
                className={`${styles.navGhostBtn} ${
                  isLightText ? styles.glassBtnLight : styles.glassBtnDark
                }`}
              >
                {copy.nav.exploreTemplates}
              </a>

              <div className={styles.navPrimaryWrap}>
                <TrialCta
                  href={localeHref(lang, "/create")}
                  label={`${copy.nav.startPrefix} ${priceLabel}`}
                  subLabel={copy.nav.trialSub}
                  variant={isLightText ? "light" : "dark"}
                  showArrow={handoff.progress > 0.4}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Desktop Floating Bottom-Right Language Switcher */}
      <div className={styles.floatingLangWrap}>
        <button
          type="button"
          onClick={() => onLangChange(lang === "en" ? "ar" : "en")}
          aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
          title={lang === "en" ? "العربية" : "English"}
          className={`${styles.floatingLangBtn} ${
            isLightText ? styles.floatingLangLight : styles.floatingLangDark
          }`}
        >
          <Languages size={19} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
