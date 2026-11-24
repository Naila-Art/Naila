import type { MetadataRoute } from "next";
import { langPath } from "@/lib/locale";
import { getPackage } from "@/lib/pricing";
import { siteUrl } from "@/lib/seo";
import { getPricing, listTemplates } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Every storefront page in English and Arabic, each listing the other as its alternate. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const [templates, pricing] = await Promise.all([listTemplates(), getPricing()]);
  const bespokeOpen = [3, 4].some((id) => getPackage(pricing, id)?.active);

  const paths = [
    "/",
    "/samples",
    "/create",
    ...(bespokeOpen ? ["/request"] : []),
    ...templates.map((t) => `/t/${t.id}`),
  ];

  return paths.flatMap((path) => {
    const languages = { en: `${url}${path === "/" ? "" : path}`, ar: `${url}${langPath("ar", path)}` };
    return [
      { url: languages.en, alternates: { languages } },
      { url: languages.ar, alternates: { languages } },
    ];
  });
}
