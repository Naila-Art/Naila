"use client";

import { useState } from "react";
import styles from "./store.module.css";
import { CATEGORY_COPY } from "./storeCopy";
import { useSiteLang } from "@/lib/site-lang";
import { templateDisplayName } from "@/lib/templates";
import { CATEGORY_LABELS, type Category, type Template } from "@/lib/types";

interface Props {
  templates: Template[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function TemplateThumb({ template }: { template: Template }) {
  return (
    <div
      className={styles.templateThumb}
      style={{ background: template.theme.background }}
    >
      {template.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={template.posterUrl} alt="" loading="lazy" />
      ) : (
        <span
          className={styles.heroSeal}
          style={{ background: template.theme.seal }}
        />
      )}
    </div>
  );
}

/** Category-filtered selectable template picker for /create studio. */
export default function TemplateGallery({
  templates,
  selectedId,
  onSelect,
}: Props) {
  const { lang } = useSiteLang();
  const catLabels = CATEGORY_COPY[lang];
  const categories = (Object.keys(CATEGORY_LABELS) as Category[]).filter((c) =>
    templates.some((t) => t.category === c)
  );
  const [filter, setFilter] = useState<Category | "all">("all");
  const shown =
    filter === "all"
      ? templates
      : templates.filter((t) => t.category === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {categories.length > 1 && (
        <div className={styles.tabs}>
          {(["all", ...categories] as (Category | "all")[]).map((c) => (
            <button
              key={c}
              type="button"
              className={styles.tab}
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {catLabels[c]}
            </button>
          ))}
        </div>
      )}

      <ul
        className={styles.templateGrid}
        role={onSelect ? "radiogroup" : undefined}
        aria-label={lang === "ar" ? "التصميمات" : "Design themes"}
      >
        {shown.map((t) => {
          const title = templateDisplayName(t, lang);
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
                  <TemplateThumb template={t} />
                  <span className={styles.templateInfo}>
                    <strong>{title}</strong>
                    <small>{catLabels[t.category]}</small>
                  </span>
                </button>
              ) : (
                <a
                  href={`/t/${t.id}`}
                  className={styles.templateCard}
                  style={{ textDecoration: "none" }}
                >
                  <TemplateThumb template={t} />
                  <span className={styles.templateInfo}>
                    <strong>{title}</strong>
                    <small>{catLabels[t.category]}</small>
                  </span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
