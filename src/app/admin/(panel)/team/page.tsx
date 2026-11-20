import TeamAdmin from "@/components/admin/TeamAdmin";
import { currentAdmin } from "@/lib/auth";
import { listAdminUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = (await currentAdmin())!;
  const users = (await listAdminUsers()).map(({ id, name, email, createdAt }) => ({ id, name, email, createdAt }));
  return <TeamAdmin initial={users} meId={me.id} />;
}
