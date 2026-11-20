import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplatesAdmin from "@/components/admin/TemplatesAdmin";
import { isAdmin } from "@/lib/admin";
import { listTemplates, templateUsage } from "@/lib/store";

type Props = { params: Promise<{ key: string }> };

export const metadata: Metadata = {
  title: "التيمبليتس",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({ params }: Props) {
  const { key } = await params;
  if (!isAdmin(key)) notFound();
  return <TemplatesAdmin adminKey={key} initialTemplates={await listTemplates()} initialUsage={await templateUsage()} />;
}
