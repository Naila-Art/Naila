"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLandingEntrance } from "./IntroCurtain";
import TrialCta from "./TrialCta";
import { formatLandingPrice, type Currency, type LandingCopy } from "./copy";
import type { Lang } from "@/lib/types";
import styles from "./landing.module.css";

// Hero backdrop: the Barakah door reveal plays once, eases to a stop on the
// open nave, then settles into a calm still of that exact frame.
const HERO_REVEAL_VIDEO = "/assets/hero/hero-reveal.mp4?v=1";
const HERO_REVEAL_START = "/assets/hero/hero-reveal-start.jpg?v=1";
const HERO_REVEAL_END = "/assets/hero/hero-reveal-end.jpg?v=1";
// Seconds before the end where playback starts decelerating.
const REVEAL_EASE_WINDOW = 1.2;
const REVEAL_MIN_RATE = 0.12;

function HeroRevealBackdrop({ play }: { play: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettled(true);
      return;
    }
    if (!play) return;

    let raf = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      video.pause();
      setSettled(true);
    };

    const tick = () => {
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        const remaining = dur - video.currentTime;
        if (remaining <= 0.045 || video.ended) {
          finish();
          return;
        }
        if (remaining < REVEAL_EASE_WINDOW) {
          // Ease-out: rate glides from 1 toward a crawl as the doors settle open.
          const p = 1 - remaining / REVEAL_EASE_WINDOW;
          const eased = 1 - p * p * (3 - 2 * p);
          video.playbackRate = Math.max(REVEAL_MIN_RATE, eased);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    video.addEventListener("ended", finish);
    const attempt = video.play();
    if (attempt) attempt.catch(finish);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", finish);
    };
  }, [play]);

  return (
    <div
      className={`${styles.heroReveal} ${settled ? styles.heroRevealSettled : ""}`}
    >
      {/* Identical to the video's final frame, so the hand-off is invisible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO_REVEAL_END} alt="" className={styles.heroRevealMedia} />
      <video
        ref={videoRef}
        className={`${styles.heroRevealMedia} ${styles.heroRevealVideo}`}
        src={HERO_REVEAL_VIDEO}
        poster={HERO_REVEAL_START}
        muted
        playsInline
        preload="auto"
      />
      <div className={styles.heroRevealWash} />
    </div>
  );
}

function DotFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let pointerX = -9999;
    let pointerY = -9999;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointerX = -9999;
      pointerY = -9999;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const draw = (time: number) => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const gap = 28;
      const t = time * 0.0008;

      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          let alpha = 0.14;
          let radius = 1.0;

          if (!reduced) {
            const wave = Math.sin(x * 0.012 + t) * Math.cos(y * 0.012 - t * 0.7);
            alpha = 0.11 + (wave + 1) * 0.05;

            const dx = x - pointerX;
            const dy = y - pointerY;
            const distSq = dx * dx + dy * dy;
            if (distSq < 25600) {
              const boost = 1 - Math.sqrt(distSq) / 160;
              alpha += boost * 0.34;
              radius += boost * 0.9;
            }
          }

          ctx.fillStyle = `rgba(252, 247, 237, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduced) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="home-hero-dot-field"
      aria-hidden="true"
      className={styles.heroDotField}
    />
  );
}

interface HeroSectionProps {
  copy: LandingCopy;
  lang: Lang;
  currency: Currency;
  startingPriceEgp: number;
}

export default function HeroSection({
  copy,
  lang,
  currency,
  startingPriceEgp,
}: HeroSectionProps) {
  const { heroRevealed, immediate } = useLandingEntrance();

  const priceLabel = formatLandingPrice(startingPriceEgp, currency, lang);
  const revealClass = (idx: number) => {
    if (immediate) return styles.heroGroupVisible;
    return heroRevealed
      ? `${styles.heroGroupVisible} ${styles[`heroDelay${idx}`] ?? ""}`
      : styles.heroGroupHidden;
  };

  return (
    <div data-testid="landing-hero-prelude" className={styles.heroPrelude}>
      {/* Sticky Full-Bleed Backdrop */}
      <div className={styles.heroBackdropSticky} aria-hidden="true">
        <div className={styles.heroBackdropCanvas}>
          <HeroRevealBackdrop play={heroRevealed || immediate} />
          <div className={styles.heroToneOverlay} />
          <div className={styles.heroContrastOverlay} />
          <DotFieldCanvas />
        </div>
      </div>

      {/* Foreground Hero Content */}
      <div className={styles.heroForegroundWrap}>
        <section
          data-testid="home-hero-panel"
          data-header-tone="light"
          className={styles.heroSection}
        >
          <div className={styles.heroInner}>
            <div className={styles.heroGrid}>
              {/* Left Copy Column — Pure, uncluttered editorial typography */}
              <div className={styles.heroCopyCol}>
                <div className={styles.heroCopyStack}>
                  <h1 className={`${styles.heroHeadline} ${revealClass(0)}`}>
                    {copy.hero.headline}
                  </h1>

                  <p className={`${styles.heroLead} ${revealClass(1)}`}>
                    {copy.hero.lead}
                  </p>
                </div>

                {/* Primary & Secondary Actions */}
                <div className={`${styles.heroActionsBlock} ${revealClass(2)}`}>
                  <div className={styles.heroCtaRow}>
                    <div className={styles.heroPrimarySlot}>
                      <TrialCta
                        href="/create"
                        label={`${copy.nav.startPrefix} ${priceLabel}`}
                        subLabel={copy.nav.trialSub}
                        variant="light"
                        fullWidthMobile
                      />
                    </div>
                    <a href="#templates" className={styles.heroSecondaryBtn}>
                      {copy.hero.exploreTemplates}
                    </a>
                  </div>

                  <div className={styles.heroSubLinkRow}>
                    <span>{copy.hero.haveSampleLead}</span>
                    <Link href="/samples" className={styles.heroUnderlineLink}>
                      {copy.hero.samplesLink}
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
