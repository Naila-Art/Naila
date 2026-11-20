import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { currentAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/store";

export const metadata: Metadata = {
  title: "داشبورد الإدارة",
  robots: { index: false, follow: false },
};

/** Every dashboard page needs a signed-in team member. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const pending = (await listOrders()).filter((o) => !o.cancelledAt && o.payment === "pending_review").length;
  return (
    <AdminShell name={admin.name} pending={pending}>
      {children}
    </AdminShell>
  );
}
