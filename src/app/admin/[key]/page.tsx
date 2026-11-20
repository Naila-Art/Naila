import Link from "next/link";
import m from "@/components/manage/manage.module.css";
import a from "@/components/admin/admin.module.css";
import { adminOverview } from "@/lib/admin-stats";
import { PACKAGES, formatEgp } from "@/lib/pricing";

type Props = { params: Promise<{ key: string }> };

export const dynamic = "force-dynamic";

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const monthLabel = (key: string) => `${MONTHS_AR[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

/** Admin home: clients, this month's revenue, what needs action. */
export default async function AdminHome({ params }: Props) {
  const { key } = await params;
  const s = await adminOverview();
  const maxRevenue = Math.max(1, ...s.months.map((x) => x.revenue));
  const base = `/admin/${key}`;

  return (
    <main className={m.page} dir="rtl" lang="ar">
      <header className={m.header}>
        <div className={m.kicker}>داشبورد الإدارة</div>
        <h1>الرئيسية</h1>
      </header>

      <section className={a.kpis}>
        <div className={a.kpi}>
          <span>فلوس الشهر ده</span>
          <strong>{formatEgp(s.revenueThisMonth)}</strong>
          <small>{s.paidOrdersThisMonth} طلب مدفوع</small>
        </div>
        <div className={a.kpi}>
          <span>العملاء</span>
          <strong>{s.clients}</strong>
          <small>{s.newClients} جديد الشهر ده</small>
        </div>
        <div className={a.kpi}>
          <span>الإجمالي من الأول</span>
          <strong>{formatEgp(s.revenueAllTime)}</strong>
          <small>من غير المرتجع</small>
        </div>
      </section>

      <section className={m.panel}>
        <h2>محتاج منك</h2>
        <ul className={a.todo}>
          <li data-hot={s.pendingInstapay > 0}>
            <Link href={`${base}/orders?f=pending`}>تحويلات إنستاباي مستنية تأكيد</Link>
            <strong>{s.pendingInstapay}</strong>
          </li>
          <li data-hot={s.newCustomRequests > 0}>
            <Link href={`${base}/orders?f=custom`}>طلبات باقات 3 و4 جديدة</Link>
            <strong>{s.newCustomRequests}</strong>
          </li>
          <li data-hot={s.openChangeRequests > 0}>
            <Link href={`${base}/orders?f=changes`}>طلبات تعديل من العملاء</Link>
            <strong>{s.openChangeRequests}</strong>
          </li>
          <li>
            <Link href={`${base}/orders?f=unpaid`}>دعوات معمولة ومادفعتش لسه</Link>
            <strong>{s.unpaidDrafts}</strong>
          </li>
        </ul>
      </section>

      <section className={m.panel}>
        <h2>الفلوس آخر 6 شهور</h2>
        <ul className={a.bars}>
          {s.months.map((x) => (
            <li key={x.month}>
              <span>{monthLabel(x.month)}</span>
              <div className={a.barTrack}>
                <div className={a.bar} style={{ width: `${(x.revenue / maxRevenue) * 100}%` }} />
              </div>
              <strong>{formatEgp(x.revenue)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={m.panel}>
        <h2>الشهر ده حسب الباقة</h2>
        <ul className={m.simpleList}>
          {PACKAGES.map((p) => (
            <li key={p.id}>
              <span>
                {p.id}. {p.name}
              </span>
              <strong>{formatEgp(s.byPackage[p.id])}</strong>
            </li>
          ))}
        </ul>
        {s.refundedThisMonth > 0 && <p className={m.hint}>{s.refundedThisMonth} طلب اترجع الشهر ده (مش محسوب).</p>}
      </section>
    </main>
  );
}
