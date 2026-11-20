import type { Template } from "./types";

/**
 * Template registry. To add one of Ziad's Google Flow videos:
 *   1. Put the files in /public/templates/<id>/ (opening.mp4 + poster.jpg)
 *   2. Add an entry here with videoUrl and posterUrl.
 * Later this moves to the `templates` table in Supabase.
 */
export const templates: Template[] = [
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

export function getTemplate(id: string): Template {
  return templates.find((t) => t.id === id) ?? templates[0];
}
