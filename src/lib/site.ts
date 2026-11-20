import "server-only";
import { getStoredSiteSettings } from "./store";

/**
 * Public business settings, edited from the dashboard (/admin/settings).
 * Environment variables (BRAND_NAME, WHATSAPP_NUMBER) are the fallback until someone saves.
 */
export interface Socials {
  facebook: string;
  instagram: string;
  tiktok: string;
}

export interface SiteSettings {
  brand: string;
  /** International digits only, e.g. 201001234567. */
  whatsapp: string;
  socials: Socials;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const saved = await getStoredSiteSettings();
  return {
    brand: saved?.brand?.trim() || process.env.BRAND_NAME?.trim() || "دعوة",
    whatsapp: (saved?.whatsapp || process.env.WHATSAPP_NUMBER || "").replace(/\D/g, ""),
    socials: { facebook: "", instagram: "", tiktok: "", ...(saved?.socials ?? {}) },
  };
}

export const whatsappLink = (number: string, text: string) =>
  number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : "";
