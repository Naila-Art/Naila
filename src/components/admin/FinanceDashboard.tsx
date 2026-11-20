"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import f from "./finance.module.css";
import Icon from "../Icon";
import Pager, { usePaged } from "./Pager";
import DateTimePicker from "../DateTimePicker";
import { toCsv } from "@/lib/guests";

export interface FinanceRow {
  id: string;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
  refunded: boolean;
  payment: "unpaid" | "pending_review" | "paid";
  packageId: number;
  total: number;
  method: string;
  methodName: string;
  client: string;
  couple: string;
}

type Range = "today" | "7d" | "30d" | "month" | "lastMonth" | "year" | "all" | "custom";
type Status = "all" | "paid" | "pending" | "unpaid" | "cancelled";

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "النهارده" },
  { id: "7d", label: "آخر 7 أيام" },
  { id: "30d", label: "آخر 30 يوم" },
  { id: "month", label: "الشهر ده" },
  { id: "lastMonth", label: "الشهر اللي فات" },
  { id: "year", label: "السنة دي" },
  { id: "all", label: "كل الوقت" },
  { id: "custom", label: "من لـ" },
];

const STATUSES: { id: Status; label: string }[] = [
  { id: "all", label: "كل الحالات" },
  { id: "paid", label: "مدفوع" },
  { id: "pending", label: "مستني تأكيد" },
  { id: "unpaid", label: "مش مدفوع" },
  { id: "cancelled", label: "ملغي / مرتجع" },
];

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const egp = (n: number) => `${Math.round(n).toLocaleString("en-US")} ج.م`;
const DAY = 864e5;

function statusOf(r: FinanceRow): Exclude<Status, "all"> {
  if (r.cancelledAt) return "cancelled";
  if (r.payment === "paid") return "paid";
  return r.payment === "pending_review" ? "pending" : "unpaid";
}

/** The date an order counts on: when it was paid, otherwise when it was made. */
const dateOf = (r: FinanceRow) => new Date(r.paidAt ?? r.createdAt);
/** Money we kept. */
const kept = (r: FinanceRow) => r.payment === "paid" && !r.refunded;

function rangeBounds(range: Range, from: string, to: string): [Date, Date] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today.getTime() + DAY);
  switch (range) {
    case "today":
      return [today, end];
    case "7d":
      return [new Date(end.getTime() - 7 * DAY), end];
    case "30d":
      return [new Date(end.getTime() - 30 * DAY), end];
    case "month":
      return [new Date(now.getFullYear(), now.getMonth(), 1), end];
    case "lastMonth":
      return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)];
    case "year":
      return [new Date(now.getFullYear(), 0, 1), end];
    case "custom": {
      const s = from ? new Date(`${from}T00:00`) : new Date(2020, 0, 1);
      const e = to ? new Date(new Date(`${to}T00:00`).getTime() + DAY) : end;
      return [s, e];
    }
    default:
      return [new Date(2020, 0, 1), end];
  }
}

interface Bucket {
  key: string;
  label: string;
  start: number;
  end: number;
  revenue: number;
  orders: number;
}

/** Days for spans up to ~2 months, months beyond. */
function buckets(start: Date, end: Date, rows: FinanceRow[], trimToData: boolean): Bucket[] {
  // "All time" starts at the first order; a chosen range always shows its whole span.
  const firstData = rows.length ? Math.min(...rows.map((r) => dateOf(r).getTime())) : start.getTime();
  const s = trimToData ? new Date(Math.max(start.getTime(), new Date(firstData).setHours(0, 0, 0, 0))) : start;
  const spanDays = (end.getTime() - s.getTime()) / DAY;
  const out: Bucket[] = [];
  if (spanDays <= 62) {
    for (let t = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime(); t < end.getTime(); t += DAY) {
      const d = new Date(t);
      out.push({ key: d.toISOString(), label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, start: t, end: t + DAY, revenue: 0, orders: 0 });
    }
  } else {
    let d = new Date(s.getFullYear(), s.getMonth(), 1);
    while (d.getTime() < end.getTime()) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      out.push({ key: d.toISOString(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, start: d.getTime(), end: next.getTime(), revenue: 0, orders: 0 });
      d = next;
    }
  }
  for (const r of rows) {
    if (kept(r) && r.paidAt) {
      const t = new Date(r.paidAt).getTime();
      const b = out.find((x) => t >= x.start && t < x.end);
      if (b) b.revenue += r.total;
    }
    const c = new Date(r.createdAt).getTime();
    const b = out.find((x) => c >= x.start && c < x.end);
    if (b) b.orders += 1;
  }
  return out;
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(260, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Rounded "nice" axis max and 4 ticks. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * pow).find((k) => k >= raw) ?? raw;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

const short = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : String(n));

/** Revenue over time: one series, area + 2px line, crosshair tooltip. */
function RevenueChart({ data }: { data: Bucket[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 240;
  const pad = { t: 16, r: 8, b: 28, l: 48 };
  const ticks = niceTicks(Math.max(...data.map((d) => d.revenue), 0));
  const max = ticks[4] || 1;
  const innerW = width - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.revenue)}`).join("");
  const area = data.length ? `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : "";
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 80)));

  return (
    <div ref={ref} className={f.chart} onMouseLeave={() => setHover(null)}>
      <svg width={width} height={H} role="img" aria-label="الإيراد على مدار الفترة" style={{ direction: "ltr" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className={f.grid} />
            <text x={pad.l - 8} y={y(t)} className={f.axis} textAnchor="end" dominantBaseline="middle">
              {short(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.key} x={x(i)} y={H - 8} className={f.axis} textAnchor="middle">
              {d.label}
            </text>
          ) : null,
        )}
        <path d={area} className={f.area} />
        <path d={line} className={f.line} />
        {/* Point markers, so a single day (or a sparse range) is still visible. */}
        {data.length <= 62 &&
          data.map((d, i) => (d.revenue > 0 ? <circle key={`p${d.key}`} cx={x(i)} cy={y(d.revenue)} r={4} className={f.dot} /> : null))}
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} className={f.crosshair} />
            <circle cx={x(hover)} cy={y(data[hover].revenue)} r={5} className={f.dot} />
          </>
        )}
        {/* Hit areas: wider than the marks. */}
        {data.map((d, i) => (
          <rect
            key={d.key}
            x={x(i) - innerW / Math.max(1, data.length - 1) / 2}
            y={pad.t}
            width={Math.max(8, innerW / Math.max(1, data.length - 1))}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {hover !== null && (
        <div className={f.tooltip} style={{ left: Math.min(Math.max(x(hover), 80), width - 80) }}>
          <strong>{egp(data[hover].revenue)}</strong>
          <span>{data[hover].label}</span>
        </div>
      )}
    </div>
  );
}

/** Orders made per bucket: thin bars, rounded tops, 2px gaps, per-bar tooltip. */
function OrdersChart({ data }: { data: Bucket[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 200;
  const pad = { t: 12, r: 8, b: 28, l: 36 };
  const ticks = niceTicks(Math.max(...data.map((d) => d.orders), 0));
  const max = ticks[4] || 1;
  const innerW = width - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 80)));

  return (
    <div ref={ref} className={f.chart} onMouseLeave={() => setHover(null)}>
      <svg width={width} height={H} role="img" aria-label="عدد الطلبات على مدار الفترة" style={{ direction: "ltr" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className={f.grid} />
            <text x={pad.l - 6} y={y(t)} className={f.axis} textAnchor="end" dominantBaseline="middle">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const h = y(0) - y(d.orders);
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={innerH} fill="transparent" />
              {d.orders > 0 && (
                <path
                  d={`M${cx - barW / 2},${y(0)}V${y(d.orders) + r}Q${cx - barW / 2},${y(d.orders)} ${cx - barW / 2 + r},${y(d.orders)}H${cx + barW / 2 - r}Q${cx + barW / 2},${y(d.orders)} ${cx + barW / 2},${y(d.orders) + r}V${y(0)}Z`}
                  className={hover === i ? f.barActive : f.bar}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 8} className={f.axis} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className={f.tooltip} style={{ left: Math.min(Math.max(pad.l + slot * hover + slot / 2, 70), width - 70) }}>
          <strong>{data[hover].orders} طلب</strong>
          <span>{data[hover].label}</span>
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with the value written at the end (magnitude, one hue). */
function BarList({ items }: { items: { label: string; value: number; sub: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.every((i) => i.value === 0)) return <p className={f.empty}>مافيش فلوس في الفترة دي.</p>;
  return (
    <ul className={f.barList}>
      {items.map((i) => (
        <li key={i.label}>
          <div className={f.barListHead}>
            <span>{i.label}</span>
            <strong>{egp(i.value)}</strong>
          </div>
          <div className={f.track}>
            <div className={f.fill} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <small>{i.sub}</small>
        </li>
      ))}
    </ul>
  );
}

const dateFmt = (iso: string) =>
  new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** The finance dashboard: filters in one row, KPIs, revenue and orders over time, breakdowns, transactions. */
export default function FinanceDashboard({
  rows,
  packages,
  methods,
}: {
  rows: FinanceRow[];
  packages: { id: number; name: string }[];
  methods: { id: string; name: string }[];
}) {
  const [range, setRange] = useState<Range>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [pkg, setPkg] = useState(0);
  const [method, setMethod] = useState("all");

  const [start, end] = rangeBounds(range, from, to);
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const d = dateOf(r);
        if (d < start || d >= end) return false;
        if (status !== "all" && statusOf(r) !== status) return false;
        if (pkg && r.packageId !== pkg) return false;
        if (method !== "all" && r.method !== method) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start/end derive from range/from/to
    [rows, range, from, to, status, pkg, method],
  );

  const newestFirst = useMemo(() => [...filtered].sort((x, y) => dateOf(y).getTime() - dateOf(x).getTime()), [filtered]);
  const paged = usePaged(newestFirst);
  const paid = filtered.filter(kept);
  const revenue = paid.reduce((s, r) => s + r.total, 0);
  const pending = filtered.filter((r) => statusOf(r) === "pending");
  const refunds = filtered.filter((r) => r.refunded);
  const created = filtered.length;
  const conversion = created ? Math.round((filtered.filter((r) => r.payment === "paid").length / created) * 100) : 0;
  const trim = range === "all" || (range === "custom" && !from);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- start/end derive from range/from/to
  const series = useMemo(() => buckets(start, end, filtered, trim), [filtered, range, from, to]);

  const byPackage = packages.map((p) => {
    const list = paid.filter((r) => r.packageId === p.id);
    return { label: p.name, value: list.reduce((s, r) => s + r.total, 0), sub: `${list.length} طلب` };
  });
  const byMethod = methods
    .map((pm) => {
      const list = paid.filter((r) => r.method === pm.id);
      return { label: pm.name, value: list.reduce((s, r) => s + r.total, 0), sub: `${list.length} طلب` };
    })
    .filter((i) => i.value > 0)
    .sort((x, y) => y.value - x.value);

  function exportCsv() {
    const csv = toCsv([
      ["التاريخ", "العميل", "الدعوة", "الباقة", "المبلغ", "الحالة", "طريقة الدفع"],
      ...filtered.map((r) => [
        dateFmt(r.paidAt ?? r.createdAt),
        r.client,
        r.couple,
        packages.find((p) => p.id === r.packageId)?.name ?? String(r.packageId),
        String(r.total),
        STATUSES.find((s) => s.id === statusOf(r))!.label + (r.refunded ? " (مرتجع)" : ""),
        r.methodName,
      ]),
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `الحسابات-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={f.root}>
      <div className={f.filters}>
        <div className={f.ranges} role="radiogroup" aria-label="الفترة">
          {RANGES.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={range === r.id} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className={f.selects}>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="الحالة">
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={pkg} onChange={(e) => setPkg(Number(e.target.value))} aria-label="الباقة">
            <option value={0}>كل الباقات</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="طريقة الدفع">
            <option value="all">كل طرق الدفع</option>
            {methods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
          <button type="button" className={f.export} onClick={exportCsv}>
            <Icon name="download" /> تصدير Excel
          </button>
        </div>
        {range === "custom" && (
          <div className={f.custom}>
            <div>
              <span>من</span>
              <DateTimePicker dateOnly value={from} onChange={setFrom} label="من تاريخ" />
            </div>
            <div>
              <span>لـ</span>
              <DateTimePicker dateOnly value={to} onChange={setTo} label="لتاريخ" />
            </div>
          </div>
        )}
      </div>

      <section className={f.kpis}>
        <div className={f.kpi} data-hero>
          <span>الإيراد</span>
          <strong>{egp(revenue)}</strong>
          <small>{paid.length} طلب مدفوع</small>
        </div>
        <div className={f.kpi}>
          <span>متوسط الطلب</span>
          <strong>{egp(paid.length ? revenue / paid.length : 0)}</strong>
        </div>
        <div className={f.kpi}>
          <span>نسبة الدفع</span>
          <strong>{conversion}%</strong>
          <small>من {created} طلب اتعمل</small>
        </div>
        <div className={f.kpi}>
          <span>مستني تأكيد</span>
          <strong>{egp(pending.reduce((s, r) => s + r.total, 0))}</strong>
          <small>{pending.length} طلب</small>
        </div>
        <div className={f.kpi}>
          <span>المرتجع</span>
          <strong>{egp(refunds.reduce((s, r) => s + r.total, 0))}</strong>
          <small>{refunds.length} طلب (مش محسوب)</small>
        </div>
      </section>

      <div className={f.grid2}>
        <section className={f.panel}>
          <h2>الإيراد</h2>
          <RevenueChart data={series} />
        </section>
        <section className={f.panel}>
          <h2>الطلبات اللي اتعملت</h2>
          <OrdersChart data={series} />
        </section>
      </div>

      <div className={f.grid2}>
        <section className={f.panel}>
          <h2>الإيراد حسب الباقة</h2>
          <BarList items={byPackage} />
        </section>
        <section className={f.panel}>
          <h2>الإيراد حسب طريقة الدفع</h2>
          {byMethod.length ? <BarList items={byMethod} /> : <p className={f.empty}>مافيش فلوس في الفترة دي.</p>}
        </section>
      </div>

      <section className={f.panel}>
        <h2>المعاملات ({filtered.length})</h2>
        {filtered.length === 0 ? (
          <p className={f.empty}>مافيش معاملات بالفلاتر دي.</p>
        ) : (
          <>
            <div className={f.tableWrap}>
              <table className={f.table}>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>العميل</th>
                    <th>الباقة</th>
                    <th>الحالة</th>
                    <th>طريقة الدفع</th>
                    <th className={f.num}>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((r) => (
                      <tr key={r.id}>
                        <td>{dateFmt(r.paidAt ?? r.createdAt)}</td>
                        <td>
                          {r.couple || r.client}
                          {r.couple && <small> · {r.client}</small>}
                        </td>
                        <td>{packages.find((p) => p.id === r.packageId)?.name}</td>
                        <td>
                          <span className={f.status} data-s={statusOf(r)}>
                            {STATUSES.find((s) => s.id === statusOf(r))!.label}
                            {r.refunded ? " · مرتجع" : ""}
                          </span>
                        </td>
                        <td>{r.methodName || "—"}</td>
                        <td className={f.num}>{egp(r.total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <Pager {...paged} label="المعاملات" />
          </>
        )}
      </section>
    </div>
  );
}
