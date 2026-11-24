"use client";

import styles from "./store.module.css";
import { CATEGORY_COPY } from "./storeCopy";
import TemplateFilterBar, { styleLabel, useTemplateFilter } from "@/components/TemplateFilterBar";
import { useSiteLang } from "@/lib/site-lang";
import { templateDisplayName } from "@/lib/templates";
import type { Template } from "@/lib/types";

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

/** Category → style filtered template picker for the /create studio. */
export default function TemplateGallery({
  templates,
  selectedId,
  onSelect,
}: Props) {
  const { lang } = useSiteLang();
  const catLabels = CATEGORY_COPY[lang];
  const filter = useTemplateFilter(templates);
  const shown = filter.shown;
  const subtitle = (t: Template) => styleLabel(t.style, lang) ?? catLabels[t.category];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <TemplateFilterBar filter={filter} lang={lang} />

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
                    <small>{subtitle(t)}</small>
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
                    <small>{subtitle(t)}</small>
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
