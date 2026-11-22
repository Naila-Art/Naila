"use client";

import { useEffect, useRef, useState } from "react";
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
        {/* Mobile Ribbon */}
        <svg
          viewBox="0 0 390 3580"
          preserveAspectRatio="none"
          className={styles.journeySvgMobile}
        >
          <path
            d="M300 -60 C 270 85 165 150 120 315 C 75 470 145 620 260 680 C 335 720 335 900 295 1065 C 250 1230 155 1290 125 1190 C 95 1085 185 1025 255 1100 C 315 1180 295 1480 220 1750 C 170 1940 190 2150 195 2273"
            fill="none"
            opacity="0.78"
            pathLength={1}
            stroke="#fcf7ed"
            strokeLinecap="round"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: "1 1", strokeDashoffset: dashOffset }}
          />
          <path
            d="M316 -60 C 285 95 180 165 137 330 C 92 480 160 610 267 660 C 330 700 330 890 280 1050 C 240 1210 170 1265 142 1175 C 115 1095 195 1045 250 1115 C 305 1190 280 1465 205 1735 C 155 1930 190 2150 195 2273"
            fill="none"
            opacity="0.38"
            pathLength={1}
            stroke="#fcf7ed"
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
          <path
            d="M900 -80 C 810 45 680 135 570 290 C 455 450 480 600 680 650 C 880 700 1030 585 1065 370 C 1095 180 990 90 885 190 C 760 305 760 530 805 745 C 850 940 790 1110 738 1245 C 724 1280 720 1306 720 1326"
            fill="none"
            opacity="0.78"
            pathLength={1}
            stroke="#fcf7ed"
            strokeLinecap="round"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{ strokeDasharray: "1 1", strokeDashoffset: dashOffset }}
          />
          <path
            d="M925 -80 C 830 55 695 150 590 305 C 480 460 510 585 695 630 C 875 675 1005 565 1040 365 C 1070 195 985 115 900 205 C 785 320 785 525 830 730 C 875 925 810 1100 750 1235 C 728 1275 720 1306 720 1326"
            fill="none"
            opacity="0.38"
            pathLength={1}
            stroke="#fcf7ed"
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
