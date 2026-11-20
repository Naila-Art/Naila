import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

type Props = { params: Promise<{ key: string }> };

/** The full admin dashboard (clients, revenue, orders) comes in a later stage; templates are first. */
export default async function AdminHome({ params }: Props) {
  const { key } = await params;
  if (!isAdmin(key)) notFound();
  redirect(`/admin/${key}/templates`);
}
