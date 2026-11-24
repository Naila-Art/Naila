"use client";

import { useMemo, useState } from "react";
import { ShowcaseCardGrid, type ShowcaseCardItem } from "./EditorialShowcase";
import type { LandingCopy } from "./copy";
import {
  CATEGORY_ORDER,
  STYLE_LABELS,
  type Category,
  type Template,
  type TemplateStyle,
} from "@/lib/types";
import styles from "./occasionRows.module.css";

const STYLE_ORDER = Object.keys(STYLE_LABELS) as TemplateStyle[];
/** Cards shown per row before "Show all" (one desktop row). */
const ROW_LIMIT = 4;

interface OccasionRowsProps {
  templates: Template[];
  /** Builds the card for one template (shared with the rest of the landing). */
  toCard: (tpl: Template) => ShowcaseCardItem;
  copy: LandingCopy["templates"];
  lang: "ar" | "en";
}

/** One row per occasion (Katb Kitab, Wedding, Engagement), each with its own style chips. */
export default function OccasionRows({ templates, toCard, copy, lang }: OccasionRowsProps) {
  const occasions = CATEGORY_ORDER.map((id) => ({
    id,
    templates: templates.filter((t) => t.category === id),
  })).filter((o) => o.templates.length > 0);

  return (
    <div className={styles.rows} data-lang={lang}>
      {occasions.map((o) => (
        <OccasionRow
          key={o.id}
          occasion={o.id}
          templates={o.templates}
          toCard={toCard}
          copy={copy}
          lang={lang}
        />
      ))}
    </div>
  );
}

function OccasionRow({
  occasion,
  templates,
  toCard,
  copy,
  lang,
}: {
  occasion: Category;
  templates: Template[];
  toCard: (tpl: Template) => ShowcaseCardItem;
  copy: LandingCopy["templates"];
  lang: "ar" | "en";
}) {
  const [style, setStyle] = useState<TemplateStyle | "all">("all");
  const [expanded, setExpanded] = useState(false);

  const styleList = useMemo(
    () =>
      STYLE_ORDER.map((id) => ({
        id,
        count: templates.filter((t) => t.style === id).length,
      })).filter((s) => s.count > 0),
    [templates]
  );

  const shown = style === "all" ? templates : templates.filter((t) => t.style === style);
  const visible = expanded ? shown : shown.slice(0, ROW_LIMIT);
  const cards = visible.map(toCard);
  const text = copy.occasions[occasion];
  const headingId = `occasion-${occasion}`;

  const pickStyle = (s: TemplateStyle | "all") => {
    setStyle(s);
    setExpanded(false);
  };

  return (
    <section className={styles.row} aria-labelledby={headingId}>
      <div className={styles.rowHead}>
        <div className={styles.rowTitleGroup}>
          <h3 id={headingId} className={styles.rowTitle}>
            {text.title}
            <span className={styles.rowCount}>{templates.length}</span>
          </h3>
          <p className={styles.rowBlurb}>{text.blurb}</p>
        </div>

        {styleList.length > 1 && (
          <div className={styles.chips} role="group" aria-label={lang === "ar" ? "النمط" : "Style"}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={style === "all"}
              onClick={() => pickStyle("all")}
            >
              {copy.allStyles}
            </button>
            {styleList.map((s) => (
              <button
                key={s.id}
                type="button"
                className={styles.chip}
                aria-pressed={style === s.id}
                onClick={() => pickStyle(s.id)}
              >
                {STYLE_LABELS[s.id][lang]}
                <span className={styles.chipCount}>{s.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ShowcaseCardGrid items={cards} aspect="landscape" className={styles.grid} />

      {shown.length > ROW_LIMIT && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? copy.showLess : copy.showAll.replace("{n}", String(shown.length))}
        </button>
      )}
    </section>
  );
}
