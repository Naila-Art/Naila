"use client";

import { useEffect, useRef, useState } from "react";
import {
  AtelierKeyCrest,
  CelestialChoreographyCrest,
  GlobalMeridianCrest,
  GuestLedgerCrest,
  InterlockedLinkCrest,
  WaxSealedNoteCrest,
} from "./EditorialIcons";
import type { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface FeaturesBentoProps {
  copy: LandingCopy;
}

export default function FeaturesBento({ copy }: FeaturesBentoProps) {
  const { features } = copy;
  const { cards } = features;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [scrollP, setScrollP] = useState(0.5);

  // Continuous scroll-linked choreography for all Bento internal components
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setScrollP(0.65);
      return;
    }

    let raf = 0;
    const update = () => {
      const el = gridRef.current;
      if (!el) return;
      const vh = window.innerHeight || 900;
      const rect = el.getBoundingClientRect();
      // 0 when grid enters bottom of screen -> 1 as grid reaches upper viewport
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height * 0.35)));
      setScrollP(p);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Derived scroll kinematics for Card 5 (Domain & Rings) and sibling cards
  const domainProgress = Math.min(1, Math.max(0, (scrollP - 0.12) / 0.65));
  const ringsY = 34 - domainProgress * 42;
  const ringsRot = -15 + domainProgress * 19;
  const ringsScale = 0.86 + domainProgress * 0.2;
  const urlX = (1 - domainProgress) * -18;
  const urlShimmerX = -110 + scrollP * 260;

  const noteLift = (0.5 - scrollP) * 18;
  const timelineFill = Math.min(100, Math.max(12, Math.round(scrollP * 125)));

  return (
    <section
      id="features"
      aria-labelledby="landing-features-title"
      data-header-tone="dark"
      className={styles.featuresSection}
    >
      <div className={styles.featuresHeaderWrap}>
        <div className={styles.featuresHeaderInner}>
          <p className={styles.eyebrowBronze}>{features.eyebrow}</p>
          <h2 id="landing-features-title" className={styles.featuresH2}>
            {features.title}
          </h2>
          <p className={styles.featuresLead}>{features.subtitle}</p>
        </div>
      </div>

      <div ref={gridRef} className={styles.featuresGridWrap}>
        <div className={styles.featuresGrid}>
          {/* Card 1: Global Multilingual + Spinning 3D Globe Video */}
          <article className={`${styles.bentoCard} ${styles.bentoCardWhite}`}>
            <div className={styles.bentoHead}>
              <div className={styles.bentoMedallion}>
                <GlobalMeridianCrest />
              </div>
              <h3 className={styles.bentoTitle}>{cards.global.title}</h3>
            </div>
            <p className={styles.bentoDesc}>{cards.global.body}</p>
            <div aria-hidden="true" className={styles.bentoGlobeWrap}>
              <video
                className={styles.bentoGlobeVideo}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              >
                <source src="/videos/globe-spinning-ivory.mp4" type="video/mp4" />
              </video>
            </div>
          </article>

          {/* Card 2: Guests & RSVPs Together (Scroll-staggered rows) */}
          <article className={styles.bentoCard}>
            <div className={styles.bentoHead}>
              <div className={styles.bentoMedallion}>
                <GuestLedgerCrest />
              </div>
              <h3 className={styles.bentoTitle}>{cards.guests.title}</h3>
            </div>
            <p className={styles.bentoDesc}>{cards.guests.body}</p>
            <div aria-hidden="true" className={styles.bentoGuestStack}>
              {cards.guests.rows.map((row, idx) => {
                const rowP = Math.min(1, Math.max(0, (scrollP - idx * 0.08) / 0.45));
                return (
                  <div
                    key={row}
                    className={styles.bentoGuestRow}
                    style={{
                      opacity: 0.45 + rowP * 0.55,
                      transform: `translate3d(${((1 - rowP) * 14).toFixed(1)}px, 0, 0)`,
                    }}
                  >
                    <span className={styles.bentoGuestNum}>{idx + 2}</span>
                    <span className={styles.bentoGuestName}>{row}</span>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Card 3: Every Moment Choreographed Timeline (Scroll-drawn stem) */}
          <article className={styles.bentoCard}>
            <div className={styles.bentoHead}>
              <div className={styles.bentoMedallion}>
                <CelestialChoreographyCrest />
              </div>
              <h3 className={styles.bentoTitle}>{cards.events.title}</h3>
            </div>
            <p className={styles.bentoDesc}>{cards.events.body}</p>
            <div aria-hidden="true" className={styles.bentoTimeline}>
              <span className={styles.bentoTimelineLine} />
              <span
                className={styles.bentoTimelineProgress}
                style={{ height: `${timelineFill}%` }}
              />
              {cards.events.steps.map((step, idx) => {
                const active = scrollP >= 0.18 + idx * 0.16;
                return (
                  <div
                    key={step.label}
                    className={styles.bentoTimelineItem}
                    style={{ opacity: active ? 1 : 0.48 }}
                  >
                    <span
                      className={`${styles.bentoTimelineDot} ${
                        active ? styles.bentoTimelineDotLit : ""
                      }`}
                    />
                    <p className={styles.bentoTimelineEyebrow}>{step.label}</p>
                    <p className={styles.bentoTimelineLabel}>{step.title}</p>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Card 4: Personal Notes Miniature Stationery Frame (Scroll-lifted card) */}
          <article className={styles.bentoCard}>
            <div className={styles.bentoHead}>
              <div className={styles.bentoMedallion}>
                <WaxSealedNoteCrest />
              </div>
              <h3 className={styles.bentoTitle}>{cards.notes.title}</h3>
            </div>
            <p className={styles.bentoDesc}>{cards.notes.body}</p>
            <div aria-hidden="true" className={styles.bentoNoteMat}>
              <div
                className={styles.bentoNoteInner}
                style={{
                  transform: `translate3d(0, ${noteLift.toFixed(1)}px, 0) scale(${(
                    0.96 +
                    domainProgress * 0.05
                  ).toFixed(3)})`,
                }}
              >
                <p className={styles.bentoNoteEyebrow}>{cards.notes.eyebrow}</p>
                <p className={styles.bentoNoteCaption}>{cards.notes.caption}</p>
              </div>
            </div>
          </article>

          {/* Card 5: Share on WhatsApp / Custom Link — Full Scroll-Choreographed Vignette */}
          <article className={styles.bentoCard}>
            <div className={styles.bentoHead}>
              <div className={styles.bentoMedallion}>
                <InterlockedLinkCrest />
              </div>
              <h3 className={styles.bentoTitle}>{cards.domain.title}</h3>
            </div>
            <p className={styles.bentoDesc}>{cards.domain.body}</p>
            <div aria-hidden="true" className={styles.bentoDomainCard}>
              {/* Warm Golden Ambient Halo reacting to scroll */}
              <div
                className={styles.bentoDomainGlow}
                style={{
                  opacity: 0.22 + domainProgress * 0.55,
                  transform: `scale(${(0.85 + domainProgress * 0.35).toFixed(2)})`,
                }}
              />

              {/* Scroll-gliding Frosted URL Bar with Traveling Specular Sweep */}
              <div
                className={styles.bentoDomainBar}
                dir="ltr"
                style={{
                  opacity: 0.45 + domainProgress * 0.55,
                  transform: `translate3d(${urlX.toFixed(1)}px, 0, 0)`,
                }}
              >
                <span className={styles.bentoDomainDot} />
                <span className={styles.bentoDomainText}>
                  {cards.domain.url}
                </span>
                <span className={styles.bentoDomainCaret} />
                <span
                  className={styles.bentoDomainSweep}
                  style={{
                    transform: `translateX(${urlShimmerX.toFixed(0)}%) skewX(-22deg)`,
                  }}
                />
              </div>

              {/* Scroll-rising, Rotating & Blooming Heirloom Gold Wedding Rings */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/props/gold-rings.jpg"
                alt=""
                loading="lazy"
                className={styles.bentoDomainRings}
                style={{
                  transform: `translate3d(${((1 - domainProgress) * 16).toFixed(
                    1
                  )}px, ${ringsY.toFixed(1)}px, 0) rotate(${ringsRot.toFixed(
                    2
                  )}deg) scale(${ringsScale.toFixed(3)})`,
                  opacity: 0.55 + domainProgress * 0.42,
                }}
              />
            </div>
          </article>

          {/* Card 6: Zero Passwords Overlapping Monogram Avatars (Scroll fan-in) */}
          <article className={styles.bentoCard}>
            <div className={styles.bentoHead}>
              <div className={styles.bentoMedallion}>
                <AtelierKeyCrest />
              </div>
              <h3 className={styles.bentoTitle}>{cards.manage.title}</h3>
            </div>
            <p className={styles.bentoDesc}>{cards.manage.body}</p>
            <div aria-hidden="true" className={styles.bentoAvatarsStage}>
              <div className={styles.bentoAvatarsRow}>
                {cards.manage.initials.map((ch, idx) => {
                  const spread = (idx - 1) * (1 - domainProgress) * 18;
                  return (
                    <span
                      key={`${ch}-${idx}`}
                      className={styles.bentoAvatar}
                      style={{
                        zIndex: 3 - idx,
                        transform: `translate3d(${spread.toFixed(1)}px, 0, 0)`,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
