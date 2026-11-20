"use client";

import styles from "./store.module.css";
import { INCLUDED_IN_ALL, formatEgp, isSelfServe, priceOf, type Pricing } from "@/lib/pricing";
import type { MusicTrack, PackageId } from "@/lib/types";

interface Props {
  pricing: Pricing;
  packageId: PackageId;
  onChange: (packageId: PackageId) => void;
  /** Library tracks for package 2. Omit to hide the picker. */
  music?: MusicTrack[];
  musicTrackId?: string;
  onMusicChange?: (id: string) => void;
}

/** Package 1 or 2 (built by the client), the music pick for package 2, and the total. */
export default function OrderOptions({ pricing, packageId, onChange, music, musicTrackId, onMusicChange }: Props) {
  return (
    <div className={styles.options}>
      <div className={styles.packages} role="radiogroup" aria-label="الباقة">
        {pricing.packages
          .filter((p) => isSelfServe(p.id) && (p.active || p.id === packageId))
          .map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={packageId === p.id}
              className={styles.packageCard}
              onClick={() => onChange(p.id)}
            >
              <strong>{p.name}</strong>
              <span className={styles.price}>{formatEgp(p.price)}</span>
              <ul>
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </button>
          ))}
      </div>

      <p className={styles.hint}>في كل الباقات: {INCLUDED_IN_ALL.join(" · ")}</p>

      {packageId >= 2 && music && onMusicChange && (
        <label className={styles.field}>
          <span>المزيكا</span>
          {music.length === 0 ? (
            <small className={styles.hint}>هنختارلك مزيكا مناسبة.</small>
          ) : (
            <>
              <select value={musicTrackId ?? ""} onChange={(e) => onMusicChange(e.target.value)}>
                <option value="">من غير مزيكا</option>
                {music.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {musicTrackId && (
                <audio controls preload="none" src={music.find((m) => m.id === musicTrackId)?.url} className={styles.audio} />
              )}
            </>
          )}
        </label>
      )}

      <div className={styles.total}>
        <span>الإجمالي</span>
        <strong>{formatEgp(priceOf(pricing, packageId))}</strong>
      </div>
    </div>
  );
}
