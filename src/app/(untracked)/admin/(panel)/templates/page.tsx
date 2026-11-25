import type { Metadata } from "next";
import TemplatesAdmin from "@/components/admin/TemplatesAdmin";
import { listTemplates, templateUsage } from "@/lib/store";

export const metadata: Metadata = {
  title: "التيمبليتس",
  robots: { index: false, follow: false },
};

export default async function Page() {
  return <TemplatesAdmin initialTemplates={await listTemplates()} initialUsage={await templateUsage()} />;
}
