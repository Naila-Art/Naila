import m from "@/components/manage/manage.module.css";
import a from "@/components/admin/admin.module.css";
import FinanceGate from "@/components/admin/FinanceGate";
import PaymentsAdmin from "@/components/admin/PaymentsAdmin";
import { currentAdmin, financeUnlocked } from "@/lib/auth";
import { paymobEnabled } from "@/lib/paymob";
import { getFinancePasswordHash, listPaymentMethods } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Payment methods (where clients transfer money): behind the same password as the finance page. */
export default async function PaymentsPage() {
  const admin = (await currentAdmin())!;
  const hasPassword = Boolean(await getFinancePasswordHash());
  if (!hasPassword || !(await financeUnlocked(admin.id))) {
    return (
      <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
        <header className={a.pageHead}>
          <h1>طرق الدفع</h1>
        </header>
        <FinanceGate mode={hasPassword ? "unlock" : "setup"} />
      </main>
    );
  }
  return <PaymentsAdmin initial={await listPaymentMethods()} paymobReady={paymobEnabled()} />;
}
