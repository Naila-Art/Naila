import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplatePreview from "@/components/TemplatePreview";
import { findTemplate } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "معاينة التيمبليت",
  robots: { index: false, follow: false },
};

export default async function Preview({ params }: Props) {
  const { id } = await params;
  const template = await findTemplate(id);
  if (!template) notFound();
  return <TemplatePreview template={template} />;
}
