"use client";

import styles from "./store.module.css";
import {
  ADDON_LABELS,
  NAMES_TIER_IDS,
  anyAddonEnabled,
  formatEgp,
  isSelfServe,
  priceOf,
  sanitizeAddons,
  type Pricing,
} from "@/lib/pricing";
import type { Addons, Lang, MusicTrack, PackageId } from "@/lib/types";

interface Props {
  pricing: Pricing;
  packageId: PackageId;
  addons: Addons;
  lang: Lang;
  onChange: (next: { packageId: PackageId; addons: Addons }) => void;
  /** Library tracks for package 2. Omit to hide the picker. */
  music?: MusicTrack[];
  musicTrackId?: string;
  onMusicChange?: (id: string) => void;
  mapsUrl?: string;
  onMapsUrlChange?: (url: string) => void;
}

/** Package (1 or 2) and add-ons, with the running total. Used by the builder and the client page. */
export default function OrderOptions(props: Props) {
  const { packageId, lang, pricing } = props;
  const tiers = pricing.namesTiers;
  const on = pricing.addonsEnabled;
  const addons: Addons = sanitizeAddons(pricing, props.addons, lang);
  const set = (patch: Partial<Addons>) =>
    props.onChange({ packageId, addons: { ...addons, ...patch } });
  const total = priceOf(pricing, packageId, addons);

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
              onClick={() => props.onChange({ packageId: p.id, addons })}
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

      {packageId >= 2 && props.music && props.onMusicChange && (
        <label className={styles.field}>
          <span>المزيكا</span>
          {props.music.length === 0 ? (
            <small className={styles.hint}>هنختارلك مزيكا مناسبة.</small>
          ) : (
            <>
              <select
                value={props.musicTrackId ?? ""}
                onChange={(e) => props.onMusicChange!(e.target.value)}
              >
                <option value="">من غير مزيكا</option>
                {props.music.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {props.musicTrackId && (
                <audio
                  controls
                  preload="none"
                  src={
                    props.music.find((m) => m.id === props.musicTrackId)?.url
                  }
                  className={styles.audio}
                />
              )}
            </>
          )}
        </label>
      )}

      {anyAddonEnabled(pricing) && (
        <fieldset className={styles.addons}>
          <legend>إضافات</legend>

          {on.arabic && (
            <label className={styles.addon} data-locked="true">
              <input
                type="checkbox"
                checked={addons.arabic}
                disabled
                readOnly
              />
              <span>
                {ADDON_LABELS.arabic}
                <small>
                  {lang === "ar" ? "مضافة لأن الدعوة عربي" : "الدعوة إنجليزي"}
                </small>
              </span>
              <em>+{pricing.addons.arabic}</em>
            </label>
          )}

          {on.maps && (
            <label className={styles.addon}>
              <input
                type="checkbox"
                checked={addons.maps}
                onChange={(e) => set({ maps: e.target.checked })}
              />
              <span>{ADDON_LABELS.maps}</span>
              <em>+{pricing.addons.maps}</em>
            </label>
          )}
          {on.maps && addons.maps && props.onMapsUrlChange && (
            <label className={styles.field}>
              <span>لينك المكان من جوجل ماب</span>
              <input
                type="url"
                dir="ltr"
                inputMode="url"
                placeholder="https://maps.app.goo.gl/..."
                value={props.mapsUrl ?? ""}
                onChange={(e) => props.onMapsUrlChange!(e.target.value)}
              />
            </label>
          )}

          {on.customMusic && (
            <label className={styles.addon}>
              <input
                type="checkbox"
                checked={addons.customMusic}
                onChange={(e) => set({ customMusic: e.target.checked })}
              />
              <span>
                {ADDON_LABELS.customMusic}
                <small>ترفعها من صفحتك بعد ما تعمل الدعوة</small>
              </span>
              <em>+{pricing.addons.customMusic}</em>
            </label>
          )}

          {on.names && (
            <>
              <label className={styles.addon}>
                <input
                  type="checkbox"
                  checked={addons.names !== null}
                  onChange={(e) =>
                    set({ names: e.target.checked ? "100" : null })
                  }
                />
                <span>
                  {ADDON_LABELS.names}
                  <small>
                    كل معزوم يفتح دعوة باسمه، وتعرف مين فتح ومين أكد
                  </small>
                </span>
                <em>
                  {addons.names
                    ? `+${tiers[addons.names].price}`
                    : `من +${tiers["100"].price}`}
                </em>
              </label>
              {addons.names && (
                <div
                  className={styles.tiers}
                  role="radiogroup"
                  aria-label="عدد المعازيم"
                >
                  {NAMES_TIER_IDS.map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      role="radio"
                      aria-checked={addons.names === tier}
                      className={styles.tier}
                      onClick={() => set({ names: tier })}
                    >
                      {tiers[tier].label}
                      <em>+{tiers[tier].price}</em>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </fieldset>
      )}

      <div className={styles.total}>
        <span>الإجمالي</span>
        <strong>{formatEgp(total)}</strong>
      </div>
    </div>
  );
}
