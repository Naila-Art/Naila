"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLandingEntrance } from "./IntroCurtain";
import TrialCta from "./TrialCta";
import { formatLandingPrice, type Currency, type LandingCopy } from "./copy";
import type { Lang } from "@/lib/types";
import styles from "./landing.module.css";

const HERO_SLIDES = [
  "/assets/hero/hero-1.jpg?v=3",
  "/assets/hero/hero-2.jpg?v=3",
  "/assets/hero/hero-3.jpg?v=3",
  "/assets/hero/hero-4.jpg?v=3",
];

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
  showcaseTemplateId: string;
  showcaseVideoUrl: string;
  showcasePosterUrl: string;
}

export default function HeroSection({
  copy,
  lang,
  currency,
  startingPriceEgp,
  showcaseTemplateId,
  showcaseVideoUrl,
  showcasePosterUrl,
}: HeroSectionProps) {
  const { heroRevealed, immediate } = useLandingEntrance();
  const [slideIdx, setSlideIdx] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  const handleStageMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ rx: -ny * 4.5, ry: nx * 5.5 });
  };

  const handleStageLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

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
          <div className={styles.heroSlideshow}>
            {HERO_SLIDES.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                className={styles.heroSlideImg}
                style={{ opacity: i === slideIdx ? 1 : 0 }}
              />
            ))}
          </div>
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

              {/* Right Column — Singular Borderless Couture Floating Invitation */}
              <div className={`${styles.heroDeviceCol} ${revealClass(2)}`}>
                <div
                  ref={stageRef}
                  data-testid="device-preview-stage"
                  onPointerMove={handleStageMove}
                  onPointerLeave={handleStageLeave}
                  className={styles.soloInviteStage}
                >
                  <Link
                    href={`/t/${showcaseTemplateId}`}
                    aria-label={
                      lang === "ar"
                        ? "معاينة دعوة الزفاف التفاعلية"
                        : "Preview live wedding invitation"
                    }
                    className={styles.soloInviteFloat}
                    style={{
                      transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
                    }}
                  >
                    <figure className={styles.soloInviteCard}>
                      <video
                        className={styles.soloInviteVideo}
                        src={showcaseVideoUrl}
                        poster={showcasePosterUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div aria-hidden="true" className={styles.soloInviteVeil} />
                      <figcaption className={styles.soloInviteOverlay}>
                        <span className={styles.soloInviteEyebrow}>
                          {lang === "ar" ? "دعوة حفل زفاف" : "THE WEDDING OF"}
                        </span>
                        <span className={styles.soloInviteMonogram}>
                          {lang === "ar" ? "أحمد و سارة" : "Ahmed & Sara"}
                        </span>
                        <span className={styles.soloInviteRule} aria-hidden="true" />
                        <span className={styles.soloInviteMeta}>
                          {lang === "ar"
                            ? "١٤ فبراير ٢٠٢٧ · القاهرة"
                            : "FEBRUARY 14, 2027 · CAIRO"}
                        </span>
                      </figcaption>
                    </figure>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
