"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCardAutoplay } from "./useCardAutoplay";
import styles from "./landing.module.css";

export interface ShowcaseCardItem {
  id: string;
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  posterUrl?: string;
  videoUrl?: string;
  previewVideoUrl?: string;
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
  aspect: "landscape" | "portrait";
  /** Cards shown as one grid. Ignored when `children` is given. */
  items?: ShowcaseCardItem[];
  /** Custom body under the heading (e.g. the per-occasion template rows). */
  children?: ReactNode;
}

export default function EditorialShowcase({
  id,
  title,
  subtitle,
  aspect,
  items = [],
  children,
}: EditorialShowcaseProps) {
  return (
    <section
      id={id}
      data-header-tone="dark"
      className={`${styles.showcaseSection} ${
        aspect === "portrait" ? styles.showcaseSectionCompact : ""
      }`}
    >
      <div className={styles.showcaseWrap}>
        <div className={styles.showcaseHeader}>
          <div className={styles.showcaseHeadingGroup}>
            <h2 className={styles.showcaseH2}>{title}</h2>
            <p className={styles.showcaseSubtitle}>{subtitle}</p>
          </div>
        </div>

        {children ?? <ShowcaseCardGrid items={items} aspect={aspect} />}
      </div>
    </section>
  );
}

/** Responsive card grid: 1 / 2 / 3 / 4 columns. */
export function ShowcaseCardGrid({
  items,
  aspect,
  className,
}: {
  items: ShowcaseCardItem[];
  aspect: "landscape" | "portrait";
  className?: string;
}) {
  return (
    <div className={`${styles.showcaseGrid} ${className ?? ""}`}>
      {items.map((item) => (
        <ShowcaseCard key={item.id} item={item} aspect={aspect} />
      ))}
    </div>
  );
}

function ShowcaseCard({
  item,
  aspect,
}: {
  item: ShowcaseCardItem;
  aspect: "landscape" | "portrait";
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const initialSrc = !item.stationery
    ? item.previewVideoUrl ?? item.videoUrl
    : undefined;

  const [videoSrc, setVideoSrc] = useState<string | undefined>(initialSrc);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoSrc(initialSrc);
    setVideoFailed(false);
    setVideoReady(false);
  }, [initialSrc]);

  const { shouldPlay, onPointerEnter, onPointerLeave } = useCardAutoplay(
    cardRef,
    Boolean(initialSrc) && !videoFailed
  );

  useEffect(() => {
    if (!shouldPlay) {
      setVideoReady(false);
    }
  }, [shouldPlay]);

  const activeVideoSrc = shouldPlay && !videoFailed ? videoSrc : undefined;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoSrc) return;

    video.muted = true;
    const playAttempt = video.play();
    if (playAttempt) {
      playAttempt.catch(() => setVideoReady(false));
    }

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [activeVideoSrc]);

  const CardInner = (
    <>
      <div
        className={`${styles.showcaseMediaFrame} ${
          aspect === "portrait" ? styles.aspectPortrait : styles.aspectLandscape
        }`}
        style={{
          backgroundColor: item.stationery?.matColor ?? item.frameBg ?? "#eee3cf",
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
                <span className={styles.stationeryTop}>{item.eyebrow}</span>
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
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.posterUrl}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className={styles.showcaseCardImg}
            />
            {activeVideoSrc && (
              <video
                ref={videoRef}
                src={activeVideoSrc}
                muted
                loop
                playsInline
                autoPlay
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
                aria-hidden="true"
                onPlaying={() => setVideoReady(true)}
                onError={() => {
                  if (item.videoUrl && videoSrc !== item.videoUrl) {
                    setVideoReady(false);
                    setVideoSrc(item.videoUrl);
                  } else {
                    setVideoFailed(true);
                  }
                }}
                className={`${styles.showcaseCardImg} ${styles.showcaseCardVideo} ${
                  videoReady ? styles.showcaseCardVideoReady : ""
                }`}
              />
            )}
          </>
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
      ref={cardRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={styles.showcaseGridCard}
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
}
