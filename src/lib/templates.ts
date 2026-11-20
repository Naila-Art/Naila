import type { Template } from "./types";

/**
 * Built-in fallback template (CSS envelope, no video).
 * Ziad's Google Flow templates are uploaded from the admin dashboard (/admin/{key}/templates)
 * and stored by src/lib/store.ts; getTemplate() there looks in both.
 */
export const builtInTemplates: Template[] = [
  {
    id: "ivory-seal",
    name: "Ivory Seal",
    category: "wedding",
    // videoUrl: "/templates/ivory-seal/opening.mp4",
    // posterUrl: "/templates/ivory-seal/poster.jpg",
    theme: {
      background: "#f4ede3",
      surface: "#fffaf3",
      text: "#3b2a22",
      accent: "#a8834f",
      seal: "#7a1f2b",
    },
  },
];
