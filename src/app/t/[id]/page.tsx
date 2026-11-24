import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplatePreview from "@/components/TemplatePreview";
import TemplatePreviewDock from "@/components/store/TemplatePreviewDock";
import { findTemplate } from "@/lib/store";
import { storefrontMetadata } from "@/lib/seo";
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

/** Public template preview from the storefront, with bilingual floating bottom dock. */
export default async function Page({ params }: Props) {
  const template = await findTemplate((await params).id);
  if (!template) notFound();
  return (
    <>
      <TemplatePreview template={template} />
      <TemplatePreviewDock template={template} />
    </>
  );
}
