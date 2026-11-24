"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface SwitchNarrativeProps {
  copy: LandingCopy;
  onToneChange: (tone: "light" | "dark") => void;
}

type SwitchState = "dot" | "off" | "on";

export default function SwitchNarrative({
  copy,
  onToneChange,
}: SwitchNarrativeProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fadeId = useId().replace(/:/g, "");
  const [state, setState] = useState<SwitchState>("dot");
  const [ribbonProgress, setRibbonProgress] = useState(0.2);
  const [ribbonOpacity, setRibbonOpacity] = useState(1);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const targetPtr = useRef({ x: 0, y: 0 });
  const curPtr = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setState("on");
      setRibbonProgress(1);
      setRibbonOpacity(0);
      return;
    }

    let raf = 0;

    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const vh = window.innerHeight || 900;
      const scrollY = window.scrollY;
      const rect = el.getBoundingClientRect();

      // Ribbon draws smoothly from hero top (0.20) to switch arrival (1.0)
      const heroSpan = Math.max(vh * 0.95, 500);
      const rawDraw = Math.min(1, Math.max(0, scrollY / heroSpan));
      setRibbonProgress(0.2 + rawDraw * 0.8);

      // Switch progress within sticky span
      const travel = Math.max(el.offsetHeight - vh, vh * 0.55);
      const p = Math.min(1, Math.max(0, -rect.top / travel));

      let nextState: SwitchState = "dot";
      if (p >= 0.46) nextState = "on";
      else if (p >= 0.14) nextState = "off";

      setState(nextState);
      setRibbonOpacity(p >= 0.42 ? Math.max(0, 1 - (p - 0.42) * 5) : 1);
      setScrollDepth(p);

      // Update header tone only when this section owns the top edge
      if (rect.top <= 96 && rect.bottom >= 96) {
        onToneChange(nextState === "on" ? "dark" : "light");
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

  // Smooth damped mouse sway for the 3 physical editorial objects while visible
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      targetPtr.current.x = (e.clientX / vw - 0.5) * 2;
      targetPtr.current.y = (e.clientY / vh - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      const el = sectionRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 900;
        const inView = rect.top < vh && rect.bottom > 0;
        if (inView) {
          curPtr.current.x += (targetPtr.current.x - curPtr.current.x) * 0.06;
          curPtr.current.y += (targetPtr.current.y - curPtr.current.y) * 0.06;
          setPointer({ x: curPtr.current.x, y: curPtr.current.y });
          const dx = Math.abs(targetPtr.current.x - curPtr.current.x);
          const dy = Math.abs(targetPtr.current.y - curPtr.current.y);
          if (dx > 0.002 || dy > 0.002) {
            raf = requestAnimationFrame(tick);
            return;
          }
        }
      }
      raf = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const isOn = state === "on";
  const isDot = state === "dot";
  const propsVisible = !isDot;
  const dashOffset = (1 - ribbonProgress).toFixed(4);
  const parallaxBase = (scrollDepth - 0.5) * 56;

  return (
    <>
      {/* Dual-Path Scroll-Drawn Journey Ribbon SVG spanning Hero -> Switch Anchor */}
      <div
        data-testid="landing-hero-journey-lines"
        aria-hidden="true"
        className={styles.journeyRibbonWrap}
        style={{
          opacity: ribbonOpacity,
          transform: `translateY(${Math.round(-ribbonProgress * 40)}px)`,
        }}
      >
        {/* Both ribbons flow straight down past the hero copy (never looping
            around it) and dissolve through a vertical fade as they reach the
            next section. */}

        {/* Mobile Ribbon */}
        <svg
          viewBox="0 0 390 3580"
          preserveAspectRatio="none"
          className={styles.journeySvgMobile}
        >
          <defs>
            <linearGradient
              id={`${fadeId}-m`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2="2100"
            >
              <stop offset="0" stopColor="#fcf7ed" stopOpacity="1" />
              <stop offset="0.5" stopColor="#fcf7ed" stopOpacity="1" />
              <stop offset="0.8" stopColor="#fcf7ed" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fcf7ed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M318 -60 C 372 110 384 300 352 500 C 320 700 232 840 206 1030 C 184 1200 214 1360 200 1540 C 190 1700 196 1900 196 2100"
            fill="none"
            opacity="0.78"
            pathLength={1}
            stroke={`url(#${fadeId}-m)`}
            strokeLinecap="round"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: "1 1", strokeDashoffset: dashOffset }}
          />
          <path
            d="M336 -60 C 388 120 398 315 364 515 C 330 715 246 860 222 1045 C 202 1210 228 1370 212 1550 C 202 1710 200 1900 198 2100"
            fill="none"
            opacity="0.38"
            pathLength={1}
            stroke={`url(#${fadeId}-m)`}
            strokeLinecap="round"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: "1 1", strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* Desktop Ribbon */}
        <svg
          viewBox="0 0 1440 3200"
          preserveAspectRatio="none"
          className={styles.journeySvgDesktop}
        >
          <defs>
            <linearGradient
              id={`${fadeId}-d`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2="1420"
            >
              <stop offset="0" stopColor="#fcf7ed" stopOpacity="1" />
              <stop offset="0.6" stopColor="#fcf7ed" stopOpacity="1" />
              <stop offset="0.85" stopColor="#fcf7ed" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fcf7ed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M985 -80 C 1125 60 1235 225 1205 425 C 1175 625 1060 765 900 865 C 760 955 700 1065 718 1200 C 730 1300 722 1370 720 1420"
            fill="none"
            opacity="0.78"
            pathLength={1}
            stroke={`url(#${fadeId}-d)`}
            strokeLinecap="round"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: "1 1", strokeDashoffset: dashOffset }}
          />
          <path
            d="M1012 -80 C 1155 70 1262 240 1230 435 C 1198 635 1080 785 918 885 C 782 970 724 1078 740 1210 C 750 1305 730 1375 722 1420"
            fill="none"
            opacity="0.38"
            pathLength={1}
            stroke={`url(#${fadeId}-d)`}
            strokeLinecap="round"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: "1 1", strokeDashoffset: dashOffset }}
          />
        </svg>
      </div>

      {/* 3-State Scroll-Linked Switch Narrative Section */}
      <section
        ref={sectionRef}
        data-testid="landing-hero-transition"
        data-state={state}
        data-header-tone={isOn ? "dark" : "light"}
        className={styles.switchSection}
      >
        <div className={styles.switchStickyPanel}>
          {/* Paint Surfaces: Warm Taupe Veil -> Warm Cream Ivory */}
          <div className={styles.switchPaintWrap} aria-hidden="true">
            <div
              className={styles.switchTaupeVeil}
              style={{ opacity: isDot ? 0 : 1 }}
            />
            <div
              className={styles.switchIvorySurface}
              style={{ opacity: isOn ? 1 : 0 }}
            />
          </div>

          {/* Enhanced Peeking Watercolor Editorial Objects — Staggered Entrance + Scroll/Pointer Parallax + Living Idle Physics */}
          <div className={styles.switchSideAssets} aria-hidden="true">
            {/* Gold Wax Seal (Top-Left) */}
            <div
              className={`${styles.propWaxSeal} ${
                propsVisible ? styles.propWaxSealIn : ""
              }`}
            >
              <div
                className={styles.propParallaxPlane}
                style={{
                  transform: `translate3d(${(pointer.x * 12).toFixed(1)}px, ${(
                    parallaxBase * 0.72 +
                    pointer.y * 8
                  ).toFixed(1)}px, 0) rotate(${(
                    (scrollDepth - 0.5) * 14 +
                    pointer.x * 3.5
                  ).toFixed(2)}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/props/gold-wax-seal.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={styles.propWaxSealAlive}
                />
              </div>
            </div>

            {/* Burgundy Satin Bow (Bottom-Left — living silk breeze motion) */}
            <div
              className={`${styles.propBurgundyBow} ${
                propsVisible ? styles.propBurgundyBowIn : ""
              }`}
            >
              <div
                className={styles.propParallaxPlane}
                style={{
                  transform: `translate3d(${(pointer.x * 16).toFixed(1)}px, ${(
                    -parallaxBase * 0.88 +
                    pointer.y * 10
                  ).toFixed(1)}px, 0) rotate(${(
                    (0.5 - scrollDepth) * 10 +
                    pointer.x * -4
                  ).toFixed(2)}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/props/burgundy-bow.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={styles.propBurgundyBowAlive}
                />
              </div>
            </div>

            {/* White Gardenia Botanical Sprig (Right — gentle stem-base breeze sway) */}
            <div
              className={`${styles.propGardeniaSprig} ${
                propsVisible ? styles.propGardeniaSprigIn : ""
              }`}
            >
              <div
                className={styles.propParallaxPlane}
                style={{
                  transform: `translate3d(${(pointer.x * -14).toFixed(1)}px, ${(
                    parallaxBase * 0.65 +
                    pointer.y * 9
                  ).toFixed(1)}px, 0) rotate(${(
                    (scrollDepth - 0.5) * -12 +
                    pointer.x * -3.5
                  ).toFixed(2)}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/props/gardenia-sprig.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={styles.propGardeniaSprigAlive}
                />
              </div>
            </div>
          </div>

          {/* Center Composition */}
          <div className={styles.switchComposition}>
            <div className="sr-only">
              <h2>{copy.switchSection.srHeading}</h2>
              <p>{copy.switchSection.srSub}</p>
            </div>

            {/* Interactive Mechanical Switch Indicator */}
            <div
              aria-hidden="true"
              className={styles.switchRow}
              style={{ color: isOn ? "#2f241b" : "#fcf7ed" }}
            >
              <span
                className={styles.switchLabelStage}
                style={{
                  opacity: isDot ? 0 : 1,
                  transform: isDot ? "translate(0px, 0px)" : "translate(-32px, 0px)",
                }}
              >
                <span className={styles.switchLabelText}>
                  {copy.switchSection.label}
                </span>
              </span>

              <span
                className={styles.switchTrackStage}
                style={{
                  transform: isDot ? "translate(0px, 0px)" : "translate(74px, 0px)",
                }}
              >
                <span
                  className={styles.switchPill}
                  style={{
                    width: isDot ? "1.75rem" : "3rem",
                  }}
                >
                  <span className={styles.switchTrackBg} />
                  <span
                    className={styles.switchKnob}
                    style={{
                      transform: isDot
                        ? "translate(-50%, 0)"
                        : isOn
                        ? "translate(-50%, 0) translateX(11px)"
                        : "translate(-50%, 0) translateX(-11px)",
                    }}
                  />
                </span>
              </span>
            </div>

            {/* Dual Crossfading Headlines */}
            <div className={styles.switchCopyStage}>
              <div
                aria-hidden="true"
                className={`${styles.switchCopyBlock} ${styles.switchCopyOff}`}
                style={{
                  opacity: isOn ? 0 : 1,
                  transform: isOn ? "translateY(-10px)" : "translateY(0)",
                }}
              >
                <h2 className={styles.switchHeadline}>
                  {copy.switchSection.offHeadline}
                </h2>
                <p className={styles.switchSubCopy}>
                  {copy.switchSection.offSub}
                </p>
              </div>

              <div
                aria-hidden="true"
                className={`${styles.switchCopyBlock} ${styles.switchCopyOn}`}
                style={{
                  opacity: isOn ? 1 : 0,
                  transform: isOn ? "translateY(0)" : "translateY(10px)",
                }}
              >
                <h2 className={styles.switchHeadline}>
                  {copy.switchSection.onHeadlineStart}
                  <span className={styles.switchAccent}>
                    {copy.switchSection.onHeadlineAccent}
                  </span>
                </h2>
                <p className={styles.switchSubCopy}>
                  {copy.switchSection.onSub}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
