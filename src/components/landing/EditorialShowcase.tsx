"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./landing.module.css";

export interface ShowcaseCardItem {
  id: string;
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  posterUrl?: string;
  videoUrl?: string;
  frameBg?: string;
  badge?: string;
  external?: boolean;
  /** Optional stylized letterpress mat mode for portrait stationery cards */
  stationery?: {
    couple: string;
    venue: string;
    dateLabel: string;
    matColor: string;
    inkColor: string;
  };
}

interface EditorialShowcaseProps {
  id: string;
  title: string;
  subtitle: string;
  carouselLabel: string;
  gridLabel: string;
  prevAria: string;
  nextAria: string;
  aspect: "landscape" | "portrait";
  items: ShowcaseCardItem[];
}

export default function EditorialShowcase({
  id,
  title,
  subtitle,
  carouselLabel,
  gridLabel,
  prevAria,
  nextAria,
  aspect,
  items,
}: EditorialShowcaseProps) {
  const [view, setView] = useState<"carousel" | "grid">("carousel");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const syncButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setCanPrev(pos > 8);
    setCanNext(pos < maxScroll - 8);
  }, []);

  useEffect(() => {
    syncButtons();
    window.addEventListener("resize", syncButtons);
    return () => window.removeEventListener("resize", syncButtons);
  }, [syncButtons, view, items.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const isRtl = getComputedStyle(el).direction === "rtl";
    const step = Math.max(300, Math.round(el.clientWidth * 0.72));
    el.scrollBy({
      left: dir * step * (isRtl ? -1 : 1),
      behavior: "smooth",
    });
  };

  return (
    <section
      id={id}
      data-header-tone="dark"
      className={`${styles.showcaseSection} ${
        aspect === "portrait" ? styles.showcaseSectionCompact : ""
      }`}
    >
      <div className={styles.showcaseWrap}>
        {/* Editorial Heading + Segmented Carousel/Grid Toggle */}
        <div className={styles.showcaseHeader}>
          <div className={styles.showcaseHeadingGroup}>
            <h2 className={styles.showcaseH2}>{title}</h2>
            <p className={styles.showcaseSubtitle}>{subtitle}</p>
          </div>

          <div
            role="group"
            aria-label={`${title} layout`}
            data-active={view}
            className={styles.viewToggleLedger}
          >
            <span aria-hidden="true" className={styles.viewToggleBar} />
            <button
              type="button"
              aria-pressed={view === "carousel"}
              onClick={() => setView("carousel")}
              className={`${styles.viewToggleTab} ${
                view === "carousel" ? styles.viewToggleTabActive : ""
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
                className={styles.viewToggleIcon}
              >
                <rect
                  x="4.5"
                  y="3.2"
                  width="9"
                  height="11.6"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M1.8 5.2v7.6M16.2 5.2v7.6"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.65"
                />
              </svg>
              <span>{carouselLabel}</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`${styles.viewToggleTab} ${
                view === "grid" ? styles.viewToggleTabActive : ""
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
                className={styles.viewToggleIcon}
              >
                <rect
                  x="2.6"
                  y="2.6"
                  width="5.2"
                  height="5.2"
                  rx="0.9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <rect
                  x="10.2"
                  y="2.6"
                  width="5.2"
                  height="5.2"
                  rx="0.9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <rect
                  x="2.6"
                  y="10.2"
                  width="5.2"
                  height="5.2"
                  rx="0.9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <rect
                  x="10.2"
                  y="10.2"
                  width="5.2"
                  height="5.2"
                  rx="0.9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
              <span>{gridLabel}</span>
            </button>
          </div>
        </div>

        {/* Cards Track / Grid */}
        <div
          ref={trackRef}
          onScroll={syncButtons}
          data-view={view}
          className={
            view === "carousel" ? styles.showcaseCarousel : styles.showcaseGrid
          }
        >
          {items.map((item) => {
            const CardInner = (
              <>
                <div
                  className={`${styles.showcaseMediaFrame} ${
                    aspect === "portrait"
                      ? styles.aspectPortrait
                      : styles.aspectLandscape
                  }`}
                  style={{
                    backgroundColor:
                      item.stationery?.matColor ?? item.frameBg ?? "#eee3cf",
                  }}
                >
                  {item.stationery ? (
                    <div className={styles.stationeryMat}>
                      <div className={styles.stationeryPaper}>
                        {item.posterUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.posterUrl}
                            alt=""
                            loading="lazy"
                            className={styles.stationeryBackdropImg}
                          />
                        )}
                        <div className={styles.stationeryVeil} />
                        <div
                          className={styles.stationeryType}
                          style={{ color: item.stationery.inkColor }}
                        >
                          <span className={styles.stationeryTop}>
                            {item.eyebrow}
                          </span>
                          <span className={styles.stationeryCouple}>
                            {item.stationery.couple}
                          </span>
                          <span className={styles.stationeryMeta}>
                            {item.stationery.dateLabel}
                          </span>
                          <span className={styles.stationeryVenue}>
                            {item.stationery.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      loading="lazy"
                      className={styles.showcaseCardImg}
                    />
                  ) : (
                    <div className={styles.showcaseFallbackSeal} />
                  )}

                  <div aria-hidden="true" className={styles.cardBottomScrim} />

                  <span aria-hidden="true" className={styles.cardArrowBadge}>
                    <ChevronRight size={16} strokeWidth={1.8} />
                  </span>
                </div>

                <div className={styles.showcaseCardBody}>
                  <p className={styles.showcaseCardEyebrow}>{item.eyebrow}</p>
                  <h3 className={styles.showcaseCardTitle}>{item.title}</h3>
                  <p className={styles.showcaseCardDesc}>{item.description}</p>
                </div>
              </>
            );

            return (
              <article
                key={item.id}
                className={
                  view === "carousel"
                    ? styles.showcaseCarouselCard
                    : styles.showcaseGridCard
                }
              >
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.showcaseCardLink}
                  >
                    {CardInner}
                  </a>
                ) : (
                  <Link href={item.href} className={styles.showcaseCardLink}>
                    {CardInner}
                  </Link>
                )}
              </article>
            );
          })}
        </div>

        {/* Bottom-Right Carousel Arrows */}
        {view === "carousel" && (
          <div className={styles.carouselControls}>
            <button
              type="button"
              aria-label={prevAria}
              disabled={!canPrev}
              onClick={() => scrollByCard(-1)}
              className={styles.carouselArrowBtn}
            >
              <ChevronLeft size={20} strokeWidth={1.7} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={nextAria}
              disabled={!canNext}
              onClick={() => scrollByCard(1)}
              className={styles.carouselArrowBtn}
            >
              <ChevronRight size={20} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
