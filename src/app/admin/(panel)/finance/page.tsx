import m from "@/components/manage/manage.module.css";
import a from "@/components/admin/admin.module.css";
import FinanceGate, { FinanceTools } from "@/components/admin/FinanceGate";
import { adminOverview } from "@/lib/admin-stats";
import { currentAdmin, financeUnlocked } from "@/lib/auth";
import { formatEgp } from "@/lib/pricing";
import { getFinancePasswordHash, getPricing } from "@/lib/store";

export const dynamic = "force-dynamic";

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const monthLabel = (key: string) => `${MONTHS_AR[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

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

  const [s, pricing] = await Promise.all([adminOverview(), getPricing()]);
  const maxRevenue = Math.max(1, ...s.months.map((x) => x.revenue));

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>الحسابات</h1>
        <FinanceTools />
      </header>

      <section className={a.kpis}>
        <div className={a.kpi}>
          <span>فلوس الشهر ده</span>
          <strong>{formatEgp(s.revenueThisMonth)}</strong>
          <small>{s.paidOrdersThisMonth} طلب مدفوع</small>
        </div>
        <div className={a.kpi}>
          <span>الإجمالي من الأول</span>
          <strong>{formatEgp(s.revenueAllTime)}</strong>
          <small>من غير المرتجع</small>
        </div>
        <div className={a.kpi}>
          <span>مرتجع الشهر ده</span>
          <strong>{s.refundedThisMonth}</strong>
          <small>طلب (مش محسوب في الفلوس)</small>
        </div>
      </section>

      <div className={a.twoPanels}>
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
            {pricing.packages.map((p) => (
              <li key={p.id}>
                <span>
                  {p.id}. {p.name}
                </span>
                <strong>{formatEgp(s.byPackage[p.id])}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
