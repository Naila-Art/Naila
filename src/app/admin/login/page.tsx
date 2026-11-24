import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { currentAdmin } from "@/lib/auth";
import { listAdminUsers } from "@/lib/store";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Dashboard sign-in. With no accounts yet, it creates the first one (needs the setup code). */
export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  const firstRun = (await listAdminUsers()).length === 0;
  return <LoginForm firstRun={firstRun} />;
}
