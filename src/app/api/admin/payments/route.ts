import { NextResponse } from "next/server";
import { bad, cleanText, readJson } from "@/lib/api";
import { financeUnlocked, requireAdmin } from "@/lib/auth";
import { listPaymentMethods, savePaymentMethods } from "@/lib/store";
import type { PaymentMethodConfig } from "@/lib/types";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (!(await financeUnlocked(admin.id))) return bad("finance_locked", 403);
  return NextResponse.json({ methods: await listPaymentMethods() });
}

/** Replaces the whole list (order = display order). Body: { methods: [...] } */
export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (!(await financeUnlocked(admin.id))) return bad("finance_locked", 403);
  const body = await readJson(req);
  const raw = Array.isArray(body?.methods) ? body.methods : null;
  if (!raw || raw.length > 20) return bad("invalid_methods");

  const methods: PaymentMethodConfig[] = [];
  const ids = new Set<string>();
  for (const [i, item] of raw.entries()) {
    const m = (item ?? {}) as Record<string, unknown>;
    const name = cleanText(m.name, 40);
    if (!name) return bad(`method_${i + 1}_name`);
    const kind = m.kind === "card" ? "card" : "transfer";
    const account = typeof m.account === "string" ? m.account.trim().slice(0, 120) : "";
    const active = m.active === true;
    if (kind === "transfer" && active && !account) return bad(`method_${i + 1}_account`);
    let id = typeof m.id === "string" && /^[a-z0-9_]{1,40}$/.test(m.id) ? m.id : `pm_${Date.now().toString(36)}${i}`;
    while (ids.has(id)) id = `${id}_${i}`;
    ids.add(id);
    const instructions = typeof m.instructions === "string" && m.instructions.trim() ? m.instructions.trim().slice(0, 300) : undefined;
    methods.push({ id, name, kind, account: kind === "card" ? "" : account, instructions, active });
  }
  if (methods.filter((m) => m.kind === "card").length > 1) return bad("one_card_method");
  return NextResponse.json({ methods: await savePaymentMethods(methods) });
}
