import type { Template } from "./types";

/**
 * Built-in curated collection + fallback CSS envelope template.
 * Admin-uploaded Google Flow templates (/admin/{key}/templates) appear first via listTemplates().
 */
export const builtInTemplates: Template[] = [
  {
    id: "gardenia-couture",
    name: "Gardenia Couture",
    category: "wedding",
    videoUrl: "/showcase/gardenia.mp4",
    posterUrl: "/showcase/gardenia-start.jpg",
    theme: {
      background: "#faf7f2",
      surface: "#ffffff",
      text: "#2f241b",
      accent: "#556b52",
      seal: "#9caf96",
    },
  },
  {
    id: "alhambra",
    name: "Alhambra",
    category: "katb_kitab",
    family: "doors",
    videoUrl: "/templates/alhambra/opening.mp4",
    posterUrl: "/templates/alhambra/start.jpg",
    endPosterUrl: "/templates/alhambra/end.jpg",
    ambientUrl: "/templates/alhambra/end-blur.jpg",
    revealAtMs: 3600,
    theme: {
      background: "#1e2d3b",
      surface: "#f2e6d0",
      text: "#2a1d12",
      accent: "#c89b54",
      seal: "#8c583a",
    },
  },
  {
    id: "amalfi",
    name: "Amalfi Coast",
    category: "wedding",
    videoUrl: "/showcase/amalfi.mp4",
    posterUrl: "/showcase/amalfi-start.jpg",
    theme: {
      background: "#faf6ee",
      surface: "#ffffff",
      text: "#1d2c42",
      accent: "#1e4d8c",
      seal: "#c79a2b",
    },
  },
  {
    id: "ballroom",
    name: "Grand Ballroom",
    category: "wedding",
    videoUrl: "/showcase/ballroom.mp4",
    posterUrl: "/showcase/ballroom-start.jpg",
    theme: {
      background: "#241d1a",
      surface: "#f9f3e8",
      text: "#241d1a",
      accent: "#b58b42",
      seal: "#8a5a2b",
    },
  },
  {
    id: "arabian-veil",
    name: "Arabian Veil",
    category: "wedding",
    videoUrl: "/showcase/arabian-veil.mp4",
    posterUrl: "/showcase/arabian-veil-start.jpg",
    theme: {
      background: "#26180e",
      surface: "#f8efe0",
      text: "#2b1d12",
      accent: "#b68538",
      seal: "#8b5e2a",
    },
  },
  {
    id: "barakah-engagement",
    name: "Barakah Sanctuary",
    category: "engagement",
    videoUrl: "/showcase/barakah.mp4",
    posterUrl: "/showcase/barakah-start.jpg",
    theme: {
      background: "#f7f4ee",
      surface: "#fffdf9",
      text: "#2f241b",
      accent: "#9a7b4c",
      seal: "#8b9b7e",
    },
  },
  {
    id: "ivory-seal",
    name: "Ivory Wax Seal",
    category: "wedding",
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
  "gardenia-couture": {
    nameAr: "جاردينيا كوتور",
    eyebrowEn: "Wedding invitation",
    eyebrowAr: "دعوة زفاف",
    taglineEn: "Sage silk ribbons untie onto blooming gardenias and a luminous watercolor garden.",
    taglineAr: "شرايط حرير بلون المريمية تنفك بهدوء عن زهور الجاردينيا وحديقة مرسومة بالألوان المائية.",
    cardFrame: "#ebe5d8",
  },
  alhambra: {
    nameAr: "الحمراء",
    eyebrowEn: "Katb kitab & wedding",
    eyebrowAr: "كتب كتاب وزفاف",
    taglineEn: "Carved Andalusian cedar doors open onto a lantern-lit twilight courtyard.",
    taglineAr: "أبواب أندلسية محفورة تفتح على فناء هادئ مضاء بالفوانيس تحت سماء المساء.",
    cardFrame: "#1f2a35",
  },
  amalfi: {
    nameAr: "ساحل أمالفي",
    eyebrowEn: "Destination wedding",
    eyebrowAr: "زفاف ساحلي",
    taglineEn: "Majolica-blue stationery opening into sunlit watercolor citrus and coastal cliffs.",
    taglineAr: "ظرف بألوان السيراميك المتوسطي ينفتح على نسيم الليمون وإشراقة البحر.",
    cardFrame: "#dfe6f0",
  },
  ballroom: {
    nameAr: "القاعة الملكية",
    eyebrowEn: "Black-tie wedding",
    eyebrowAr: "زفاف كلاسيكي فاخر",
    taglineEn: "Gilded Baroque doors part into a candlelit palace hall beneath a crystal chandelier.",
    taglineAr: "أبواب قصر مذهّبة تُفتح على قاعة مضاءة بالشموع تحت ثريا كريستال فخمة.",
    cardFrame: "#2b221e",
  },
  "arabian-veil": {
    nameAr: "طرحة ذهب",
    eyebrowEn: "Wedding & katb kitab",
    eyebrowAr: "دعوة زفاف وكتب كتاب",
    taglineEn: "Golden embroidered silk veils and amber candlelight across sculpted palace steps.",
    taglineAr: "طرح حرير مطرّزة بخيوط الذهب وإضاءة شموع دافئة على درجات قصر شرقي عريق.",
    cardFrame: "#352417",
  },
  "barakah-engagement": {
    nameAr: "أقواس البركة",
    eyebrowEn: "Engagement & ceremony",
    eyebrowAr: "خطوبة وعقد قران",
    taglineEn: "Sunlit stone arches dressed in soft white florals opening into radiant sanctuary light.",
    taglineAr: "أقواس حجرية مزيّنة بالورد الأبيض تُفتح على نور نهاري هادئ وأنيق.",
    cardFrame: "#ebe4d6",
  },
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
