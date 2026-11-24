"use client";

import { Eye } from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./store.module.css";
import { CATEGORY_COPY } from "./storeCopy";
import TemplateFilterBar, { styleLabel, useTemplateFilter } from "@/components/TemplateFilterBar";
import { useSiteLang } from "@/lib/site-lang";
import { templateDisplayName } from "@/lib/templates";
import { localeHref } from "@/lib/locale";
import { BADGE_LABELS, type Lang, type Template, type TemplateBadge } from "@/lib/types";

interface Props {
  templates: Template[];
  /** Builder mode: cards are selectable instead of links. */
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** The client's names, written over every design so they choose the one that looks like theirs. */
  names?: CoupleNames;
  /** Language of the invitation being built (for the names on the designs). */
  lang?: Lang;
}

export interface CoupleNames {
  a: string;
  b: string;
}

const BADGE_ORDER = Object.keys(BADGE_LABELS) as TemplateBadge[];
const badgeRank = (t: Template) => (t.badge ? BADGE_ORDER.indexOf(t.badge) : BADGE_ORDER.length);

const BADGE_EN: Record<TemplateBadge, string> = { featured: "Featured", popular: "Most loved", new: "New" };

/**
 * A design card's picture. With the couple's names it shows the opened scene with the names
 * where the real invitation puts them (doors and paper families), so the choice is made on
 * what the guests will actually see.
 */
export function TemplateThumb({
  template,
  showBadge = true,
  names,
  lang = "ar",
  uiLang = "ar",
}: {
  template: Template;
  showBadge?: boolean;
  names?: CoupleNames;
  lang?: Lang;
  uiLang?: Lang;
}) {
  const scene = template.scene;
  const onScene = Boolean(names && template.endPosterUrl && scene);
  const src = onScene ? template.endPosterUrl : template.posterUrl;
  const light = scene?.light ?? template.family === "paper";
  const placed: CSSProperties | undefined = onScene
    ? {
        top: `${scene?.skyTop ?? 19}%`,
        left: `${scene?.skyCenter ?? 50}%`,
        width: `${scene?.skyWidth ?? 58}%`,
        color: scene?.ink ?? (light ? template.theme.text : "#f7eedd"),
        fontSize: `calc(var(--thumb-name) * ${scene?.scale ?? 1})`,
      }
    : { color: template.theme.text };

  return (
    <div className={styles.templateThumb} style={{ background: template.theme.background }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- static or R2 URLs, no optimisation needed
        <img src={src} alt="" loading="lazy" />
      ) : (
        <span className={styles.heroSeal} style={{ background: template.theme.seal }} />
      )}
      {names && (
        <div
          className={styles.thumbNames}
          data-lang={lang}
          data-placed={onScene || undefined}
          data-tone={onScene ? (light ? "light" : "dark") : undefined}
          style={placed}
          aria-hidden
        >
          <span>{names.a}</span>
          <span style={{ color: template.theme.accent }}>{lang === "ar" ? "و" : "&"}</span>
          <span>{names.b}</span>
        </div>
      )}
      {showBadge && template.badge && (
        <span className={styles.templateBadge} data-badge={template.badge}>
          {uiLang === "ar" ? BADGE_LABELS[template.badge] : BADGE_EN[template.badge]}
        </span>
      )}
    </div>
  );
}

/** Occasion → style filtered design picker (storefront and the /create builder). Badged designs come first. */
export default function TemplateGallery({ templates, selectedId, onSelect, names, lang }: Props) {
  const { lang: uiLang } = useSiteLang();
  const catLabels = CATEGORY_COPY[uiLang];
  const filter = useTemplateFilter(templates);
  // Array sort is stable: badged first (featured, popular, new), otherwise the catalog order.
  const shown = filter.shown.slice().sort((x, y) => badgeRank(x) - badgeRank(y));
  const subtitle = (t: Template) => styleLabel(t.style, uiLang) ?? catLabels[t.category];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <TemplateFilterBar filter={filter} lang={uiLang} />

      <ul
        className={styles.templateGrid}
        role={onSelect ? "radiogroup" : undefined}
        aria-label={uiLang === "ar" ? "التصميمات" : "Design themes"}
      >
        {shown.map((t) => {
          const title = templateDisplayName(t, uiLang);
          const inner = (
            <>
              <TemplateThumb template={t} names={names} lang={lang ?? uiLang} uiLang={uiLang} />
              <span className={styles.templateInfo}>
                <strong>{title}</strong>
                <small>{subtitle(t)}</small>
              </span>
            </>
          );
          return (
            <li key={t.id}>
              {onSelect ? (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedId === t.id}
                  className={styles.templateCard}
                  onClick={() => onSelect(t.id)}
                >
                  {inner}
                </button>
              ) : (
                <a href={localeHref(uiLang, `/t/${t.id}`)} className={styles.templateCard} style={{ textDecoration: "none" }}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      {onSelect && selectedId && (
        <a className={styles.galleryHint} href={localeHref(uiLang, `/t/${selectedId}`)} target="_blank" rel="noopener noreferrer">
          <Eye size={16} strokeWidth={1.6} aria-hidden />
          {uiLang === "ar" ? "شوفي التصميم ده على الموبايل" : "See this design on your phone"}
        </a>
      )}
    </div>
  );
}
