import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "داشبورد الإدارة",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { children: ReactNode; params: Promise<{ key: string }> };

/** Every admin page sits behind the private key in the URL (ADMIN_TOKEN). */
export default async function AdminLayout({ children, params }: Props) {
  const { key } = await params;
  if (!isAdmin(key)) notFound();
  return (
    <>
      <AdminNav adminKey={key} />
      {children}
    </>
  );
}
