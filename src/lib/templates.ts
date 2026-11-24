import type { Template } from "./types";
import { doorsCatalog, doorsCatalogMeta } from "./template-catalog";

/**
 * Built-in curated collection + fallback CSS envelope template.
 * Admin-uploaded Google Flow templates (/admin/{key}/templates) appear first via listTemplates().
 */
export const builtInTemplates: Template[] = [
  ...doorsCatalog,
  {
    id: "ivory-seal",
    name: "Ivory Wax Seal",
    category: "wedding",
    style: "stationery",
    posterUrl: "/hero/desktop-start.jpg",
    theme: {
      background: "#fcf7ed",
      surface: "#fffaf1",
      text: "#2f241b",
      accent: "#8a5a2b",
      seal: "#7a1f2b",
    },
  },
];

export interface TemplateEditorialMeta {
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  eyebrowEn: string;
  eyebrowAr: string;
  cardFrame?: string;
}

export const TEMPLATE_EDITORIAL_META: Record<string, TemplateEditorialMeta> = {
  ...doorsCatalogMeta,
  "ivory-seal": {
    nameAr: "الختم العاجي",
    eyebrowEn: "Signature envelope",
    eyebrowAr: "الظرف الكلاسيكي",
    taglineEn: "Deckle-edge cotton stationery sealed in deep crimson wax with silk ribbon detail.",
    taglineAr: "ورق قطني فاخر بختم شمع عنابي وشريط حريري ناعم يحمل أسماءكم.",
    cardFrame: "#f2eadb",
  },
};

export function templateDisplayName(tpl: Template, lang: "ar" | "en"): string {
  if (lang === "ar") {
    return TEMPLATE_EDITORIAL_META[tpl.id]?.nameAr ?? tpl.name;
  }
  return tpl.name;
}
