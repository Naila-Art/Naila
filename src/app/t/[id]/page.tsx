import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplatePreview from "@/components/TemplatePreview";
import TemplatePreviewDock from "@/components/store/TemplatePreviewDock";
import { findTemplate } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await findTemplate((await params).id);
  return {
    title: template ? `${template.name} — Live Preview | Naila` : "Live Preview",
  };
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
