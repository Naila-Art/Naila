import type { EventData, Features, Order, PackageId } from "./types";

/**
 * Packages and prices. Edited from the admin dashboard (/admin/{key}/pricing) and saved in the
 * store; DEFAULT_PRICING (Ziad's PDF) is used until someone saves. Orders keep the total they
 * were created with. There are no add-ons: language (Arabic/English) and the location are free
 * in every package.
 *
 * What a package *does* (self-serve or not, which features it unlocks) is fixed by its number
 * in code below; the dashboard edits names, prices, bullet points and whether it's on sale.
 */
export interface PackageInfo {
  id: PackageId;
  name: string;
  price: number;
  points: string[];
  /** e.g. "تبدأ من" on the open-ended package. */
  priceNote?: string;
  /** Hidden from the storefront and refused for new orders when false. */
  active: boolean;
}

export interface Pricing {
  packages: PackageInfo[];
}

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

/** "معزوم" became "ضيف" across the product (Nov 2026); older saved text is updated on read. */
const toGuestWording = (s: string) =>
  s.replace(/المعازيم/g, "الضيوف").replace(/معازيم/g, "ضيوف").replace(/المعزوم/g, "الضيف").replace(/معزوم/g, "ضيف");

/** Older saved settings may carry add-on fields; keep only the packages. */
export function withDefaults(p: Partial<Pricing> | undefined): Pricing {
  if (p?.packages?.length !== 4) return DEFAULT_PRICING;
  return {
    packages: p.packages.map((pk) => ({ ...pk, name: toGuestWording(pk.name), points: pk.points.map(toGuestWording) })),
  };
}

/** What a package unlocks. */
export function packageFeatures(pkg: PackageId): Features {
  return {
    wishes: pkg >= 2,
    music: pkg >= 2,
    maps: true,
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
    const priceNote = typeof p.priceNote === "string" && p.priceNote.trim() ? p.priceNote.trim().slice(0, 20) : undefined;
    packages.push({ id, name, price: pr, points, priceNote, active: p.active !== false });
  }
  if (!packages.some((p) => p.active && isSelfServe(p.id))) return { ok: false, error: "need_self_serve" };
  return { ok: true, value: { packages } };
}
