"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { formatEgp, getPackage, type Pricing } from "@/lib/pricing";
import { CATEGORY_LABELS, type ChangeRequest, type CustomStage, type Order } from "@/lib/types";
import { UploadError, postJson } from "@/lib/upload-client";

export interface OrderRow {
  order: Order;
  event?: { couple: string; date: string; slug: string; manageToken: string };
  changes: ChangeRequest[];
}

type Filter = "all" | "pending" | "unpaid" | "paid" | "custom" | "changes" | "cancelled";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "مستني تأكيد" },
  { id: "unpaid", label: "مش مدفوع" },
  { id: "paid", label: "مدفوع" },
  { id: "custom", label: "باقات 3 و4" },
  { id: "changes", label: "طلبات تعديل" },
  { id: "cancelled", label: "ملغي / مرتجع" },
];

const STAGES: { id: CustomStage; label: string }[] = [
  { id: "new", label: "جديد" },
  { id: "contacted", label: "اتكلمنا معاه" },
  { id: "in_design", label: "بنصمم" },
  { id: "delivered", label: "اتسلم" },
];

const dateFmt = (iso: string) =>
  new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

function matches(row: OrderRow, f: Filter): boolean {
  const o = row.order;
  if (f === "cancelled") return Boolean(o.cancelledAt);
  if (o.cancelledAt) return f === "all";
  switch (f) {
    case "pending":
      return o.payment === "pending_review";
    case "unpaid":
      return o.payment === "unpaid";
    case "paid":
      return o.payment === "paid";
    case "custom":
      return o.kind === "custom";
    case "changes":
      return row.changes.some((c) => !c.resolvedAt);
    default:
      return true;
  }
}

export default function AdminOrders({
  adminKey,
  rows,
  initialFilter,
  pricing,
}: {
  adminKey: string;
  rows: OrderRow[];
  initialFilter?: string;
  pricing: Pricing;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>(FILTERS.some((f) => f.id === initialFilter) ? (initialFilter as Filter) : "all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const shown = useMemo(() => {
    const q = query.trim();
    return rows.filter(
      (r) =>
        matches(r, filter) &&
        (!q || r.order.clientName.includes(q) || r.order.clientPhone.includes(q) || (r.event?.couple ?? "").includes(q)),
    );
  }, [rows, filter, query]);

  async function act(order: Order, body: Record<string, unknown>, done: string) {
    setBusyId(order.id);
    try {
      await postJson(`/api/admin/${adminKey}/orders`, { id: order.id, ...body }, "PATCH");
      setToast(done);
      router.refresh();
    } catch (err) {
      setToast(`ماتنفذش (${err instanceof UploadError ? err.code : "error"})`);
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  }

  async function resolveChange(id: string) {
    try {
      await postJson(`/api/admin/${adminKey}/changes`, { id }, "PATCH");
      router.refresh();
    } catch {
      setToast("ماتنفذش");
    }
  }

  function reject(order: Order) {
    const reason = prompt("ليه التحويل ماتأكدش؟ (العميل هيشوف السبب)", "المبلغ ماوصلش");
    if (reason?.trim()) void act(order, { action: "reject_instapay", reason }, "اترفض والعميل هيشوف السبب");
  }

  function cancel(order: Order) {
    const reason = prompt("سبب الإلغاء؟ (لينا بس، العميل مش هيشوفه)");
    if (!reason?.trim()) return;
    const refunded = order.payment === "paid" ? confirm("الفلوس اترجعت للعميل؟ (OK = مرتجع، Cancel = إلغاء من غير رد فلوس)") : false;
    if (!confirm("كل لينكات الدعوة وصفحة العميل هتتقفل. متأكد؟")) return;
    void act(order, { action: "cancel", reason, refunded }, refunded ? "اتلغى كمرتجع واللينكات اتقفلت" : "اتلغى واللينكات اتقفلت");
  }

  const countOf = (f: Filter) => rows.filter((r) => matches(r, f)).length;

  return (
    <main className={m.page} dir="rtl" lang="ar">
      <header className={m.header}>
        <div className={m.kicker}>داشبورد الإدارة</div>
        <h1>الطلبات</h1>
      </header>

      <div className={a.tabs}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={m.chip} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} ({countOf(f.id)})
          </button>
        ))}
      </div>
      <input className={m.input} type="search" placeholder="دور بالاسم أو الرقم" value={query} onChange={(e) => setQuery(e.target.value)} />

      {shown.length === 0 ? (
        <p className={m.empty}>مافيش طلبات هنا.</p>
      ) : (
        <ul className={a.orders}>
          {shown.map(({ order: o, event: e, changes }) => {
            const pkg = getPackage(pricing, o.packageId)!;
            const busy = busyId === o.id;
            const wa = `https://wa.me/${o.clientPhone.replace(/\D/g, "")}`;
            return (
              <li key={o.id} className={a.order} data-cancelled={Boolean(o.cancelledAt)}>
                <div className={a.orderHead}>
                  <div>
                    <strong>{e?.couple ?? o.clientName}</strong>
                    <div className={m.hint}>
                      {o.clientName} ·{" "}
                      <a href={wa} target="_blank" rel="noopener noreferrer" dir="ltr">
                        {o.clientPhone}
                      </a>
                    </div>
                  </div>
                  <div className={a.orderPrice}>
                    <strong>{formatEgp(o.total)}</strong>
                    <span className={m.hint}>
                      باقة {o.packageId} · {pkg.name}
                    </span>
                  </div>
                </div>

                <div className={a.badges}>
                  {o.cancelledAt ? (
                    <span className={`${m.badge} ${m.badgeBad}`}>{o.refunded ? "مرتجع" : "ملغي"}</span>
                  ) : o.payment === "paid" ? (
                    <span className={`${m.badge} ${m.badgeOk}`}>مدفوع{o.paymentMethod ? ` · ${o.paymentMethod}` : ""}</span>
                  ) : o.payment === "pending_review" ? (
                    <span className={`${m.badge} ${m.badgeInfo}`}>إنستاباي مستني تأكيد</span>
                  ) : (
                    <span className={`${m.badge} ${m.badgeMuted}`}>مش مدفوع</span>
                  )}
                  {o.kind === "custom" && (
                    <span className={`${m.badge} ${m.badgeInfo}`}>{STAGES.find((s) => s.id === o.stage)?.label ?? "جديد"}</span>
                  )}
                  <span className={m.hint}>اتعمل {dateFmt(o.createdAt)}</span>
                  {e && <span className={m.hint}>· المناسبة {dateFmt(e.date)}</span>}
                </div>

                {o.brief && (
                  <div className={a.brief}>
                    <strong>{CATEGORY_LABELS[o.brief.category]}</strong>
                    {o.brief.date && <span> · {o.brief.date}</span>}
                    {o.brief.notes && <p>{o.brief.notes}</p>}
                  </div>
                )}

                {o.cancelledAt && (
                  <p className={m.hint}>
                    اتلغى {dateFmt(o.cancelledAt)}: {o.cancelReason}
                  </p>
                )}
                {o.rejectReason && o.payment === "unpaid" && <p className={m.hint}>آخر تحويل اترفض: {o.rejectReason}</p>}

                {o.proofUrl && (
                  <a className={m.linkBtn} href={o.proofUrl} target="_blank" rel="noopener noreferrer">
                    صورة التحويل ↗
                  </a>
                )}

                {changes.length > 0 && (
                  <ul className={m.simpleList}>
                    {changes.map((c) => (
                      <li key={c.id}>
                        <span>{c.body}</span>
                        {c.resolvedAt ? (
                          <span className={`${m.badge} ${m.badgeOk}`}>اتعمل</span>
                        ) : (
                          <button type="button" className={m.secondary} onClick={() => resolveChange(c.id)}>
                            خلص
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className={m.inlineActions}>
                  {e && (
                    <>
                      <a className={m.secondary} href={`/c/${e.manageToken}`} target="_blank" rel="noopener noreferrer">
                        صفحة العميل ↗
                      </a>
                      <a className={m.secondary} href={`/i/${e.slug}`} target="_blank" rel="noopener noreferrer">
                        الدعوة ↗
                      </a>
                    </>
                  )}
                  {!o.cancelledAt && o.payment === "pending_review" && (
                    <>
                      <button type="button" className={m.primary} disabled={busy} onClick={() => act(o, { action: "confirm_instapay" }, "اتأكد والدعوة اشتغلت")}>
                        التحويل وصل
                      </button>
                      <button type="button" className={m.secondary} disabled={busy} onClick={() => reject(o)}>
                        ماوصلش
                      </button>
                    </>
                  )}
                  {!o.cancelledAt && o.payment === "unpaid" && (
                    <button
                      type="button"
                      className={m.secondary}
                      disabled={busy}
                      onClick={() => confirm("تعلّم الطلب مدفوع (كاش أو تحويل تاني)؟") && act(o, { action: "mark_paid" }, "اتعلم مدفوع")}
                    >
                      اتدفع بطريقة تانية
                    </button>
                  )}
                  {!o.cancelledAt && o.kind === "custom" && !e && (
                    <button
                      type="button"
                      className={m.primary}
                      disabled={busy}
                      onClick={() =>
                        confirm("تعمل صفحة الدعوة للعميل ده؟ هتاخد لينك تبعتهوله يكمل فيه البيانات ويضيف المعازيم.") &&
                        act(o, { action: "create_event" }, "اتعملت صفحة الدعوة. افتح صفحة العميل وابعتله اللينك")
                      }
                    >
                      اعمل صفحة الدعوة
                    </button>
                  )}
                  {!o.cancelledAt && o.kind === "custom" && o.payment !== "paid" && (
                    <button
                      type="button"
                      className={m.secondary}
                      disabled={busy}
                      onClick={() => {
                        const v = prompt("السعر المتفق عليه (جنيه)", String(o.total));
                        if (v !== null && v.trim()) void act(o, { action: "set_total", total: Number(v) }, "السعر اتعدل");
                      }}
                    >
                      تعديل السعر
                    </button>
                  )}
                  {!o.cancelledAt && o.kind === "custom" && (
                    <select
                      className={m.input}
                      style={{ width: "auto" }}
                      value={o.stage ?? "new"}
                      disabled={busy}
                      onChange={(ev) => act(o, { action: "stage", stage: ev.target.value }, "اتحدث")}
                      aria-label="مرحلة الطلب"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {o.cancelledAt ? (
                    <button
                      type="button"
                      className={m.secondary}
                      disabled={busy}
                      onClick={() => confirm("ترجّع الطلب واللينكات تشتغل تاني؟") && act(o, { action: "restore" }, "رجع")}
                    >
                      إلغاء الإلغاء
                    </button>
                  ) : (
                    <button type="button" className={`${m.linkBtn} ${a.danger}`} disabled={busy} onClick={() => cancel(o)}>
                      إلغاء الطلب / مرتجع
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div className={m.toast} role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
