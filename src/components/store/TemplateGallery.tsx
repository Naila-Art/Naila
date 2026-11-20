"use client";

import { useState } from "react";
import styles from "./store.module.css";
import { BADGE_LABELS, CATEGORY_LABELS, type Category, type Template, type TemplateBadge } from "@/lib/types";
import Icon from "../Icon";

interface Props {
  templates: Template[];
  /** Builder mode: cards are selectable instead of links. */
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const BADGE_ORDER = Object.keys(BADGE_LABELS) as TemplateBadge[];
const badgeRank = (t: Template) => (t.badge ? BADGE_ORDER.indexOf(t.badge) : BADGE_ORDER.length);

export function TemplateThumb({ template, showBadge = true }: { template: Template; showBadge?: boolean }) {
  return (
    <div className={styles.templateThumb} style={{ background: template.theme.background }}>
      {showBadge && template.badge && (
        <span className={styles.templateBadge} data-badge={template.badge}>
          {BADGE_LABELS[template.badge]}
        </span>
      )}
      {template.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 URLs, no Next image optimisation needed
        <img src={template.posterUrl} alt="" loading="lazy" />
      ) : (
        <span className={styles.heroSeal} style={{ background: template.theme.seal }} />
      )}
    </div>
  );
}

/** Templates filtered by category (wedding / engagement / katb kitab). */
export default function TemplateGallery({ templates, selectedId, onSelect }: Props) {
  const categories = (Object.keys(CATEGORY_LABELS) as Category[]).filter((c) => templates.some((t) => t.category === c));
  const [filter, setFilter] = useState<Category | "all">("all");
  // Badged ones first (مميز, then الأكثر طلباً, then جديد); otherwise the order stays as it was. Array sort is stable.
  const shown = (filter === "all" ? templates : templates.filter((t) => t.category === filter)).slice().sort((x, y) => badgeRank(x) - badgeRank(y));

  return (
    <>
      {categories.length > 1 && (
        <div className={styles.tabs}>
          {(["all", ...categories] as (Category | "all")[]).map((c) => (
            <button key={c} type="button" className={styles.tab} aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c === "all" ? "الكل" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}
      <ul className={styles.templateGrid} role={onSelect ? "radiogroup" : undefined} aria-label="التصميم">
        {shown.map((t) => (
          <li key={t.id}>
            {onSelect ? (
              <button
                type="button"
                role="radio"
                aria-checked={selectedId === t.id}
                className={styles.templateCard}
                onClick={() => onSelect(t.id)}
              >
                <TemplateThumb template={t} />
                <span className={styles.templateInfo}>
                  <strong>{t.name}</strong>
                  <small>{CATEGORY_LABELS[t.category]}</small>
                </span>
              </button>
            ) : (
              <div className={styles.templateCard}>
                <a href={`/t/${t.id}`} aria-label={`معاينة ${t.name}`}>
                  <TemplateThumb template={t} />
                </a>
                <div className={styles.templateInfo}>
                  <strong>{t.name}</strong>
                  <small>{CATEGORY_LABELS[t.category]}</small>
                  <div className={styles.templateActions}>
                    <a href={`/t/${t.id}`}>معاينة</a>
                    <a href={`/create?t=${t.id}`}>اختاره</a>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {onSelect && selectedId && (
        <a className={styles.hint} href={`/t/${selectedId}`} target="_blank" rel="noopener noreferrer">
          <Icon name="eye" size={16} /> شوف التصميم ده على الموبايل
        </a>
      )}
    </>
  );
}
