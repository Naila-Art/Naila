import m from "@/components/manage/manage.module.css";
import a from "@/components/admin/admin.module.css";
import FinanceGate, { FinanceTools } from "@/components/admin/FinanceGate";
import FinanceDashboard, { type FinanceRow } from "@/components/admin/FinanceDashboard";
import { currentAdmin, financeUnlocked } from "@/lib/auth";
import { getFinancePasswordHash, getPricing, listEvents, listOrders, listPaymentMethods } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Revenue and totals, behind the finance password (separate from the login). */
export default async function FinancePage() {
  const admin = (await currentAdmin())!;
  const hasPassword = Boolean(await getFinancePasswordHash());

  if (!hasPassword || !(await financeUnlocked(admin.id))) {
    return (
      <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
        <header className={a.pageHead}>
          <h1>الحسابات</h1>
        </header>
        <FinanceGate mode={hasPassword ? "unlock" : "setup"} />
      </main>
    );
  }

  const [orders, events, pricing, methods] = await Promise.all([listOrders(), listEvents(), getPricing(), listPaymentMethods()]);
  const coupleOf = new Map(events.map((e) => [e.id, `${e.partnerA} و ${e.partnerB}`]));
  const rows: FinanceRow[] = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    cancelledAt: o.cancelledAt,
    refunded: Boolean(o.refunded),
    payment: o.payment,
    packageId: o.packageId,
    total: o.total,
    method: o.paymentMethod ?? "",
    methodName: o.paymentMethodName ?? "",
    client: o.clientName,
    couple: o.eventId ? (coupleOf.get(o.eventId) ?? "") : "",
  }));

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>الحسابات</h1>
        <FinanceTools />
      </header>
      <FinanceDashboard
        rows={rows}
        packages={pricing.packages.map(({ id, name }) => ({ id, name }))}
        methods={[...methods.map(({ id, name }) => ({ id, name })), { id: "paymob", name: "فيزا (باي موب)" }]}
      />
    </main>
  );
}
