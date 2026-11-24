"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import TrialCta from "./TrialCta";
import {
  formatLandingPrice,
  type Currency,
  type LandingCopy,
  type ReviewItem,
} from "./copy";
import { isSelfServe, type PackageInfo, type PricingStep } from "@/lib/pricing";
import type { Lang } from "@/lib/types";
import styles from "./landing.module.css";
import { localeHref } from "@/lib/locale";

interface PricingReviewsSplitProps {
  copy: LandingCopy;
  lang: Lang;
  currency: Currency;
  packages: PackageInfo[];
  /** The three "how it works" keypoints, edited from the admin dashboard. */
  steps: PricingStep[];
}

const ROMAN = ["I", "II", "III", "IV"];
const ARABIC_NUMERALS = ["١", "٢", "٣", "٤"];

const ENGLISH_TIER_NAMES: Record<number, string> = {
  1: "Essential",
  2: "Signature",
  3: "Tailored",
  4: "Bespoke",
};

function ReviewCard({ item, wide }: { item: ReviewItem; wide?: boolean }) {
  return (
    <article
      className={`${styles.reviewCard} ${wide ? styles.reviewCardWide : ""}`}
    >
      <div>
        <span aria-label="5 out of 5 stars" className={styles.reviewStars}>
          {[0, 1, 2, 3, 4].map((s) => (
            <Star key={s} size={14} fill="currentColor" strokeWidth={1.5} />
          ))}
        </span>
        <blockquote className={styles.reviewQuote}>
          <p>“{item.quote}”</p>
        </blockquote>
      </div>
      <div className={styles.reviewFooter}>
        <cite className={styles.reviewCouple}>{item.couple}</cite>
        <span className={styles.reviewLocation}>{item.location}</span>
      </div>
    </article>
  );
}

export default function PricingReviewsSplit({
  copy,
  lang,
  currency,
  packages,
  steps,
}: PricingReviewsSplitProps) {
  const activePackages = packages.filter((p) => p.active);
  const defaultPkg =
    activePackages.find((p) => p.id === 2) ?? activePackages[0];
  const [selectedId, setSelectedId] = useState(defaultPkg?.id ?? 1);

  const selectedIndex = Math.max(
    0,
    activePackages.findIndex((p) => p.id === selectedId)
  );
  const selectedPkg = activePackages[selectedIndex] ?? defaultPkg;
  const selectedPrice = selectedPkg
    ? formatLandingPrice(selectedPkg.price, currency, lang)
    : formatLandingPrice(1500, currency, lang);
  const ctaHref = localeHref(
    lang,
    selectedPkg
      ? isSelfServe(selectedPkg.id)
        ? `/create?p=${selectedPkg.id}`
        : `/request?p=${selectedPkg.id}`
      : "/create",
  );
  const ctaLabel =
    selectedPkg && !isSelfServe(selectedPkg.id)
      ? `${copy.pricing.customCta} — ${selectedPrice}`
      : `${copy.nav.startPrefix} ${selectedPrice}`;

  return (
    <section
      id="reviews"
      aria-labelledby="landing-premium-title"
      data-header-tone="dark"
      className={styles.reviewsSection}
    >
      <div className={styles.reviewsGrid}>
        {/* LEFT PANEL: Deep Espresso Pricing & Editorial Journey */}
        <div className={styles.pricingDarkCard}>
          <div>
            <div className={styles.pricingBadgeRow}>
              <p className={styles.pricingEyebrow}>{copy.pricing.eyebrow}</p>
              <span className={styles.pricingBadgePill}>
                {copy.pricing.badge}
              </span>
            </div>

            <h2 id="landing-premium-title" className={styles.pricingH2}>
              {copy.pricing.title}
            </h2>
            <p className={styles.pricingLead}>{copy.pricing.lead}</p>

            {/* Architectural Hairline Editorial Suite Ledger (replaces rounded pills) */}
            {activePackages.length > 0 && (
              <div
                role="radiogroup"
                aria-label="Suites"
                className={styles.tierLedger}
                style={{
                  gridTemplateColumns: `repeat(${activePackages.length}, minmax(0, 1fr))`,
                }}
              >
                {/* Animated champagne-gold sliding underline */}
                <span
                  aria-hidden="true"
                  className={styles.tierLedgerIndicator}
                  style={{
                    width: `${100 / activePackages.length}%`,
                    transform: `translateX(${
                      (lang === "ar" ? -1 : 1) * selectedIndex * 100
                    }%)`,
                  }}
                />

                {activePackages.map((pkg, idx) => {
                  const active = pkg.id === selectedPkg?.id;
                  const displayName =
                    lang === "ar"
                      ? pkg.name
                      : ENGLISH_TIER_NAMES[pkg.id] ?? pkg.name;
                  const isArabicText = /[\u0600-\u06FF]/.test(displayName);

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedId(pkg.id)}
                      className={`${styles.tierLedgerCell} ${
                        active ? styles.tierLedgerCellActive : ""
                      }`}
                    >
                      <span className={styles.tierLedgerRoman} aria-hidden="true">
                        {lang === "ar"
                          ? ARABIC_NUMERALS[idx] ?? idx + 1
                          : ROMAN[idx] ?? idx + 1}
                      </span>
                      <span
                        className={`${styles.tierLedgerName} ${
                          isArabicText ? styles.tierLedgerNameAr : ""
                        }`}
                      >
                        {displayName}
                      </span>
                      <span className={styles.tierLedgerPrice}>
                        {formatLandingPrice(pkg.price, currency, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3 Numbered Editorial Steps */}
          <ol className={styles.pricingSteps}>
            {steps.map((step, i) => (
              <li key={i} className={styles.pricingStepItem}>
                <span className={styles.pricingStepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={styles.pricingStepTitle}>{step[lang].title}</h3>
                  <p className={styles.pricingStepBody}>{step[lang].body}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Bottom Recessed CTA — Centered cleanly in the card */}
          <div className={styles.pricingCtaSlot}>
            <TrialCta
              href={ctaHref}
              label={ctaLabel}
              subLabel={copy.nav.trialSub}
              variant="light"
              showArrow
              size="lg"
            />
          </div>
        </div>

        {/* RIGHT PANEL: Warm Sand Reviews Card + Dual Infinite Marquee */}
        <aside aria-label="Couple reviews" className={styles.reviewsSandCard}>
          <div className={styles.reviewsHeaderRow}>
            <div className={styles.reviewsHeadingWrap}>
              <p className={styles.eyebrowBronze}>{copy.reviews.eyebrow}</p>
              <h3 className={styles.reviewsH3}>{copy.reviews.title}</h3>
            </div>
            <div className={styles.reviewsRatingBox}>
              <p className={styles.reviewsRatingNum}>{copy.reviews.rating}</p>
              <p className={styles.reviewsRatingLabel}>
                {copy.reviews.ratingLabel}
              </p>
            </div>
          </div>

          <div className={styles.marqueeStage} dir="ltr">
            {/* Row 1 — Forward Infinite Drift */}
            <div className={styles.marqueeRow}>
              <div
                className={`${styles.marqueeTrack} ${styles.marqueeForward}`}
              >
                <div className={styles.marqueeGroup}>
                  {copy.reviews.row1.map((item, idx) => (
                    <ReviewCard
                      key={`r1a-${idx}`}
                      item={item}
                      wide={idx % 2 === 1}
                    />
                  ))}
                </div>
                <div aria-hidden="true" className={styles.marqueeGroup}>
                  {copy.reviews.row1.map((item, idx) => (
                    <ReviewCard
                      key={`r1b-${idx}`}
                      item={item}
                      wide={idx % 2 === 1}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2 — Reverse Infinite Drift (Desktop lg+) */}
            <div className={`${styles.marqueeRow} ${styles.marqueeRowSecond}`}>
              <div
                className={`${styles.marqueeTrack} ${styles.marqueeReverse}`}
              >
                <div className={styles.marqueeGroup}>
                  {copy.reviews.row2.map((item, idx) => (
                    <ReviewCard
                      key={`r2a-${idx}`}
                      item={item}
                      wide={idx % 2 === 0}
                    />
                  ))}
                </div>
                <div aria-hidden="true" className={styles.marqueeGroup}>
                  {copy.reviews.row2.map((item, idx) => (
                    <ReviewCard
                      key={`r2b-${idx}`}
                      item={item}
                      wide={idx % 2 === 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
