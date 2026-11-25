import Link from "next/link";
import m from "@/components/manage/manage.module.css";
import a from "@/components/admin/admin.module.css";
import { adminOverview } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

/** Admin home: what needs action, clients and orders. Money lives on the finance page (its own password). */
export default async function AdminHome() {
  const s = await adminOverview();

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>الرئيسية</h1>
      </header>

      <section className={a.kpis}>
        <div className={a.kpi}>
          <span>العملاء</span>
          <strong>{s.clients}</strong>
          <small>{s.newClients} جديد الشهر ده</small>
        </div>
        <div className={a.kpi}>
          <span>طلبات مدفوعة الشهر ده</span>
          <strong>{s.paidOrdersThisMonth}</strong>
        </div>
        <div className={a.kpi}>
          <span>مستني تأكيد الدفع</span>
          <strong>{s.pendingInstapay}</strong>
        </div>
        <div className={a.kpi}>
          <span>دعوات معمولة ومادفعتش</span>
          <strong>{s.unpaidDrafts}</strong>
        </div>
      </section>

      <section className={m.panel}>
        <h2>محتاج منك</h2>
        <ul className={a.todo}>
          <li data-hot={s.pendingInstapay > 0}>
            <Link href="/admin/orders?f=pending">تحويلات مستنية تأكيد</Link>
            <strong>{s.pendingInstapay}</strong>
          </li>
          <li data-hot={s.newCustomRequests > 0}>
            <Link href="/admin/orders?f=custom">طلبات الباقة الخاصة الجديدة</Link>
            <strong>{s.newCustomRequests}</strong>
          </li>
          <li data-hot={s.openChangeRequests > 0}>
            <Link href="/admin/orders?f=changes">طلبات تعديل من العملاء</Link>
            <strong>{s.openChangeRequests}</strong>
          </li>
          <li>
            <Link href="/admin/orders?f=unpaid">دعوات معمولة ومادفعتش لسه</Link>
            <strong>{s.unpaidDrafts}</strong>
          </li>
        </ul>
      </section>

      <p className={m.hint}>
        الفلوس والحسابات في صفحة <Link href="/admin/finance">الحسابات</Link> (ليها باسورد خاص).
      </p>
    </main>
  );
}
