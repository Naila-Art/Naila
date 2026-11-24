"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <article className={styles.showcaseGridCard}>
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
