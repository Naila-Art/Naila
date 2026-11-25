"use client";

import { Check, Music } from "lucide-react";
import styles from "./store.module.css";
import { MusicPicker, TrackPreviewStrip } from "./MusicPicker";
import {
  INCLUDED_IN_ALL_COPY,
  STORE_COPY,
  formatStorePrice,
  packageDisplayName,
  packageDisplayPoints,
} from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import type { MusicTrack, PackageId } from "@/lib/types";

interface Props {
  pricing: Pricing;
  packageId: PackageId;
  onChange?: (id: PackageId) => void;
  onPackageChange?: (id: PackageId) => void;
  music?: MusicTrack[];
  defaultTrackId?: string;
  musicTrackId?: string;
  onMusicChange?: (id: string) => void;
  customMusicAddon?: boolean;
  onCustomMusicAddonChange?: (enabled: boolean) => void;
}

/** Package selector (self-serve tiers 1-3), optional Package 1 music add-on, and soundtrack picker. */
export default function OrderOptions({
  pricing,
  packageId,
  onChange,
  onPackageChange,
  music,
  defaultTrackId,
  musicTrackId,
  onMusicChange,
  customMusicAddon = false,
  onCustomMusicAddonChange,
}: Props) {
  const { lang } = useSiteLang();
  const copy = STORE_COPY[lang].options;

  const selectPackage = (id: PackageId) => {
    onChange?.(id);
    onPackageChange?.(id);
  };

  const defaultTrack =
    music && defaultTrackId && defaultTrackId !== "none"
      ? music.find((m) => m.id === defaultTrackId) ?? null
      : null;

  const pkgOne = pricing.packages.find((p) => p.id === 1);
  const showAddonBreakdown = packageId === 1 && customMusicAddon && pkgOne;
  const canPickMusic = packageId >= 2 || (packageId === 1 && customMusicAddon);
  const total = priceOf(pricing, packageId, { customMusic: customMusicAddon });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem", minWidth: 0, maxWidth: "100%" }}>
      <div
        className={styles.packageRow}
        role="radiogroup"
        aria-label={copy.packagesAria}
      >
        {pricing.packages
          .filter((p) => p.active && isSelfServe(p.id))
          .map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={packageId === p.id}
              className={styles.packageOption}
              onClick={() => selectPackage(p.id)}
            >
              <div className={styles.packageOptionHead}>
                <div className={styles.packageOptionTitleWrap}>
                  <strong className={styles.packageOptionTitle}>{packageDisplayName(p, lang)}</strong>
                  <span className={styles.packageOptionPrice}>{formatStorePrice(p.price, lang)}</span>
                </div>
                <span className={styles.packageOptionRadio} aria-hidden="true" />
              </div>
              <ul className={styles.packageOptionList}>
                {packageDisplayPoints(p, lang).map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </button>
          ))}
      </div>

      <p className={styles.hint}>
        {copy.includedPrefix} {INCLUDED_IN_ALL_COPY[lang].join(" · ")}
      </p>

      {packageId === 1 && !customMusicAddon && defaultTrack && (
        <TrackPreviewStrip
          track={defaultTrack}
          lang={lang}
          label={copy.defaultMusicLabel}
          sublabel={copy.defaultMusicSub}
        />
      )}

      {packageId === 1 && onCustomMusicAddonChange && (
        <button
          type="button"
          className={styles.addonToggle}
          aria-pressed={customMusicAddon}
          onClick={() => onCustomMusicAddonChange(!customMusicAddon)}
        >
          <span className={styles.addonIconPlate} aria-hidden="true">
            {customMusicAddon ? <Check size={16} strokeWidth={2.1} /> : <Music size={16} strokeWidth={1.6} />}
          </span>
          <span className={styles.addonToggleText}>
            <strong className={styles.addonToggleTitle}>{copy.musicAddonTitle}</strong>
            <small>{copy.musicAddonDesc}</small>
          </span>
          <span className={styles.addonPriceTag}>
            +{formatStorePrice(pricing.musicAddonPrice, lang)}
          </span>
        </button>
      )}

      {canPickMusic && music && onMusicChange && (
        <div className={styles.soundtrackSection}>
          {packageId >= 2 && (
            <div className={styles.soundtrackHead}>
              <span className={styles.soundtrackHeadLead}>
                <Music size={15} strokeWidth={1.6} className={styles.soundtrackHeadIcon} aria-hidden="true" />
                <span className={styles.soundtrackHeadTitle}>{copy.soundtrackLabel}</span>
              </span>
              <span className={styles.soundtrackHeadBadge}>{copy.includedMusicSub}</span>
            </div>
          )}

          {music.length === 0 ? (
            <small className={styles.hint}>{copy.soundtrackEmpty}</small>
          ) : (
            <MusicPicker
              tracks={music}
              value={musicTrackId ?? ""}
              onChange={onMusicChange}
              defaultTrackId={defaultTrackId}
              lang={lang}
              variant="light"
              defaultValueMode="empty"
            />
          )}
        </div>
      )}

      <div className={styles.total}>
        <div className={styles.totalLabelGroup}>
          <span>{copy.totalLabel}</span>
          {showAddonBreakdown && (
            <small className={styles.totalBreakdown}>
              {lang === "ar"
                ? `${packageDisplayName(pkgOne, lang)} + مكتبة الألحان (+${formatStorePrice(pricing.musicAddonPrice, lang)})`
                : `${packageDisplayName(pkgOne, lang)} + Soundtrack Library (+${formatStorePrice(pricing.musicAddonPrice, lang)})`}
            </small>
          )}
        </div>
        <strong>{formatStorePrice(total, lang)}</strong>
      </div>
    </div>
  );
}
