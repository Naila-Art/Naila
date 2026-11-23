"use client";

import { useEffect, useRef, useState } from "react";
import type { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface EditorialManifestoProps {
  copy: LandingCopy;
  onToneChange: (tone: "light" | "dark") => void;
}

const SLOT_IMAGES: Record<1 | 2 | 3, [string, string]> = {
  1: ["/assets/hero/hero-1.jpg?v=3", "/assets/hero/hero-4.jpg?v=3"],
  2: ["/assets/hero/hero-3.jpg?v=3", "/assets/hero/hero-2.jpg?v=3"],
  3: ["/assets/hero/hero-2.jpg?v=3", "/assets/hero/hero-1.jpg?v=3"],
};

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

export default function EditorialManifesto({
  copy,
  onToneChange,
}: EditorialManifestoProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(0.55);
      return;
    }

    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const vh = window.innerHeight || 900;
      const rect = el.getBoundingClientRect();
      const totalTravel = Math.max(el.offsetHeight - vh, 1);
      const p = Math.min(1, Math.max(0, -rect.top / totalTravel));
      setProgress(p);

      // Update header tone while manifesto owns the viewport top
      if (rect.top <= 96 && rect.bottom >= vh * 0.55) {
        onToneChange(p >= 0.64 ? "light" : "dark");
      }
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
  }, [onToneChange]);

  // Smooth palette morph from cream #fcf7ed (252,247,237) -> espresso #29231f (41,35,31)
  const darkT = Math.min(1, Math.max(0, (progress - 0.54) / 0.22));
  const bg = `rgb(${lerp(252, 41, darkT)}, ${lerp(247, 35, darkT)}, ${lerp(237, 31, darkT)})`;
  const fg = `rgb(${lerp(47, 252, darkT)}, ${lerp(36, 247, darkT)}, ${lerp(27, 237, darkT)})`;
  const showSecondPhoto = darkT > 0.45;
  const totalSegments = copy.manifesto.segments.length;

  return (
    <section
      ref={sectionRef}
      data-testid="landing-statement"
      data-header-tone={darkT > 0.5 ? "light" : "dark"}
      className={styles.manifestoSection}
    >
      <div
        data-testid="landing-statement-panel"
        className={styles.manifestoSticky}
        style={{ backgroundColor: bg, color: fg }}
      >
        {/* Peeking Watercolor Props */}
        <div className={styles.manifestoSideAssets} aria-hidden="true">
          <div
            className={styles.propBalloons}
            style={{
              opacity: 0.78 - darkT * 0.12,
              transform: `translate(-42%, ${Math.round((progress - 0.5) * -48)}px) rotate(-3deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/props/silver-balloons.png" alt="" />
          </div>
          <div
            className={styles.propEnvelope}
            style={{
              opacity: 0.85 - darkT * 0.1,
              transform: `translate(32%, ${Math.round((progress - 0.5) * 44)}px) rotate(6deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/props/white-envelope.png" alt="" />
          </div>
        </div>

        {/* Word-by-word Kinetic Typography + Inline Crossfading Photo Pills */}
        <p
          data-testid="landing-statement-copy"
          aria-label={copy.manifesto.srLabel}
          className={styles.manifestoCopy}
        >
          {copy.manifesto.segments.map((seg, i) => {
            const start = (i / totalSegments) * 0.52;
            const end = start + 0.085;
            const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
            const opacity = Number((0.16 + local * 0.84).toFixed(3));

            return (
              <span key={`${seg.text}-${i}`}>
                {i > 0 ? " " : ""}
                <span
                  className={`${styles.manifestoWord} ${
                    seg.italic ? styles.manifestoItalic : ""
                  }`}
                  style={{ opacity }}
                >
                  {seg.text}
                </span>
                {seg.imageSlot && (
                  <span
                    aria-hidden="true"
                    className={styles.manifestoInlinePhoto}
                    style={{ opacity }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={SLOT_IMAGES[seg.imageSlot][0]}
                      alt=""
                      className={styles.manifestoImgLayer}
                      style={{ opacity: showSecondPhoto ? 0 : 1 }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={SLOT_IMAGES[seg.imageSlot][1]}
                      alt=""
                      className={styles.manifestoImgLayer}
                      style={{ opacity: showSecondPhoto ? 1 : 0 }}
                    />
                  </span>
                )}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
