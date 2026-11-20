import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { MIN_PASSWORD, hashPassword, isEmail, requireAdmin, verifyPassword } from "@/lib/auth";
import { addAdminUser, deleteAdminUser, listAdminUsers, updateAdminPassword } from "@/lib/store";

const publicUser = ({ id, name, email, createdAt }: { id: string; name: string; email: string; createdAt: string }) => ({
  id,
  name,
  email,
  createdAt,
});

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ users: (await listAdminUsers()).map(publicUser), me: admin.id });
}

/** Add a team member. Body: { name, email, password } */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  const name = cleanText(body?.name, 40);
  if (!name) return bad("name_required");
  if (!isEmail(body?.email)) return bad("invalid_email");
  if (typeof body?.password !== "string" || body.password.length < MIN_PASSWORD) return bad("weak_password");
  const user = await addAdminUser({ name, email: body.email, passwordHash: await hashPassword(body.password) });
  if (!user) return bad("email_taken", 409);
  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}

/** Change my own password. Body: { current, next } */
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const body = await readJson(req);
  if (typeof body?.current !== "string" || !(await verifyPassword(body.current, admin.passwordHash))) return bad("wrong_password", 403);
  if (typeof body?.next !== "string" || body.next.length < MIN_PASSWORD) return bad("weak_password");
  await updateAdminPassword(admin.id, await hashPassword(body.next));
  return NextResponse.json({ ok: true });
}

/** Remove a team member: ?id= (not yourself, not the last account). */
export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (id === admin.id) return bad("cannot_remove_self", 409);
  const result = await deleteAdminUser(id);
  if (result === "not_found") return bad("not_found", 404);
  if (result === "last") return bad("last_admin", 409);
  return NextResponse.json({ ok: true });
}
