import type { EventData, Features, Order, PackageId } from "./types";

/**
 * Packages and prices. Edited from the admin dashboard (/admin/{key}/pricing) and saved in the
 * store; DEFAULT_PRICING (Ziad's PDF) is used until someone saves. Orders keep the total they
 * were created with. There are no add-ons: language (Arabic/English) and the location are free
 * in every package.
 *
 * What a package *does* (self-serve or not, which features it unlocks) is fixed by its number
 * in code below; the dashboard edits names, prices, bullet points and whether it's on sale.
 *
 * The same settings hold the three "how it works" keypoints shown under the packages on the
 * landing page, in Arabic and English. There are always exactly three.
 */
export interface PackageInfo {
  id: PackageId;
  name: string;
  price: number;
  points: string[];
  /** English selling points; the storefront falls back to built-in English copy when empty. */
  pointsEn?: string[];
  /** e.g. "تبدأ من" on the open-ended package. */
  priceNote?: string;
  /** Hidden from the storefront and refused for new orders when false. */
  active: boolean;
}

export interface StepText {
  title: string;
  body: string;
}

/** One "how it works" keypoint on the landing page's pricing card. */
export interface PricingStep {
  ar: StepText;
  en: StepText;
}

export const STEP_COUNT = 3;

export interface Pricing {
  packages: PackageInfo[];
  /** Always STEP_COUNT long. */
  steps: PricingStep[];
}

export const DEFAULT_STEPS: PricingStep[] = [
  {
    ar: {
      title: "اختاري الروح اللي شبهك",
      body: "شوفي مجموعتنا للزفاف والخطوبة وكتب الكتاب، أو اطلبي تصميم حصري ننفّذه على ذوقك وألوان قاعتك من الصفر.",
    },
    en: {
      title: "Choose the mood that feels like you",
      body: "Explore our curated wedding, engagement, and katb kitab themes—or commission a bespoke suite matched to your venue and palette.",
    },
  },
  {
    ar: {
      title: "ضيفي تفاصيل فرحك",
      body: "اكتبي الأسامي، التاريخ، القاعة، واختاري الموسيقى وشوفي دعوتك بتتشكّل قدام عينيك لحظة بلحظة.",
    },
    en: {
      title: "Personalize every detail in minutes",
      body: "Add your names, date, venue pin, soundtrack, and wording, and watch your live invitation come together on screen.",
    },
  },
  {
    ar: {
      title: "فعّليها وشاركي الفرحة",
      body: "ادفعي مرة واحدة، ابعتي اللينكات على واتساب، وتابعي تأكيدات الحضور ودفتر التهاني لايف.",
    },
    en: {
      title: "Activate & share with confidence",
      body: "Pay once, send named WhatsApp links to your guest list, and watch opens, RSVPs, and heartfelt wishes arrive live.",
    },
  },
];

export const DEFAULT_PRICING: Pricing = {
  packages: [
    { id: 1, name: "البسيطة", price: 300, active: true, points: ["فتح الختم بالأنيميشن", "أسامي العروسين والتاريخ", "تأكيد الحضور والعد التنازلي"] },
    { id: 2, name: "المميزة", price: 600, active: true, points: ["كل اللي في البسيطة", "مزيكا من مكتبتنا", "الضيوف يبعتوا تهاني"] },
    {
      id: 3,
      name: "على ذوقك",
      price: 1000,
      active: true,
      points: ["صورك وفيديوهاتك", "ابعتلنا ريفرنسات وإحنا ننفذ", "دعوة باسم كل ضيف", "رسالة خاصة لأي ضيف لو حابب"],
    },
    {
      id: 4,
      name: "الخاصة",
      price: 2000,
      active: true,
      priceNote: "تبدأ من",
      points: ["تصميم خاص مع المصمم", "تعديلات لحد ما توصل للي في دماغك", "دعوة باسم كل ضيف ورسالة خاصة", "خصم 50% لأول حد ترشحه"],
    },
  ],
  steps: DEFAULT_STEPS,
};

/** What every package includes, shown once on the storefront instead of repeating it per package. */
export const INCLUDED_IN_ALL = ["عربي أو إنجليزي", "اللوكيشن على جوجل ماب", "اللينك يوصلك على واتساب"];

/**
 * Packages 1-3 are ordered and paid on the site (3 also gets our team's custom work, from the client's
 * brief and uploads). Package 4 is a request: we talk to the client first.
 */
export const isSelfServe = (id: PackageId) => id <= 3;

/** Named links per guest (with an optional personal message) come with packages 3-4. */
export const NAMES_LIMIT = 5000;
export const hasNamedGuests = (id: PackageId) => id >= 3;

export function getPackage(pricing: Pricing, id: number): PackageInfo | undefined {
  return pricing.packages.find((p) => p.id === id);
}

export function priceOf(pricing: Pricing, packageId: PackageId): number {
  return getPackage(pricing, packageId)?.price ?? 0;
}

const isStepText = (t: unknown): t is StepText =>
  !!t && typeof (t as StepText).title === "string" && typeof (t as StepText).body === "string";

const validSteps = (steps: unknown): steps is PricingStep[] =>
  Array.isArray(steps) &&
  steps.length === STEP_COUNT &&
  steps.every((s) => isStepText((s as PricingStep)?.ar) && isStepText((s as PricingStep)?.en));

/** "معزوم" became "ضيف" across the product (Nov 2026); older saved text is updated on read. */
const toGuestWording = (s: string) =>
  s.replace(/المعازيم/g, "الضيوف").replace(/معازيم/g, "ضيوف").replace(/المعزوم/g, "الضيف").replace(/معزوم/g, "ضيف");

/**
 * Older saved settings may carry add-on fields and no keypoints; keep only the packages
 * (with the current guest wording) and fill in the default keypoints until someone saves new ones.
 */
export function withDefaults(p: Partial<Pricing> | undefined): Pricing {
  return {
    packages:
      p?.packages?.length === 4
        ? p.packages.map((pk) => ({ ...pk, name: toGuestWording(pk.name), points: pk.points.map(toGuestWording) }))
        : DEFAULT_PRICING.packages,
    steps: validSteps(p?.steps) ? p.steps : DEFAULT_STEPS,
  };
}

/** What a package unlocks. */
export function packageFeatures(pkg: PackageId): Features {
  return {
    wishes: pkg >= 2,
    music: pkg >= 2,
    maps: true,
    rsvp: pkg >= 2,
    namesLimit: hasNamedGuests(pkg) ? NAMES_LIMIT : 0,
  };
}

export function featuresOf(event: EventData, order: Order | null): Features {
  if (event.samplePackage) return packageFeatures(event.samplePackage);
  // Demo events (no order) get everything.
  if (!order) return packageFeatures(4);
  return packageFeatures(order.packageId);
}

export const formatEgp = (n: number) => `${n.toLocaleString("en-US")} ج.م`;

const MAX_PRICE = 1_000_000;

/** Validates prices sent from the dashboard. Returns the cleaned settings or an error code. */
export function parsePricing(input: unknown): { ok: true; value: Pricing } | { ok: false; error: string } {
  const o = (input ?? {}) as Record<string, unknown>;
  const price = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_PRICE ? v : null);
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() && v.trim().length <= max ? v.trim() : null);

  const rawPackages = Array.isArray(o.packages) ? o.packages : [];
  const packages: PackageInfo[] = [];
  for (const id of [1, 2, 3, 4] as PackageId[]) {
    const p = (rawPackages.find((x) => (x as { id?: unknown })?.id === id) ?? {}) as Record<string, unknown>;
    const name = text(p.name, 40);
    if (!name) return { ok: false, error: `package_${id}_name` };
    const pr = price(p.price);
    if (pr === null) return { ok: false, error: `package_${id}_price` };
    const points = (Array.isArray(p.points) ? p.points : [])
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    if (points.length > 8 || points.some((x) => x.length > 100)) return { ok: false, error: `package_${id}_points` };
    const pointsEn = (Array.isArray(p.pointsEn) ? p.pointsEn : [])
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    if (pointsEn.length > 8 || pointsEn.some((x) => x.length > 100)) return { ok: false, error: `package_${id}_pointsEn` };
    const priceNote = typeof p.priceNote === "string" && p.priceNote.trim() ? p.priceNote.trim().slice(0, 20) : undefined;
    packages.push({
      id,
      name,
      price: pr,
      points,
      pointsEn: pointsEn.length ? pointsEn : undefined,
      priceNote,
      active: p.active !== false,
    });
  }
  if (!packages.some((p) => p.active && isSelfServe(p.id))) return { ok: false, error: "need_self_serve" };

  const rawSteps = Array.isArray(o.steps) ? o.steps : [];
  if (rawSteps.length !== STEP_COUNT) return { ok: false, error: "steps_count" };
  const steps: PricingStep[] = [];
  for (let i = 0; i < STEP_COUNT; i++) {
    const s = (rawSteps[i] ?? {}) as Record<string, Record<string, unknown> | undefined>;
    const step = {} as PricingStep;
    for (const lang of ["ar", "en"] as const) {
      const title = text(s[lang]?.title, 80);
      if (!title) return { ok: false, error: `step_${i + 1}_${lang}_title` };
      const body = text(s[lang]?.body, 240);
      if (!body) return { ok: false, error: `step_${i + 1}_${lang}_body` };
      step[lang] = { title, body };
    }
    steps.push(step);
  }
  return { ok: true, value: { packages, steps } };
}
