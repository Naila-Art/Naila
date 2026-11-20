/**
 * Business settings that come from environment variables (.env.local / Vercel → Settings → Environment Variables).
 * Safe to show to clients; secrets never go here.
 */
export function siteSettings() {
  return {
    /** Brand name: pending with Ahmad. */
    brand: process.env.BRAND_NAME?.trim() || "دعوة",
    /** Our WhatsApp, international digits only, e.g. 201001234567. */
    whatsapp: (process.env.WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
    /** Instapay address shown to clients, e.g. name@instapay. */
    instapay: process.env.INSTAPAY_HANDLE?.trim() || "",
  };
}

export type SiteSettings = ReturnType<typeof siteSettings>;

export const whatsappLink = (number: string, text: string) =>
  number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : "";
