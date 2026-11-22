"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import TrialCta from "./TrialCta";
import { formatLandingPrice, type Currency, type LandingCopy } from "./copy";
import type { Lang } from "@/lib/types";
import styles from "./landing.module.css";

interface LandingFooterProps {
  brand: string;
  copy: LandingCopy;
  lang: Lang;
  currency: Currency;
  startingPriceEgp: number;
  whatsappUrl?: string;
  footerRef: RefObject<HTMLElement | null>;
  brandSlotRef: RefObject<HTMLAnchorElement | null>;
  ctasSlotRef: RefObject<HTMLDivElement | null>;
  handoffDocked: boolean;
  assembleProgress: number;
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function band(p: number, start: number, end: number) {
  return easeOutCubic(clamp01((p - start) / Math.max(end - start, 0.001)));
}

export default function LandingFooter({
  brand,
  copy,
  lang,
  currency,
  startingPriceEgp,
  whatsappUrl,
  footerRef,
  brandSlotRef,
  ctasSlotRef,
  handoffDocked,
  assembleProgress,
}: LandingFooterProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [motion, setMotion] = useState({ p: 0, px: 0, py: 0 });
  const targetP = useRef(0);
  const currentP = useRef(0);
  const targetPointer = useRef({ x: 0, y: 0 });
  const currentPointer = useRef({ x: 0, y: 0 });
  const kickRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    targetP.current = assembleProgress;
    kickRef.current?.();
  }, [assembleProgress]);

  // Unified inertia-damped assembly + 3-plane living sky pointer parallax
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduced);
    if (reduced) {
      currentP.current = 1;
      setMotion({ p: 1, px: 0, py: 0 });
      return;
    }

    let raf = 0;

    const onPointerMove = (e: PointerEvent) => {
      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      targetPointer.current.x = (e.clientX / vw - 0.5) * 2;
      targetPointer.current.y = (e.clientY / vh - 0.5) * 2;
      kick();
    };

    const tick = () => {
      const el = footerRef.current;
      let keepRunning = false;

      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 900;
        const inView = rect.top < vh + 180 && rect.bottom > -120;

        // Smooth liquid inertia towards scroll assembly target
        const dp = targetP.current - currentP.current;
        if (Math.abs(dp) > 0.0008) {
          currentP.current += dp * 0.115;
          keepRunning = true;
        } else {
          currentP.current = targetP.current;
        }

        if (inView) {
          const dpx = targetPointer.current.x - currentPointer.current.x;
          const dpy = targetPointer.current.y - currentPointer.current.y;
          if (Math.abs(dpx) > 0.001 || Math.abs(dpy) > 0.001) {
            currentPointer.current.x += dpx * 0.055;
            currentPointer.current.y += dpy * 0.055;
            keepRunning = true;
          }
        }

        setMotion({
          p: currentP.current,
          px: currentPointer.current.x,
          py: currentPointer.current.y,
        });
      }

      if (keepRunning) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    kickRef.current = kick;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    kick();

    return () => {
      kickRef.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", kick);
    };
  }, [footerRef]);

  const p = reducedMotion ? 1 : motion.p;
  const px = reducedMotion ? 0 : motion.px;
  const py = reducedMotion ? 0 : motion.py;

  // 6 synchronized scroll-choreographed assembly curves
  const ruleP = band(p, 0.04, 0.52);
  const rearCloudP = band(p, 0.04, 0.72);
  const leftCloudP = band(p, 0.1, 0.85);
  const rightCloudP = band(p, 0.14, 0.88);
  const glowP = band(p, 0.18, 0.9);
  const wordmarkP = easeOutQuart(clamp01((p - 0.22) / 0.74));
  const taglineP = band(p, 0.34, 0.78);
  const copyP = band(p, 0.68, 0.98);

  const priceLabel = formatLandingPrice(startingPriceEgp, currency, lang);

  return (
    <footer
      ref={footerRef}
      data-revealed={p > 0.65 ? "true" : "false"}
      className={styles.footer}
    >
      {/* Top Architectural Hairline + Brand Slot & 3-Column Staggered Navigation */}
      <div className={styles.footerTopBar}>
        {/* Expanding Center-Outward Hairline Rule */}
        <span
          aria-hidden="true"
          className={styles.footerTopRule}
          style={{
            opacity: ruleP,
            transform: `scaleX(${(0.06 + ruleP * 0.94).toFixed(4)})`,
          }}
        />

        <div className={styles.footerBrandCol}>
          <Link
            ref={brandSlotRef}
            href="/"
            translate="no"
            className={`notranslate ${styles.footerBrandMark} ${
              handoffDocked ? styles.footerSlotVisible : styles.footerSlotHiddenDesktop
            }`}
          >
            {brand}
          </Link>
          <p
            className={styles.footerTagline}
            style={{
              opacity: taglineP,
              transform: `translate3d(0, ${((1 - taglineP) * 18).toFixed(1)}px, 0)`,
              filter: `blur(${((1 - taglineP) * 4).toFixed(1)}px)`,
            }}
          >
            {copy.footer.tagline}
          </p>
        </div>

        <nav aria-label="Footer navigation" className={styles.footerNavGrid}>
          {copy.footer.links.map((lnk, idx) => {
            const lp = band(p, 0.36 + idx * 0.045, 0.76 + idx * 0.035);
            return (
              <Link
                key={lnk.label}
                href={lnk.href}
                className={styles.footerLink}
                style={{
                  opacity: lp,
                  transform: `translate3d(0, ${((1 - lp) * 16).toFixed(1)}px, 0)`,
                }}
              >
                {lnk.label}
              </Link>
            );
          })}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
              style={{
                opacity: band(p, 0.56, 0.9),
                transform: `translate3d(0, ${((1 - band(p, 0.56, 0.9)) * 16).toFixed(1)}px, 0)`,
              }}
            >
              {lang === "ar" ? "واتساب" : "WhatsApp"}
            </a>
          )}
        </nav>
      </div>

      {/* Centered Editorial CTA Pair (Receives Arced FLIP-gliding Header CTAs on desktop) */}
      <div
        ref={ctasSlotRef}
        className={`${styles.footerCtaRow} ${
          handoffDocked ? styles.footerSlotVisible : styles.footerSlotHiddenDesktop
        }`}
      >
        <a href="#templates" className={styles.footerGhostBtn}>
          {copy.nav.exploreTemplates}
        </a>
        <TrialCta
          href="/create"
          label={`${copy.nav.startPrefix} ${priceLabel}`}
          subLabel={copy.nav.trialSub}
          variant="dark"
          showArrow
          size="sm"
        />
      </div>

      {/* Warm Champagne Horizon Luminance blooming behind clouds as wordmark rises */}
      <div
        aria-hidden="true"
        className={styles.footerHorizonGlow}
        style={{
          opacity: (glowP * 0.9).toFixed(3),
          transform: `translate3d(-50%, ${((1 - glowP) * 32).toFixed(1)}px, 0) scale(${(
            0.78 +
            glowP * 0.28
          ).toFixed(3)})`,
        }}
      />

      {/* Monumental Italic Wordmark Sunrise (z-20, between rear center cloud & foreground side clouds) */}
      <div
        className={styles.footerWordmarkParallax}
        style={{
          transform: `translate3d(${(px * -10).toFixed(1)}px, ${(py * -6).toFixed(1)}px, 0)`,
        }}
      >
        <p
          data-testid="landing-footer-wordmark"
          translate="no"
          className={`notranslate ${styles.footerGiantWordmark}`}
          style={{
            opacity: wordmarkP.toFixed(3),
            filter: `blur(${((1 - wordmarkP) * 11).toFixed(2)}px)`,
            letterSpacing: `${(-0.025 - wordmarkP * 0.05).toFixed(4)}em`,
            transform: `translate3d(0, ${((1 - wordmarkP) * 58).toFixed(2)}%, 0) scale(${(
              0.86 +
              wordmarkP * 0.14
            ).toFixed(4)})`,
          }}
        >
          {brand}
        </p>
      </div>

      {/* 3-Layer Painterly Pastel Cloud Bank Gathering Inward & Upward + Living Drift */}
      <div
        data-testid="landing-footer-cloud-bank"
        aria-hidden="true"
        className={styles.footerCloudBank}
      >
        {/* Rear Center Lavender/Peach Cloud (z-10: BEHIND wordmark) */}
        <div
          className={styles.footerCloudCenterWrap}
          style={{
            opacity: (rearCloudP * 0.96).toFixed(3),
            transform: `translate3d(0, ${((1 - rearCloudP) * 42).toFixed(2)}%, 0) scale(${(
              0.88 +
              rearCloudP * 0.12
            ).toFixed(4)})`,
          }}
        >
          <div
            className={styles.cloudParallaxPlane}
            style={{
              transform: `translate3d(${(px * -6).toFixed(1)}px, ${(py * -3).toFixed(1)}px, 0)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/clouds/cloud-center.png"
              alt=""
              loading="lazy"
              className={`${styles.footerCloudCenterImg} ${styles.cloudDriftCenter}`}
            />
          </div>
        </div>

        {/* Foreground Left Peach/Rose Cloud (z-30: Sweeps inward from left + upward) */}
        <div
          className={styles.footerCloudFrontWrap}
          style={{
            opacity: leftCloudP.toFixed(3),
            transform: `translate3d(${((1 - leftCloudP) * -22).toFixed(2)}%, ${(
              (1 - leftCloudP) *
              44
            ).toFixed(2)}%, 0) rotate(${((1 - leftCloudP) * -3.5).toFixed(2)}deg) scale(${(
              0.88 +
              leftCloudP * 0.12
            ).toFixed(4)})`,
          }}
        >
          <div
            className={styles.cloudParallaxPlane}
            style={{
              transform: `translate3d(${(px * 15).toFixed(1)}px, ${(py * 7).toFixed(1)}px, 0)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/clouds/cloud-left.png"
              alt=""
              loading="lazy"
              className={`${styles.footerCloudLeftImg} ${styles.cloudDriftLeft}`}
            />
          </div>
        </div>

        {/* Foreground Right Mint/Gold Cloud (z-30: Sweeps inward from right + upward) */}
        <div
          className={styles.footerCloudFrontWrap}
          style={{
            opacity: rightCloudP.toFixed(3),
            transform: `translate3d(${((1 - rightCloudP) * 22).toFixed(2)}%, ${(
              (1 - rightCloudP) *
              44
            ).toFixed(2)}%, 0) rotate(${((1 - rightCloudP) * 3.5).toFixed(2)}deg) scale(${(
              0.88 +
              rightCloudP * 0.12
            ).toFixed(4)})`,
          }}
        >
          <div
            className={styles.cloudParallaxPlane}
            style={{
              transform: `translate3d(${(px * 17).toFixed(1)}px, ${(py * 8).toFixed(1)}px, 0)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/clouds/cloud-right.png"
              alt=""
              loading="lazy"
              className={`${styles.footerCloudRightImg} ${styles.cloudDriftRight}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom-Left Copyright */}
      <p
        className={styles.footerCopyright}
        style={{
          opacity: copyP.toFixed(3),
          transform: `translate3d(0, ${((1 - copyP) * 10).toFixed(1)}px, 0)`,
        }}
      >
        {copy.footer.copyright}
      </p>
    </footer>
  );
}
