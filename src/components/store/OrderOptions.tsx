"use client";

import { Music } from "lucide-react";
import styles from "./store.module.css";
import { EditorialSelect } from "./EditorialControls";
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
  musicTrackId?: string;
  onMusicChange?: (id: string) => void;
}

/** Package selector (self-serve tiers 1-2) and optional soundtrack selector. */
export default function OrderOptions({
  pricing,
  packageId,
  onChange,
  onPackageChange,
  music,
  musicTrackId,
  onMusicChange,
}: Props) {
  const { lang } = useSiteLang();
  const copy = STORE_COPY[lang].options;

  const selectPackage = (id: PackageId) => {
    onChange?.(id);
    onPackageChange?.(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
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
              <strong>
                {packageDisplayName(p, lang)} · {formatStorePrice(p.price, lang)}
              </strong>
              <ul>
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

      {packageId >= 2 && music && onMusicChange && (
        <div className={styles.field}>
          <span>{copy.soundtrackLabel}</span>
          {music.length === 0 ? (
            <small className={styles.hint}>{copy.soundtrackEmpty}</small>
          ) : (
            <>
              <EditorialSelect
                value={musicTrackId ?? ""}
                onChange={onMusicChange}
                ariaLabel={copy.soundtrackLabel}
                placeholder={copy.noMusicLabel}
                dir={lang === "ar" ? "rtl" : "ltr"}
                icon={<Music size={15} strokeWidth={1.5} aria-hidden="true" />}
                options={[
                  {
                    value: "",
                    label: copy.noMusicLabel,
                    sublabel: copy.noMusicSub,
                  },
                  ...music.map((m) => ({
                    value: m.id,
                    label: m.name,
                    sublabel: copy.curatedTrackSub,
                  })),
                ]}
              />
              {musicTrackId && (
                <audio
                  controls
                  preload="none"
                  src={music.find((m) => m.id === musicTrackId)?.url}
                  className={styles.audio}
                />
              )}
            </>
          )}
        </div>
      )}

      <div className={styles.total}>
        <span>{copy.totalLabel}</span>
        <strong>{formatStorePrice(priceOf(pricing, packageId), lang)}</strong>
      </div>
    </div>
  );
}
