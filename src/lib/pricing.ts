import type { Addons, EventData, Features, NamesTier, Order, PackageId } from "./types";

/**
 * Prices from Ziad's PDF (EGP). One place to change them.
 * The guest-count tiers for named links were agreed in principle; the 300 / unlimited prices
 * are placeholders until Ziad confirms them.
 */
export interface PackageInfo {
  id: PackageId;
  name: string;
  price: number;
  /** Packages 1–2 are built by the client in the storefront; 3–4 are made by our team. */
  selfServe: boolean;
  points: string[];
  /** Shown instead of a fixed price on the open-ended package. */
  priceNote?: string;
}

export const PACKAGES: PackageInfo[] = [
  {
    id: 1,
    name: "البسيطة",
    price: 300,
    selfServe: true,
    points: ["فتح الختم بالأنيميشن", "أسامي العروسين والتاريخ", "تأكيد الحضور والعد التنازلي"],
  },
  {
    id: 2,
    name: "المميزة",
    price: 600,
    selfServe: true,
    points: ["كل اللي في البسيطة", "مزيكا من مكتبتنا", "المعازيم يبعتوا تهاني"],
  },
  {
    id: 3,
    name: "على ذوقك",
    price: 1000,
    selfServe: false,
    points: ["صورك وفيديوهاتك", "ابعتلنا ريفرنسات وإحنا ننفذ", "اللينك يوصلك على واتساب"],
  },
  {
    id: 4,
    name: "الخاصة",
    price: 2000,
    selfServe: false,
    priceNote: "تبدأ من",
    points: ["تصميم خاص مع المصمم", "تعديلات لحد ما توصل للي في دماغك", "دعوة باسم كل معزوم مشمولة", "خصم 50% لأول حد ترشحه"],
  },
];

export const ADDON_PRICES = { arabic: 50, maps: 25, customMusic: 75 } as const;

export const NAMES_TIERS: Record<NamesTier, { label: string; price: number; limit: number }> = {
  "100": { label: "لحد 100 معزوم", price: 200, limit: 100 },
  "300": { label: "لحد 300 معزوم", price: 350, limit: 300 },
  unlimited: { label: "عدد مفتوح", price: 500, limit: 5000 },
};

export const ADDON_LABELS = {
  arabic: "الدعوة بالعربي",
  maps: "لوكيشن على جوجل ماب",
  customMusic: "أغنية من اختيارك",
  names: "دعوة باسم كل معزوم",
} as const;

export const NO_ADDONS: Addons = { arabic: false, maps: false, customMusic: false, names: null };

export function getPackage(id: number): PackageInfo | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function priceOf(packageId: PackageId, addons: Addons): number {
  const pkg = getPackage(packageId);
  if (!pkg) return 0;
  let total = pkg.price;
  if (addons.arabic) total += ADDON_PRICES.arabic;
  if (addons.maps) total += ADDON_PRICES.maps;
  if (addons.customMusic) total += ADDON_PRICES.customMusic;
  // Package 4 already includes named links.
  if (addons.names && packageId !== 4) total += NAMES_TIERS[addons.names].price;
  return total;
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

export function featuresOf(event: EventData, order: Order | null): Features {
  // Demo events (no order) get everything.
  if (!order) return { wishes: true, music: true, maps: true, namesLimit: NAMES_TIERS.unlimited.limit };
  const pkg = order.packageId;
  const names = pkg === 4 ? NAMES_TIERS.unlimited.limit : order.addons.names ? NAMES_TIERS[order.addons.names].limit : 0;
  return {
    wishes: pkg >= 2,
    music: pkg >= 2 || order.addons.customMusic,
    maps: pkg >= 3 || order.addons.maps,
    namesLimit: names,
  };
}

export const formatEgp = (n: number) => `${n.toLocaleString("en-US")} ج.م`;
