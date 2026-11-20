import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TemplatePreview from "@/components/TemplatePreview";
import { findTemplate } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await findTemplate((await params).id);
  return { title: template ? `معاينة: ${template.name}` : "معاينة" };
}

/** Public template preview from the storefront, with a button to start building with it. */
export default async function Page({ params }: Props) {
  const template = await findTemplate((await params).id);
  if (!template) notFound();
  return (
    <>
      <TemplatePreview template={template} />
      <Link
        href={`/create?t=${template.id}`}
        style={{
          position: "fixed",
          bottom: 16,
          insetInlineStart: 16,
          zIndex: 40,
          padding: "12px 20px",
          borderRadius: 999,
          background: "#9a6b34",
          color: "#fff",
          fontFamily: "Tajawal, system-ui, sans-serif",
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 8px 20px rgba(0,0,0,.2)",
        }}
      >
        اعمل دعوتك بالتصميم ده
      </Link>
    </>
  );
}
