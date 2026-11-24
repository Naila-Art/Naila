"use client";

import { useMemo, useState } from "react";
import styles from "./TemplateFilterBar.module.css";
import {
  CATEGORY_ORDER,
  STYLE_LABELS,
  type Category,
  type Template,
  type TemplateStyle,
} from "@/lib/types";

const CATEGORY_TEXT: Record<"ar" | "en", Record<Category | "all", string>> = {
  en: { all: "All", katb_kitab: "Katb Kitab", wedding: "Wedding", engagement: "Engagement" },
  ar: { all: "الكل", katb_kitab: "كتب كتاب", wedding: "زفاف", engagement: "خطوبة" },
};
const ALL_STYLES: Record<"ar" | "en", string> = { en: "All styles", ar: "كل الأنماط" };
const STYLE_ORDER = Object.keys(STYLE_LABELS) as TemplateStyle[];

export function categoryLabel(c: Category, lang: "ar" | "en") {
  return CATEGORY_TEXT[lang][c];
}

export function styleLabel(s: TemplateStyle | undefined, lang: "ar" | "en") {
  return s ? STYLE_LABELS[s][lang] : undefined;
}

/**
 * Category → style filtering for template lists. Categories follow CATEGORY_ORDER
 * (Katb Kitab, Wedding, Engagement); styles are the sub-categories present in the
 * chosen category. Changing category resets the style.
 */
export function useTemplateFilter(templates: Template[]) {
  const [category, setCategoryState] = useState<Category | "all">("all");
  const [style, setStyle] = useState<TemplateStyle | "all">("all");

  return useMemo(() => {
    const categories = CATEGORY_ORDER.map((id) => ({
      id,
      count: templates.filter((t) => t.category === id).length,
    })).filter((c) => c.count > 0);
    const inCategory = category === "all" ? templates : templates.filter((t) => t.category === category);
    const styleList = STYLE_ORDER.map((id) => ({
      id,
      count: inCategory.filter((t) => t.style === id).length,
    })).filter((s) => s.count > 0);
    const shown = style === "all" ? inCategory : inCategory.filter((t) => t.style === style);
    return {
      category,
      style,
      categories,
      styles: styleList,
      total: templates.length,
      shown,
      setCategory: (c: Category | "all") => {
        setCategoryState(c);
        setStyle("all");
      },
      setStyle,
    };
  }, [templates, category, style]);
}

type Filter = ReturnType<typeof useTemplateFilter>;

/** Two-tier filter: category tabs with counts, then that category's style chips. */
export default function TemplateFilterBar({
  filter,
  lang,
  tone = "light",
}: {
  filter: Filter;
  lang: "ar" | "en";
  tone?: "light" | "panel";
}) {
  const text = CATEGORY_TEXT[lang];
  if (filter.categories.length < 2 && filter.styles.length < 2) return null;

  return (
    <div className={styles.bar} data-lang={lang} data-tone={tone}>
      <div className={styles.tabs} role="group" aria-label={lang === "ar" ? "نوع المناسبة" : "Occasion"}>
        {(["all", ...filter.categories.map((c) => c.id)] as (Category | "all")[]).map((c) => {
          const count = c === "all" ? filter.total : filter.categories.find((x) => x.id === c)?.count;
          return (
            <button
              key={c}
              type="button"
              className={styles.tab}
              aria-pressed={filter.category === c}
              onClick={() => filter.setCategory(c)}
            >
              <span>{text[c]}</span>
              <span className={styles.count}>{count}</span>
            </button>
          );
        })}
      </div>

      {filter.styles.length > 1 && (
        <div className={styles.chips} role="group" aria-label={lang === "ar" ? "النمط" : "Style"}>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={filter.style === "all"}
            onClick={() => filter.setStyle("all")}
          >
            {ALL_STYLES[lang]}
          </button>
          {filter.styles.map((s) => (
            <button
              key={s.id}
              type="button"
              className={styles.chip}
              aria-pressed={filter.style === s.id}
              onClick={() => filter.setStyle(s.id)}
            >
              {STYLE_LABELS[s.id][lang]}
              <span className={styles.count}>{s.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
