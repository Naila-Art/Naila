import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplatePreviewStage from "@/components/store/TemplatePreviewStage";
import TemplateIntro from "@/components/store/TemplateIntro";
import { findTemplate, getPricing, getTemplateMusicMap, listMusic, listTemplates } from "@/lib/store";
import { requestLang, storefrontMetadata } from "@/lib/seo";
import { TEMPLATE_EDITORIAL_META, templateDisplayName } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await findTemplate((await params).id);
  if (!template) return { title: "Not found | Naila" };
  const meta = TEMPLATE_EDITORIAL_META[template.id];
  return storefrontMetadata(
    `/t/${template.id}`,
    {
      en: `${templateDisplayName(template, "en")} — Digital Invitation Design | Naila`,
      ar: `${templateDisplayName(template, "ar")} — تصميم دعوة رقمية | نايلة`,
    },
    {
      en: meta?.taglineEn ?? "Preview this digital invitation design live, then make it yours with your names, date and music.",
      ar: meta?.taglineAr ?? "عايني تصميم الدعوة الرقمية مباشرةً، ثم اجعليه دعوتك بأسمائكما وموعدكما وموسيقاكما.",
    },
  );
}

/** Public template preview from the storefront, with bilingual floating bottom dock & live music switcher. */
export default async function Page({ params }: Props) {
  const template = await findTemplate((await params).id);
  if (!template) notFound();
  const [all, pricing, lang, music, musicMap] = await Promise.all([
    listTemplates(),
    getPricing(),
    requestLang(),
    listMusic(),
    getTemplateMusicMap(),
  ]);
  const defaultTrackId = musicMap[template.id] ?? "";
  // Similar designs: same style first, then same occasion.
  const others = all.filter((t) => t.id !== template.id);
  const related = [
    ...others.filter((t) => template.style && t.style === template.style),
    ...others.filter((t) => t.category === template.category && !(template.style && t.style === template.style)),
  ].slice(0, 6);
  return (
    <TemplatePreviewStage template={template} music={music} defaultTrackId={defaultTrackId}>
      <TemplateIntro template={template} related={related} pricing={pricing} lang={lang} />
    </TemplatePreviewStage>
  );
}
