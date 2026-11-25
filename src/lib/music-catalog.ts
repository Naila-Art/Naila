import type { Lang, MusicMood, MusicTrack } from "./types";

export const MUSIC_MOODS: MusicMood[] = ["orchestral", "strings", "piano", "waltz", "oriental"];

export const MUSIC_MOOD_LABELS: Record<MusicMood, { en: string; ar: string }> = {
  orchestral: { en: "Grand Orchestral", ar: "أوركسترا فخمة" },
  strings: { en: "Chamber Strings", ar: "وتريات هادية" },
  piano: { en: "Solo Piano", ar: "بيانو رومانسي" },
  waltz: { en: "Waltz & Salon", ar: "فالس وكلاسيك" },
  oriental: { en: "Eastern Soul", ar: "طابع شرقي" },
};

const BUNDLED_AT = "2026-01-01T00:00:00.000Z";

interface BuiltInSpec {
  slug: string;
  name: string;
  nameAr: string;
  mood: MusicMood;
  defaultFor: string[];
}

const BUILT_IN_SPECS: BuiltInSpec[] = [
  // Grand Orchestral (13)
  { slug: "silk-road-serenade", name: "Silk Road Serenade · Borodin", nameAr: "سيريناد طريق الحرير · بورودين", mood: "orchestral", defaultFor: ["alhambra"] },
  { slug: "anitra-dream", name: "Anitra's Dance · Grieg", nameAr: "رقصة أنيترا · جريج", mood: "orchestral", defaultFor: ["andalus"] },
  { slug: "morning-mood", name: "Morning Mood · Grieg", nameAr: "إشراقة الصباح · جريج", mood: "orchestral", defaultFor: ["glasshouse"] },
  { slug: "vltava-river", name: "Vltava Flowing River · Smetana", nameAr: "نهر فلتافا · سميتانا", mood: "orchestral", defaultFor: ["lakeside"] },
  { slug: "italian-sunlight", name: "Italian Symphony · Mendelssohn", nameAr: "السيمفونية الإيطالية · مندلسون", mood: "orchestral", defaultFor: ["amalfi"] },
  { slug: "italian-procession", name: "Tuscan Processional · Mendelssohn", nameAr: "موكب توسكانا · مندلسون", mood: "orchestral", defaultFor: ["oliveto"] },
  { slug: "italian-minuet", name: "Garden Minuet · Mendelssohn", nameAr: "مينويت الحديقة · مندلسون", mood: "orchestral", defaultFor: ["orangerie"] },
  { slug: "hebrides-sea", name: "Hebrides Sea Overture · Mendelssohn", nameAr: "افتتاحية البحر · مندلسون", mood: "orchestral", defaultFor: ["maree"] },
  { slug: "royal-figaro", name: "Marriage of Figaro · Mozart", nameAr: "زواج فيغارو · موتسارت", mood: "orchestral", defaultFor: ["grand-stage"] },
  { slug: "magic-flute", name: "Magic Flute Overture · Mozart", nameAr: "الناي السحري · موتسارت", mood: "orchestral", defaultFor: ["ballroom"] },
  { slug: "brahms-pastorale", name: "Pastoral Allegretto · Brahms", nameAr: "باستورال · برامز", mood: "orchestral", defaultFor: ["chateau"] },
  { slug: "brahms-romance", name: "Symphonic Romance · Brahms", nameAr: "رومانسية سيمفونية · برامز", mood: "orchestral", defaultFor: ["palais"] },
  { slug: "tchaikovsky-grace", name: "Imperial Grace Waltz · Tchaikovsky", nameAr: "فالس النعومة الإمبراطوري · تشايكوفسكي", mood: "orchestral", defaultFor: ["concerto"] },

  // Chamber Strings (13)
  { slug: "borodin-notturno", name: "Nocturne for Strings · Borodin", nameAr: "نوكتورن الوتريات · بورودين", mood: "strings", defaultFor: ["arabesque"] },
  { slug: "borodin-moderato", name: "Velvet Strings · Borodin", nameAr: "وتريات مخملية · بورودين", mood: "strings", defaultFor: ["dimashqi"] },
  { slug: "borodin-andante", name: "Courtyard Andante · Borodin", nameAr: "أندانتي الفناء · بورودين", mood: "strings", defaultFor: ["medina"] },
  { slug: "dvorak-romanza", name: "String Romanza · Dvořák", nameAr: "رومانسية وتريات · دفورجاك", mood: "strings", defaultFor: ["mihrab"] },
  { slug: "dvorak-american-lento", name: "Twilight Lento · Dvořák", nameAr: "لينتو الغسق · دفورجاك", mood: "strings", defaultFor: ["layal"] },
  { slug: "dvorak-american-allegro", name: "Sunlit Horizon · Dvořák", nameAr: "أفق مشرق · دفورجاك", mood: "strings", defaultFor: ["azure"] },
  { slug: "suk-meditation", name: "Candlelight Meditation · Suk", nameAr: "تأمل على ضوء الشموع · سوك", mood: "strings", defaultFor: ["sahra"] },
  { slug: "haydn-lark-adagio", name: "Lark Adagio · Haydn", nameAr: "أداجيو القبرة · هايدن", mood: "strings", defaultFor: ["chateau-aquarelle"] },
  { slug: "haydn-lark-minuet", name: "Palace Minuet · Haydn", nameAr: "مينويت القصر · هايدن", mood: "strings", defaultFor: ["cristal"] },
  { slug: "mozart-cantabile", name: "Andante Cantabile · Mozart", nameAr: "أندانتي كانتابيلي · موتسارت", mood: "strings", defaultFor: ["barakah-engagement"] },
  { slug: "mozart-quartet-minuet", name: "Viennese Minuet · Mozart", nameAr: "مينويت فيينا · موتسارت", mood: "strings", defaultFor: ["fontaine"] },
  { slug: "mozart-symphony-andante", name: "Classical Andante · Mozart", nameAr: "أندانتي كلاسيكي · موتسارت", mood: "strings", defaultFor: ["beach"] },
  { slug: "beethoven-adagio", name: "Chamber Adagio · Beethoven", nameAr: "أداجيو الحجرة · بيتهوفن", mood: "strings", defaultFor: ["rivage"] },

  // Solo Piano (14)
  { slug: "chopin-nocturne-9-2", name: "Nocturne in E-Flat · Chopin", nameAr: "نوكتورن مي بيمول · شوبان", mood: "piano", defaultFor: ["gardenia"] },
  { slug: "chopin-nocturne-27-2", name: "Nocturne in D-Flat · Chopin", nameAr: "نوكتورن ري بيمول · شوبان", mood: "piano", defaultFor: ["gardenia-couture"] },
  { slug: "chopin-nocturne-15-1", name: "Nocturne in F Major · Chopin", nameAr: "نوكتورن فا ماجور · شوبان", mood: "piano", defaultFor: ["camelia"] },
  { slug: "chopin-nocturne-32-1", name: "Nocturne in B Major · Chopin", nameAr: "نوكتورن سي ماجور · شوبان", mood: "piano", defaultFor: ["nacre"] },
  { slug: "chopin-nocturne-32-2", name: "Nocturne in A-Flat · Chopin", nameAr: "نوكتورن لا بيمول · شوبان", mood: "piano", defaultFor: ["lin"] },
  { slug: "chopin-nocturne-55-2", name: "Evening Nocturne · Chopin", nameAr: "نوكتورن المساء · شوبان", mood: "piano", defaultFor: ["minuit"] },
  { slug: "chopin-nocturne-62-2", name: "Golden Nocturne · Chopin", nameAr: "النوكتورن الذهبي · شوبان", mood: "piano", defaultFor: ["arabian-veil"] },
  { slug: "chopin-nocturne-b49", name: "Lento Espressivo · Chopin", nameAr: "لينتو عاطفي · شوبان", mood: "piano", defaultFor: ["neige"] },
  { slug: "chopin-raindrop", name: "Raindrop Prelude · Chopin", nameAr: "بريلود قطرات المطر · شوبان", mood: "piano", defaultFor: ["coeur-de-perle"] },
  { slug: "chopin-prelude-13", name: "Prelude in F-Sharp · Chopin", nameAr: "بريلود فا دييز · شوبان", mood: "piano", defaultFor: ["fulla"] },
  { slug: "chopin-prelude-17", name: "Prelude in A-Flat · Chopin", nameAr: "بريلود لا بيمول · شوبان", mood: "piano", defaultFor: ["jasmine"] },
  { slug: "chopin-prelude-21", name: "Cantabile Prelude · Chopin", nameAr: "بريلود كانتابيلي · شوبان", mood: "piano", defaultFor: ["bustan"] },
  { slug: "goldberg-aria", name: "Goldberg Aria · Bach", nameAr: "آريا غولدبرغ · باخ", mood: "piano", defaultFor: ["douceur", "ivory-seal"] },
  { slug: "schubert-andante-664", name: "Sonata Andante · Schubert", nameAr: "أندانتي سوناتا · شوبرت", mood: "piano", defaultFor: ["ciel"] },

  // Waltz & Salon (10)
  { slug: "chopin-waltz-69-1", name: "Farewell Waltz · Chopin", nameAr: "فالس لا بيمول · شوبان", mood: "waltz", defaultFor: ["giverny"] },
  { slug: "chopin-waltz-64-2", name: "Valse Romantique · Chopin", nameAr: "فالس رومانسي · شوبان", mood: "waltz", defaultFor: ["lilas"] },
  { slug: "chopin-waltz-64-3", name: "A-Flat Salon Waltz · Chopin", nameAr: "فالس الصالون · شوبان", mood: "waltz", defaultFor: ["magnolia"] },
  { slug: "chopin-waltz-70-1", name: "Springtime Waltz · Chopin", nameAr: "فالس الربيع · شوبان", mood: "waltz", defaultFor: ["glycine"] },
  { slug: "chopin-waltz-70-3", name: "Velvet Waltz · Chopin", nameAr: "فالس مخملي · شوبان", mood: "waltz", defaultFor: ["rose"] },
  { slug: "chopin-grande-valse", name: "Grande Valse Brillante · Chopin", nameAr: "الفالس الكبير اللامع · شوبان", mood: "waltz", defaultFor: ["jukebox"] },
  { slug: "chopin-waltz-34-3", name: "Valse Brillante in F · Chopin", nameAr: "فالس فا اللامع · شوبان", mood: "waltz", defaultFor: ["love-passport"] },
  { slug: "chopin-flute-variations", name: "Flute & Piano Serenade · Chopin", nameAr: "سيريناد الفلوت والبيانو · شوبان", mood: "waltz", defaultFor: ["la-gare"] },
  { slug: "chopin-impromptu-1", name: "Impromptu in A-Flat · Chopin", nameAr: "إمبرومبتو لا بيمول · شوبان", mood: "waltz", defaultFor: ["odyssey"] },
  { slug: "chopin-waltz-b133", name: "Sostenuto Waltz · Chopin", nameAr: "فالس سوستينوتو · شوبان", mood: "waltz", defaultFor: ["pivoine"] },
];

export const BUILT_IN_MUSIC: MusicTrack[] = BUILT_IN_SPECS.map((s) => ({
  id: `lib_${s.slug}`,
  name: s.name,
  nameAr: s.nameAr,
  mood: s.mood,
  builtIn: true,
  url: `/music/${s.slug}.m4a`,
  createdAt: BUNDLED_AT,
}));

export const DEFAULT_TEMPLATE_MUSIC: Record<string, string> = Object.fromEntries(
  BUILT_IN_SPECS.flatMap((s) => s.defaultFor.map((tplId) => [tplId, `lib_${s.slug}`])),
);

export function musicDisplayName(track: Pick<MusicTrack, "name" | "nameAr">, lang: Lang): string {
  return lang === "ar" ? track.nameAr || track.name : track.name;
}

/**
 * Splits a concert-programme track label ("Nocturne in E-Flat · Chopin")
 * into its piece title and composer/subtitle for typographic hierarchy.
 */
export function musicParts(
  track: Pick<MusicTrack, "name" | "nameAr">,
  lang: Lang,
): { title: string; composer?: string } {
  const full = musicDisplayName(track, lang).trim();
  const sep = full.includes(" · ") ? " · " : full.includes(" — ") ? " — " : null;
  if (!sep) return { title: full };
  const idx = full.indexOf(sep);
  const title = full.slice(0, idx).trim();
  const composer = full.slice(idx + sep.length).trim();
  return composer ? { title, composer } : { title: title || full };
}
