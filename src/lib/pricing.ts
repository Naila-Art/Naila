import type { Addons, EventData, Features, NamesTier, Order, PackageId } from "./types";

/**
 * Packages, add-on prices and guest-count tiers.
 * Edited from the admin dashboard (/admin/{key}/pricing) and saved in the store; DEFAULT_PRICING
 * (Ziad's PDF) is used until someone saves. Orders keep the total they were created with.
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

export interface NamesTierInfo {
  label: string;
  price: number;
  /** Max named guests. */
  limit: number;
}

export interface Pricing {
  packages: PackageInfo[];
  addons: { arabic: number; maps: number; customMusic: number };
  namesTiers: Record<NamesTier, NamesTierInfo>;
}

export const DEFAULT_PRICING: Pricing = {
  packages: [
    { id: 1, name: "البسيطة", price: 300, active: true, points: ["فتح الختم بالأنيميشن", "أسامي العروسين والتاريخ", "تأكيد الحضور والعد التنازلي"] },
    { id: 2, name: "المميزة", price: 600, active: true, points: ["كل اللي في البسيطة", "مزيكا من مكتبتنا", "المعازيم يبعتوا تهاني"] },
    { id: 3, name: "على ذوقك", price: 1000, active: true, points: ["صورك وفيديوهاتك", "ابعتلنا ريفرنسات وإحنا ننفذ", "اللينك يوصلك على واتساب"] },
    {
      id: 4,
      name: "الخاصة",
      price: 2000,
      active: true,
      priceNote: "تبدأ من",
      points: ["تصميم خاص مع المصمم", "تعديلات لحد ما توصل للي في دماغك", "دعوة باسم كل معزوم مشمولة", "خصم 50% لأول حد ترشحه"],
    },
  ],
  addons: { arabic: 50, maps: 25, customMusic: 75 },
  namesTiers: {
    "100": { label: "لحد 100 معزوم", price: 200, limit: 100 },
    "300": { label: "لحد 300 معزوم", price: 350, limit: 300 },
    unlimited: { label: "عدد مفتوح", price: 500, limit: 5000 },
  },
};

export const NAMES_TIER_IDS: NamesTier[] = ["100", "300", "unlimited"];

/** Packages 1–2 are built by the client in the storefront; 3–4 are made by our team. */
export const isSelfServe = (id: PackageId) => id <= 2;

export const ADDON_LABELS = {
  arabic: "الدعوة بالعربي",
  maps: "لوكيشن على جوجل ماب",
  customMusic: "أغنية من اختيارك",
  names: "دعوة باسم كل معزوم",
} as const;

export const NO_ADDONS: Addons = { arabic: false, maps: false, customMusic: false, names: null };

export function getPackage(pricing: Pricing, id: number): PackageInfo | undefined {
  return pricing.packages.find((p) => p.id === id);
}

export function priceOf(pricing: Pricing, packageId: PackageId, addons: Addons): number {
  const pkg = getPackage(pricing, packageId);
  if (!pkg) return 0;
  let total = pkg.price;
  if (addons.arabic) total += pricing.addons.arabic;
  if (addons.maps) total += pricing.addons.maps;
  if (addons.customMusic) total += pricing.addons.customMusic;
  // Package 4 already includes named links.
  if (addons.names && packageId !== 4) total += pricing.namesTiers[addons.names].price;
  return total;
}

/** Guest cap an order gets; saved on the order so later tier edits don't change what was sold. */
export function namesLimitOf(pricing: Pricing, packageId: PackageId, addons: Addons): number {
  if (packageId === 4) return pricing.namesTiers.unlimited.limit;
  return addons.names ? pricing.namesTiers[addons.names].limit : 0;
}

/** Turns untrusted input into a valid add-on set. */
export function parseAddons(input: unknown): Addons {
  const o = (input ?? {}) as Record<string, unknown>;
  const names = o.names;
  return {
    arabic: o.arabic === true,
    maps: o.maps === true,
    customMusic: o.customMusic === true,
    names: names === "100" || names === "300" || names === "unlimited" ? names : null,
  };
}

export function featuresOf(event: EventData, order: Order | null, pricing: Pricing): Features {
  // Demo events (no order) get everything.
  if (!order) return { wishes: true, music: true, maps: true, namesLimit: pricing.namesTiers.unlimited.limit };
  const pkg = order.packageId;
  return {
    wishes: pkg >= 2,
    music: pkg >= 2 || order.addons.customMusic,
    maps: pkg >= 3 || order.addons.maps,
    namesLimit: order.namesLimit ?? namesLimitOf(pricing, pkg, order.addons),
  };
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

  const a = (o.addons ?? {}) as Record<string, unknown>;
  const addons = { arabic: price(a.arabic), maps: price(a.maps), customMusic: price(a.customMusic) };
  if (addons.arabic === null || addons.maps === null || addons.customMusic === null) return { ok: false, error: "addon_price" };

  const t = (o.namesTiers ?? {}) as Record<string, Record<string, unknown>>;
  const namesTiers = {} as Record<NamesTier, NamesTierInfo>;
  for (const id of NAMES_TIER_IDS) {
    const label = text(t[id]?.label, 40);
    const pr = price(t[id]?.price);
    const limit = t[id]?.limit;
    if (!label || pr === null) return { ok: false, error: `tier_${id}` };
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 5000) return { ok: false, error: `tier_${id}_limit` };
    namesTiers[id] = { label, price: pr, limit };
  }
  if (!(namesTiers["100"].limit < namesTiers["300"].limit && namesTiers["300"].limit <= namesTiers.unlimited.limit)) {
    return { ok: false, error: "tier_order" };
  }

  return {
    ok: true,
    value: { packages, addons: addons as Pricing["addons"], namesTiers },
  };
}
