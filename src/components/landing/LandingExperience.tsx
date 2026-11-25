"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { LandingEntranceProvider } from "./IntroCurtain";
import LandingHeader, { type FooterHandoffState } from "./LandingHeader";
import HeroSection from "./HeroSection";
import SwitchNarrative from "./SwitchNarrative";
import EditorialShowcase, { type ShowcaseCardItem } from "./EditorialShowcase";
import OccasionRows from "./OccasionRows";
import EditorialManifesto from "./EditorialManifesto";
import FeaturesBento from "./FeaturesBento";
import PricingReviewsSplit from "./PricingReviewsSplit";
import FaqAccordion from "./FaqAccordion";
import LandingFooter from "./LandingFooter";
import { LANDING_COPY, formatLandingPrice, type Currency } from "./copy";
import { TEMPLATE_EDITORIAL_META, templateDisplayName } from "@/lib/templates";
import { packageDisplayPoints } from "@/components/store/storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { SAMPLES, sampleLink } from "@/lib/samples";
import type { Pricing } from "@/lib/pricing";
import type { Template } from "@/lib/types";
import styles from "./landing.module.css";
import { localeHref } from "@/lib/locale";

interface LandingExperienceProps {
  brand: string;
  templates: Template[];
  pricing: Pricing;
  whatsappUrl?: string;
}

const SAMPLE_MAT_PALETTES = [
  { matColor: "#f3ecdf", inkColor: "#2f241b", poster: "/hero/desktop-start.jpg" },
  { matColor: "#141f2c", inkColor: "#1d2c42", poster: "/showcase/amalfi-end.jpg" },
  { matColor: "#f7e87a", inkColor: "#2f241b", poster: "/showcase/gardenia-end.jpg" },
  { matColor: "#f3ece1", inkColor: "#2f241b", poster: "/showcase/barakah-end.jpg" },
];

const INITIAL_HANDOFF: FooterHandoffState = {
  progress: 0,
  brandDx: 0,
  brandDy: 0,
  brandScale: 1,
  ctaDx: 0,
  ctaDy: 0,
  ctaScale: 1,
  docked: false,
};

function easeInOutSine(t: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function templatePreviewVideoUrl(videoUrl?: string): string | undefined {
  if (!videoUrl) return undefined;
  if (videoUrl.startsWith("/templates/") && videoUrl.endsWith("/opening.mp4")) {
    return videoUrl.replace(/\/opening\.mp4$/, "/preview.mp4");
  }
  return videoUrl;
}

export default function LandingExperience({
  brand,
  templates,
  pricing,
  whatsappUrl,
}: LandingExperienceProps) {
  const { lang, setLang } = useSiteLang();
  const [currency, setCurrency] = useState<Currency>("EGP");
  const [headerTone, setHeaderTone] = useState<"light" | "dark">("light");
  const [scrolled, setScrolled] = useState(false);
  const [handoff, setHandoff] = useState<FooterHandoffState>(INITIAL_HANDOFF);

  // Refs for real-time Header -> Footer shared-element FLIP handoff
  const headerBrandRef = useRef<HTMLAnchorElement | null>(null);
  const headerCtasRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const footerBrandSlotRef = useRef<HTMLAnchorElement | null>(null);
  const footerCtasSlotRef = useRef<HTMLDivElement | null>(null);

  const copy = LANDING_COPY[lang];
  const isRtl = lang === "ar";

  // Smooth momentum scroll via Lenis (disabled automatically under prefers-reduced-motion)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // Coordinate scrolled state, light/dark tone, and silky damped Header -> Footer FLIP handoff
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let targetP = 0;
    let smoothP = 0;
    let lastAtBottom = false;

    const readTranslate = (el: HTMLElement) => {
      const tf = getComputedStyle(el).transform;
      if (!tf || tf === "none") return { x: 0, y: 0 };
      const m = new DOMMatrix(tf);
      return { x: m.m41, y: m.m42 };
    };

    const sampleScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight || 900;
      setScrolled(y > 40);

      if (y < vh * 0.65) {
        setHeaderTone("light");
      } else {
        const templatesEl = document.getElementById("templates");
        const featuresEl = document.getElementById("features");
        if (templatesEl) {
          const tRect = templatesEl.getBoundingClientRect();
          if (tRect.top <= 96 && tRect.bottom >= 96) {
            setHeaderTone("dark");
          }
        }
        if (featuresEl) {
          const fRect = featuresEl.getBoundingClientRect();
          if (fRect.top <= 96) {
            setHeaderTone("dark");
          }
        }
      }

      const fEl = footerRef.current;
      if (!fEl) return;

      const fRect = fEl.getBoundingClientRect();
      const footerH = fEl.offsetHeight || 900;
      // Exact viewport Y of the footer top edge at the bottom of the page
      const endY = vh - footerH;
      // Wide scroll span (~860px desktop) so the header CTA glide stays unhurried and velvety
      const scrollSpan = Math.max(520, Math.min(vh * 0.98, footerH * 0.96));
      const remaining = Math.max(0, fRect.top - endY);
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      lastAtBottom = maxScroll > 0 && y >= maxScroll - 8;
      targetP = lastAtBottom
        ? 1
        : Math.min(1, Math.max(0, 1 - remaining / scrollSpan));
    };

    const tick = () => {
      raf = 0;
      sampleScroll();

      const vh = window.innerHeight || 900;
      const vw = window.innerWidth || 1440;
      const fEl = footerRef.current;
      if (!fEl) return;

      if (reduced || vw < 640) {
        smoothP = targetP;
        setHandoff({
          progress: smoothP,
          brandDx: 0,
          brandDy: 0,
          brandScale: 1,
          ctaDx: 0,
          ctaDy: 0,
          ctaScale: 1,
          docked: smoothP >= 0.55,
        });
        return;
      }

      // Liquid editorial inertia: gently chases scroll progress so fast wheel flicks never drop abruptly
      const dp = targetP - smoothP;
      let keepRunning = false;
      if (Math.abs(dp) > 0.0007) {
        smoothP += dp * 0.075;
        keepRunning = true;
      } else {
        smoothP = targetP;
      }

      if (smoothP <= 0.001 && targetP <= 0.001) {
        setHandoff((prev) => (prev.progress === 0 ? prev : INITIAL_HANDOFF));
        if (keepRunning) raf = requestAnimationFrame(tick);
        return;
      }

      const fRect = fEl.getBoundingClientRect();
      const footerH = fEl.offsetHeight || 900;
      const endY = vh - footerH;

      const easedX = easeInOutSine(smoothP);
      // Slightly gentler vertical easing keeps buttons gliding effortlessly without dipping low
      const easedY = Math.pow(easedX, 1.12);
      // Sub-pixel convergence blend in the final 8% so docking never shifts by a single pixel
      const tailBlend = Math.min(1, Math.max(0, (smoothP - 0.92) / 0.08));

      const hBrand = headerBrandRef.current;
      const fBrand = footerBrandSlotRef.current;
      const hCtas = headerCtasRef.current;
      const fCtas = footerCtasSlotRef.current;

      let brandDx = 0;
      let brandDy = 0;
      let ctaDx = 0;
      let ctaDy = 0;

      if (hBrand && fBrand) {
        const hRect = hBrand.getBoundingClientRect();
        const fBrandRect = fBrand.getBoundingClientRect();
        const cur = readTranslate(hBrand);
        const baseX = hRect.left - cur.x;
        const baseY = hRect.top - cur.y;
        const finalBrandY = endY + (fBrandRect.top - fRect.top);
        const targetBrandY =
          finalBrandY + (fBrandRect.top - finalBrandY) * tailBlend;
        brandDx = (fBrandRect.left - baseX) * easedX;
        brandDy = (targetBrandY - baseY) * easedY;
      }

      if (hCtas && fCtas) {
        const hRect = hCtas.getBoundingClientRect();
        const fCtaRect = fCtas.getBoundingClientRect();
        const cur = readTranslate(hCtas);
        const baseCenterX = hRect.left - cur.x + hRect.width / 2;
        const baseCenterY = hRect.top - cur.y + hRect.height / 2;
        const targetCenterX = fCtaRect.left + fCtaRect.width / 2;
        const liveCenterY = fCtaRect.top + fCtaRect.height / 2;
        // Aim directly at the final resting viewport Y so buttons NEVER overshoot downward mid-scroll
        const finalCenterY =
          endY + (fCtaRect.top - fRect.top) + fCtaRect.height / 2;
        const targetCenterY =
          finalCenterY + (liveCenterY - finalCenterY) * tailBlend;
        // Soft, buoyant mid-flight lift keeps the arc graceful and airy
        const arcLift = -12 * Math.sin(Math.PI * easedX);
        ctaDx = (targetCenterX - baseCenterX) * easedX;
        ctaDy = (targetCenterY - baseCenterY) * easedY + arcLift;
      }

      const brandScale = 1 + 0.04 * Math.sin(Math.PI * easedX);
      const ctaScale = 1 + 0.022 * Math.sin(Math.PI * easedX);
      const docked = smoothP >= 0.992 && (targetP >= 0.992 || lastAtBottom);

      setHandoff({
        progress: smoothP,
        brandDx,
        brandDy,
        brandScale,
        ctaDx,
        ctaDy,
        ctaScale,
        docked,
      });

      if (keepRunning) {
        raf = requestAnimationFrame(tick);
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, []);

  const handleToneChange = useCallback((tone: "light" | "dark") => {
    setHeaderTone(tone);
  }, []);

  const activePackages = useMemo(
    () => pricing.packages.filter((p) => p.active),
    [pricing.packages]
  );

  const startingPriceEgp = useMemo(() => {
    const selfPkg = activePackages.find((p) => p.id === 1) ?? activePackages[0];
    return selfPkg?.price ?? 1500;
  }, [activePackages]);

  const templateToCard = useCallback(
    (tpl: Template): ShowcaseCardItem => {
      const meta = TEMPLATE_EDITORIAL_META[tpl.id];
      return {
        id: tpl.id,
        href: localeHref(lang, `/t/${tpl.id}`),
        title: templateDisplayName(tpl, lang),
        eyebrow: meta
          ? lang === "ar"
            ? meta.eyebrowAr
            : meta.eyebrowEn
          : lang === "ar"
          ? "دعوة رقمية"
          : "Digital invitation",
        description: meta
          ? lang === "ar"
            ? meta.taglineAr
            : meta.taglineEn
          : lang === "ar"
          ? "فتحة ختم شمع سينمائية، موسيقى مختارة، وتأكيد حضور فوري."
          : "Animated opening invitation with curated typography, music, and live RSVP.",
        posterUrl: tpl.posterUrl,
        videoUrl: tpl.videoUrl,
        previewVideoUrl: templatePreviewVideoUrl(tpl.videoUrl),
        frameBg: meta?.cardFrame ?? tpl.theme.background,
      };
    },
    [lang]
  );

  const sampleCards = useMemo<ShowcaseCardItem[]>(() => {
    return SAMPLES.map((sample, idx) => {
      const pkg = pricing.packages.find((p) => p.id === sample.packageId);
      const pal = SAMPLE_MAT_PALETTES[idx % SAMPLE_MAT_PALETTES.length];
      const couple =
        lang === "ar"
          ? `${sample.event.partnerA} و ${sample.event.partnerB}`
          : `${sample.event.partnerA} & ${sample.event.partnerB}`;
      const priceStr = pkg
        ? formatLandingPrice(pkg.price, currency, lang)
        : "";
      const tierNamesEn: Record<number, string> = {
        1: "The Essential",
        2: "The Signature",
        3: "The Tailored",
        4: "The Bespoke",
      };
      const title =
        lang === "ar"
          ? pkg?.name ?? `باقة ${sample.packageId}`
          : tierNamesEn[sample.packageId] ?? pkg?.name ?? `Suite ${sample.packageId}`;
      const descPoints = pkg ? packageDisplayPoints(pkg, lang).slice(0, 2) : [];

      return {
        id: sample.slug,
        href: sampleLink(sample.packageId),
        external: true,
        title,
        eyebrow: `${copy.samples.eyebrow} · ${priceStr}`,
        description:
          descPoints.length > 0
            ? descPoints.join(" · ")
            : lang === "ar"
            ? "افتحي الدعوة على موبايلك وعيشي اللحظة زي ما ضيوفك هيشوفوها."
            : "Open the live invitation on your phone and feel the reveal.",
        posterUrl: pal.poster,
        stationery: {
          couple,
          venue: sample.event.venueName,
          dateLabel:
            lang === "ar"
              ? sample.event.venueAddress ?? "القاهرة"
              : `${sample.event.venueAddress ?? "Cairo"} · 7:00 PM`,
          matColor: pal.matColor,
          inkColor: pal.inkColor,
        },
      };
    });
  }, [pricing.packages, currency, lang, copy.samples.eyebrow]);

  return (
    <LandingEntranceProvider wordmark={brand}>
      <main
        className={styles.landingMain}
        dir={isRtl ? "rtl" : "ltr"}
        lang={lang}
      >
        <LandingHeader
          brand={brand}
          copy={copy}
          lang={lang}
          onLangChange={setLang}
          currency={currency}
          onCurrencyChange={setCurrency}
          startingPriceEgp={startingPriceEgp}
          tone={headerTone}
          scrolled={scrolled}
          handoff={handoff}
          brandRef={headerBrandRef}
          ctasRef={headerCtasRef}
        />

        {/* Dark Hero + Dual Journey Ribbon + 3-State Switch Narrative Wrapper */}
        <div className={styles.heroSwitchWrapper}>
          <HeroSection
            copy={copy}
            lang={lang}
            currency={currency}
            startingPriceEgp={startingPriceEgp}
          />
          <SwitchNarrative copy={copy} onToneChange={handleToneChange} />
        </div>

        {/* Dual Showcases: Wedding Invitations (3:4) + Live Sample Suites (4:5) */}
        <div className={styles.showcasesWrapper}>
          <EditorialShowcase
            id="templates"
            title={copy.templates.title}
            subtitle={copy.templates.subtitle}
            aspect="landscape"
          >
            <OccasionRows
              templates={templates}
              toCard={templateToCard}
              copy={copy.templates}
              lang={lang}
            />
          </EditorialShowcase>

          <EditorialShowcase
            id="save-the-dates"
            title={copy.samples.title}
            subtitle={copy.samples.subtitle}
            aspect="portrait"
            items={sampleCards}
          />
        </div>

        {/* 380svh Pinned Kinetic Manifesto with Light -> Dark Morph */}
        <EditorialManifesto copy={copy} onToneChange={handleToneChange} />

        {/* Lower Editorial Stack sliding upward over the Espresso Manifesto */}
        <div className={styles.lowerEditorialStack}>
          <FeaturesBento copy={copy} />
          <PricingReviewsSplit
            copy={copy}
            lang={lang}
            currency={currency}
            packages={pricing.packages}
            steps={pricing.steps}
          />
          <FaqAccordion copy={copy} />
          <LandingFooter
            brand={brand}
            copy={copy}
            lang={lang}
            currency={currency}
            startingPriceEgp={startingPriceEgp}
            whatsappUrl={whatsappUrl}
            footerRef={footerRef}
            brandSlotRef={footerBrandSlotRef}
            ctasSlotRef={footerCtasSlotRef}
            handoffDocked={handoff.docked}
            assembleProgress={handoff.progress}
          />
        </div>
      </main>
    </LandingEntranceProvider>
  );
}
