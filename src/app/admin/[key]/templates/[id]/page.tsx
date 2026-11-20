import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplatePreview from "@/components/TemplatePreview";
import { isAdmin } from "@/lib/admin";
import { findTemplate } from "@/lib/store";

type Props = { params: Promise<{ key: string; id: string }> };

export const metadata: Metadata = {
  title: "معاينة التيمبليت",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Preview({ params }: Props) {
  const { key, id } = await params;
  if (!isAdmin(key)) notFound();
  const template = await findTemplate(id);
  if (!template) notFound();
  return <TemplatePreview template={template} />;
}
