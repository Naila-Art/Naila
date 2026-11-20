"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import o from "./orders.module.css";
import Icon from "../Icon";
import DateTimePicker from "../DateTimePicker";
import { PayStatus } from "../manage/OrderPanels";
import { formatEgp, getPackage, type Pricing } from "@/lib/pricing";
import { CATEGORY_LABELS, type ChangeRequest, type CustomStage, type Lang, type Order } from "@/lib/types";
import { UploadError, postJson } from "@/lib/upload-client";

export interface OrderRow {
  order: Order;
  event?: {
    couple: string;
    date: string;
    slug: string;
    manageToken: string;
    details: {
      partnerA: string;
      partnerB: string;
      date: string;
      venueName: string;
      venueAddress: string;
      mapsUrl: string;
      lang: Lang;
      generalText: string;
    };
  };
  changes: ChangeRequest[];
}

interface Props {
  rows: OrderRow[];
  initialFilter?: string;
  pricing: Pricing;
  /** Absolute site address for links we send on WhatsApp. */
  origin: string;
  methods: { id: string; name: string; active: boolean }[];
}

type Status = "all" | "pending" | "unpaid" | "paid" | "cancelled";
type Range = "all" | "today" | "7d" | "month" | "lastMonth" | "year";

const STATUS_TABS: { id: Status; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "مستني تأكيد" },
  { id: "unpaid", label: "مش مدفوع" },
  { id: "paid", label: "مدفوع" },
  { id: "cancelled", label: "ملغي / مرتجع" },
];

const STAGES: { id: CustomStage; label: string }[] = [
  { id: "new", label: "جديد" },
  { id: "contacted", label: "اتكلمنا معاه" },
  { id: "in_design", label: "بنصمم" },
  { id: "delivered", label: "اتسلم" },
];

const RANGES: { id: Range; label: string }[] = [
  { id: "all", label: "كل الوقت" },
  { id: "today", label: "النهارده" },
  { id: "7d", label: "آخر 7 أيام" },
  { id: "month", label: "الشهر ده" },
  { id: "lastMonth", label: "الشهر اللي فات" },
  { id: "year", label: "السنة دي" },
];

const ERRORS: Record<string, string> = {
  method_required: "اختار طريقة الدفع الأول.",
  reason_required: "اكتب السبب.",
  names_required: "اكتب الاسمين.",
  date_invalid: "اختار التاريخ والساعة.",
  venue_required: "اكتب المكان.",
  maps_invalid: "لينك الخريطة لازم يكون من جوجل ماب أو آبل ماب.",
  text_invalid: "اكتب الجملة اللي في أول الدعوة.",
  not_pending: "الطلب مش مستني تأكيد.",
  already_paid: "الطلب مدفوع خلاص.",
};

const dateFmt = (iso: string) =>
  new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

function statusOf(order: Order): Exclude<Status, "all"> {
  if (order.cancelledAt) return "cancelled";
  if (order.payment === "pending_review") return "pending";
  return order.payment === "paid" ? "paid" : "unpaid";
}

function inRange(iso: string, range: Range): boolean {
  if (range === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case "today":
      return d >= startOfDay;
    case "7d":
      return d.getTime() >= now.getTime() - 7 * 864e5;
    case "month":
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    case "lastMonth":
      return d >= new Date(now.getFullYear(), now.getMonth() - 1, 1) && d < new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return d >= new Date(now.getFullYear(), 0, 1);
  }
}

const waLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/** Orders: one organised table (cards on mobile), filters in one row, and a detail panel with every action. */
export default function AdminOrders({ rows, initialFilter, pricing, origin, methods }: Props) {
  const router = useRouter();
  const startStatus = (STATUS_TABS.some((t) => t.id === initialFilter) ? initialFilter : "all") as Status;
  const [status, setStatus] = useState<Status>(startStatus);
  const [onlyPackages34, setOnlyPackages34] = useState(initialFilter === "custom");
  const [onlyChanges, setOnlyChanges] = useState(initialFilter === "changes");
  const [stage, setStage] = useState<CustomStage | "all">("all");
  const [pkg, setPkg] = useState<number | 0>(0);
  const [method, setMethod] = useState("all");
  const [range, setRange] = useState<Range>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "amount" | "event">("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const base = useMemo(
    () =>
      rows.filter((r) => {
        const ord = r.order;
        if (onlyPackages34 && ord.packageId < 3) return false;
        if (onlyChanges && !r.changes.some((c) => !c.resolvedAt)) return false;
        if (stage !== "all" && (ord.packageId < 3 || (ord.stage ?? "new") !== stage)) return false;
        if (pkg && ord.packageId !== pkg) return false;
        if (method !== "all" && ord.paymentMethod !== method) return false;
        if (!inRange(ord.createdAt, range)) return false;
        const q = query.trim();
        if (q && !(ord.clientName.includes(q) || ord.clientPhone.includes(q) || (r.event?.couple ?? "").includes(q))) return false;
        return true;
      }),
    [rows, onlyPackages34, onlyChanges, stage, pkg, method, range, query],
  );
  const counts = useMemo(() => {
    const c: Record<Status, number> = { all: base.length, pending: 0, unpaid: 0, paid: 0, cancelled: 0 };
    for (const r of base) c[statusOf(r.order)]++;
    return c;
  }, [base]);
  const shown = useMemo(() => {
    const list = base.filter((r) => status === "all" || statusOf(r.order) === status);
    const sorted = [...list];
    if (sort === "amount") sorted.sort((x, y) => y.order.total - x.order.total);
    else if (sort === "event") sorted.sort((x, y) => (x.event?.date ?? "9").localeCompare(y.event?.date ?? "9"));
    return sorted;
  }, [base, status, sort]);

  const selected = rows.find((r) => r.order.id === selectedId) ?? null;
  const filtersOn = onlyPackages34 || onlyChanges || stage !== "all" || pkg !== 0 || method !== "all" || range !== "all" || query.trim() !== "";

  function clearFilters() {
    setOnlyPackages34(false);
    setOnlyChanges(false);
    setStage("all");
    setPkg(0);
    setMethod("all");
    setRange("all");
    setQuery("");
  }

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>الطلبات</h1>
      </header>

      <div className={o.statusTabs} role="tablist" aria-label="حالة الدفع">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={status === t.id}
            className={o.statusTab}
            data-tone={t.id}
            onClick={() => setStatus(t.id)}
          >
            {t.label}
            <span className={o.count}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className={o.filters}>
        <label className={o.search}>
          <Icon name="search" />
          <input placeholder="دور بالاسم أو الرقم" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="الفترة">
          {RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <select value={pkg} onChange={(e) => setPkg(Number(e.target.value))} aria-label="الباقة">
          <option value={0}>كل الباقات</option>
          {pricing.packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id}. {p.name}
            </option>
          ))}
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value as CustomStage | "all")} aria-label="المرحلة">
          <option value="all">كل المراحل</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
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
          <option value="paymob">فيزا (باي موب)</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="الترتيب">
          <option value="new">الأحدث</option>
          <option value="amount">الأعلى مبلغ</option>
          <option value="event">أقرب مناسبة</option>
        </select>
        <label className={o.toggle}>
          <input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} />
          طلبات تعديل
        </label>
        {filtersOn && (
          <button type="button" className={m.linkBtn} onClick={clearFilters}>
            مسح الفلاتر
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className={m.empty}>مافيش طلبات بالفلاتر دي.</p>
      ) : (
        <div className={o.tableWrap}>
          <table className={o.table}>
            <thead>
              <tr>
                <th>الحالة</th>
                <th>العميل</th>
                <th>الباقة</th>
                <th>المبلغ</th>
                <th>المرحلة</th>
                <th>اتعمل</th>
                <th>المناسبة</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const ord = r.order;
                const open = r.changes.some((c) => !c.resolvedAt);
                return (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedId(ord.id)}
                    aria-selected={selectedId === ord.id}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedId(ord.id)}
                  >
                    <td data-label="الحالة">
                      <PayStatus payment={ord.payment} cancelled={Boolean(ord.cancelledAt)} />
                    </td>
                    <td data-label="العميل">
                      <strong>{r.event?.couple ?? ord.clientName}</strong>
                      <small>
                        {ord.clientName} · <bdi dir="ltr">{ord.clientPhone}</bdi>
                        {open && <span className={o.flag}>طلب تعديل</span>}
                      </small>
                    </td>
                    <td data-label="الباقة">{getPackage(pricing, ord.packageId)?.name ?? ord.packageId}</td>
                    <td data-label="المبلغ" className={o.amount}>
                      {formatEgp(ord.total)}
                    </td>
                    <td data-label="المرحلة">{ord.packageId >= 3 ? STAGES.find((s) => s.id === (ord.stage ?? "new"))?.label : "—"}</td>
                    <td data-label="اتعمل">{dateFmt(ord.createdAt)}</td>
                    <td data-label="المناسبة">{r.event ? dateFmt(r.event.date) : (ord.brief?.date ?? "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <OrderDetail
          row={selected}
          pricing={pricing}
          origin={origin}
          methods={methods}
          onClose={() => setSelectedId(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </main>
  );
}

/** Everything about one order, with all actions. Slides in from the side (full screen on mobile). */
function OrderDetail({
  row,
  pricing,
  origin,
  methods,
  onClose,
  onChanged,
}: {
  row: OrderRow;
  pricing: Pricing;
  origin: string;
  methods: Props["methods"];
  onClose: () => void;
  onChanged: () => void;
}) {
  const { order: ord, event: e, changes } = row;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [methodId, setMethodId] = useState("");
  const [note, setNote] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const pkg = getPackage(pricing, ord.packageId);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function act(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setMsg(null);
    try {
      await postJson("/api/admin/orders", { id: ord.id, ...body }, "PATCH");
      setMsg({ ok: true, t: done });
      onChanged();
      return true;
    } catch (err) {
      setMsg({ ok: false, t: ERRORS[err instanceof UploadError ? err.code : ""] ?? "ماتنفذش. جرب تاني." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function manualConfirm(ev: FormEvent) {
    ev.preventDefault();
    if (!methodId) return setMsg({ ok: false, t: ERRORS.method_required });
    if (await act({ action: "mark_paid", methodId, note }, "اتأكد الدفع والدعوة اشتغلت")) setConfirmOpen(false);
  }

  function reject() {
    const reason = prompt("ليه التحويل ماتأكدش؟ (العميل هيشوف السبب)", "المبلغ ماوصلش");
    if (reason?.trim()) void act({ action: "reject_instapay", reason }, "اترفض والعميل هيشوف السبب");
  }

  function cancel() {
    const reason = prompt("سبب الإلغاء؟ (لينا بس، العميل مش هيشوفه)");
    if (!reason?.trim()) return;
    const refunded = ord.payment === "paid" ? confirm("الفلوس اترجعت للعميل؟ (OK = مرتجع، Cancel = إلغاء من غير رد فلوس)") : false;
    if (!confirm("كل لينكات الدعوة وصفحة العميل هتتقفل. متأكد؟")) return;
    void act({ action: "cancel", reason, refunded }, refunded ? "اتلغى كمرتجع واللينكات اتقفلت" : "اتلغى واللينكات اتقفلت");
  }

  async function resolveChange(id: string) {
    try {
      await postJson("/api/admin/changes", { id }, "PATCH");
      onChanged();
    } catch {
      setMsg({ ok: false, t: "ماتنفذش" });
    }
  }

  const orderLink = e ? `${origin}/order/${e.manageToken}` : "";
  const invitationLink = e ? `${origin}/i/${e.slug}` : "";
  const pageLink = e ? `${origin}/c/${e.manageToken}` : "";
  const waUnpaid = e
    ? waLink(ord.clientPhone, `أهلاً ${ord.clientName}، ده لينك طلبك: تقدر تشوف المعاينة وتدفع منه\n${orderLink}`)
    : "";
  const waPaid = e
    ? waLink(
        ord.clientPhone,
        `أهلاً ${ord.clientName}، تم تأكيد الدفع ودعوتك شغالة.\nلينك الدعوة (ابعته لأي حد):\n${invitationLink}` +
          (ord.packageId >= 2 ? `\n\nصفحتك (تتابع منها مين فتح الدعوة${ord.packageId >= 3 ? " وتضيف ضيوفك بالاسم" : ""}):\n${pageLink}` : ""),
      )
    : "";

  return (
    <div className={o.drawerBackdrop} onClick={onClose}>
      <aside className={o.drawer} role="dialog" aria-modal="true" aria-label="تفاصيل الطلب" onClick={(ev) => ev.stopPropagation()}>
        <header className={o.drawerHead}>
          <div>
            <h2>{e?.couple ?? ord.clientName}</h2>
            <PayStatus payment={ord.payment} cancelled={Boolean(ord.cancelledAt)} />
          </div>
          <button type="button" className={m.iconBtn} onClick={onClose} aria-label="اقفل">
            <Icon name="x" />
          </button>
        </header>

        <div className={o.drawerBody}>
          <dl className={o.facts}>
            <dt>العميل</dt>
            <dd>
              {ord.clientName} ·{" "}
              <a href={waLink(ord.clientPhone, "")} target="_blank" rel="noopener noreferrer" className={o.wa}>
                <Icon name="whatsapp" size={16} /> <bdi dir="ltr">{ord.clientPhone}</bdi>
              </a>
            </dd>
            <dt>الباقة</dt>
            <dd>
              {pkg?.name} · <strong>{formatEgp(ord.total)}</strong>
            </dd>
            {ord.paymentMethodName && (
              <>
                <dt>طريقة الدفع</dt>
                <dd>
                  {ord.paymentMethodName}
                  {ord.paymentNote && ` · ${ord.paymentNote}`}
                </dd>
              </>
            )}
            <dt>اتعمل</dt>
            <dd>{dateFmt(ord.createdAt)}</dd>
            {e && (
              <>
                <dt>المناسبة</dt>
                <dd>{dateFmt(e.date)}</dd>
              </>
            )}
            {ord.cancelledAt && (
              <>
                <dt>{ord.refunded ? "مرتجع" : "ملغي"}</dt>
                <dd>
                  {dateFmt(ord.cancelledAt)}: {ord.cancelReason}
                </dd>
              </>
            )}
            {ord.rejectReason && ord.payment === "unpaid" && (
              <>
                <dt>آخر تحويل اترفض</dt>
                <dd>{ord.rejectReason}</dd>
              </>
            )}
          </dl>

          {msg && <p className={msg.ok ? m.ok : m.error}>{msg.t}</p>}

          {/* ---- payment ---- */}
          {!ord.cancelledAt && ord.payment === "pending_review" && (
            <section className={o.block}>
              <h3>تحويل مستني تأكيد</h3>
              {ord.proofUrl && (
                <a href={ord.proofUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage URL */}
                  <img className={o.proof} src={ord.proofUrl} alt="صورة التحويل" />
                </a>
              )}
              <div className={m.inlineActions}>
                <button type="button" className={m.primary} disabled={busy} onClick={() => act({ action: "confirm_instapay" }, "اتأكد والدعوة اشتغلت")}>
                  <Icon name="check" /> التحويل وصل
                </button>
                <button type="button" className={m.secondary} disabled={busy} onClick={reject}>
                  <Icon name="x" /> ماوصلش
                </button>
              </div>
            </section>
          )}

          {!ord.cancelledAt && ord.payment === "unpaid" && (
            <section className={o.block}>
              <h3>تأكيد دفع يدوي</h3>
              {!confirmOpen ? (
                <button type="button" className={m.secondary} onClick={() => setConfirmOpen(true)}>
                  <Icon name="checkCircle" /> العميل دفع، أأكد الدفع
                </button>
              ) : (
                <form className={o.inlineForm} onSubmit={manualConfirm}>
                  <label className={m.field}>
                    <span>دفع عن طريق</span>
                    <select className={m.input} value={methodId} onChange={(ev) => setMethodId(ev.target.value)} required>
                      <option value="">اختار طريقة الدفع</option>
                      {methods.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name}
                          {pm.active ? "" : " (مقفولة)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={m.field}>
                    <span>ملاحظة (اختياري)</span>
                    <input className={m.input} value={note} maxLength={200} onChange={(ev) => setNote(ev.target.value)} placeholder="رقم العملية، اسم المحوّل..." />
                  </label>
                  <div className={m.inlineActions}>
                    <button type="submit" className={m.primary} disabled={busy || !methodId}>
                      تأكيد الدفع
                    </button>
                    <button type="button" className={m.linkBtn} onClick={() => setConfirmOpen(false)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* ---- links & WhatsApp ---- */}
          {e && !ord.cancelledAt && (
            <section className={o.block}>
              <h3>اللينكات</h3>
              <div className={o.linkGrid}>
                <a className={m.secondary} href={`/order/${e.manageToken}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="external" /> صفحة الطلب
                </a>
                {ord.payment === "paid" ? (
                  <>
                    <a className={m.secondary} href={`/i/${e.slug}`} target="_blank" rel="noopener noreferrer">
                      <Icon name="external" /> الدعوة
                    </a>
                    {ord.packageId >= 2 && (
                      <a className={m.secondary} href={`/c/${e.manageToken}`} target="_blank" rel="noopener noreferrer">
                        <Icon name="external" /> صفحة العميل
                      </a>
                    )}
                  </>
                ) : (
                  <a className={m.secondary} href={`/order/${e.manageToken}/preview`} target="_blank" rel="noopener noreferrer">
                    <Icon name="eye" /> المعاينة
                  </a>
                )}
              </div>
              <a className={o.waButton} href={ord.payment === "paid" ? waPaid : waUnpaid} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" /> {ord.payment === "paid" ? "ابعتله اللينكات على واتساب" : "ابعتله لينك الطلب والدفع على واتساب"}
              </a>
            </section>
          )}

          {/* ---- packages 3-4 ---- */}
          {ord.packageId >= 3 && !ord.cancelledAt && (
            <section className={o.block}>
              <h3>شغل الفريق</h3>
              <label className={m.field}>
                <span>المرحلة</span>
                <select
                  className={m.input}
                  value={ord.stage ?? "new"}
                  disabled={busy}
                  onChange={(ev) => act({ action: "stage", stage: ev.target.value }, "اتحدث")}
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {ord.brief && (
                <div className={o.brief}>
                  <strong>{CATEGORY_LABELS[ord.brief.category]}</strong>
                  {ord.brief.date && <span> · {ord.brief.date}</span>}
                  {ord.brief.notes && <p>{ord.brief.notes}</p>}
                </div>
              )}
              {ord.references && ord.references.length > 0 && (
                <ul className={o.refs}>
                  {ord.references.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        <Icon name={r.type === "video" ? "video" : "image"} /> {r.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div className={m.inlineActions}>
                {ord.kind === "custom" && !e && (
                  <button
                    type="button"
                    className={m.primary}
                    disabled={busy}
                    onClick={() => act({ action: "create_event" }, "اتعملت صفحة الطلب. ابعتله لينك الطلب والدفع.")}
                  >
                    <Icon name="plus" /> اعمل صفحة الطلب
                  </button>
                )}
                {ord.kind === "custom" && ord.payment !== "paid" && (
                  <button
                    type="button"
                    className={m.secondary}
                    disabled={busy}
                    onClick={() => {
                      const v = prompt("السعر المتفق عليه (جنيه)", String(ord.total));
                      if (v !== null && v.trim()) void act({ action: "set_total", total: Number(v) }, "السعر اتعدل");
                    }}
                  >
                    <Icon name="edit" /> تعديل السعر
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ---- edit the invitation (our team) ---- */}
          {e && !ord.cancelledAt && (
            <section className={o.block}>
              <button type="button" className={o.blockToggle} onClick={() => setEditOpen((x) => !x)} aria-expanded={editOpen}>
                <Icon name="edit" /> تعديل بيانات الدعوة
              </button>
              {editOpen && <EventEditor details={e.details} onSave={(d) => act({ action: "edit_event", ...d }, "اتحفظ")} busy={busy} />}
            </section>
          )}

          {changes.length > 0 && (
            <section className={o.block}>
              <h3>طلبات التعديل من العميل</h3>
              <ul className={m.simpleList}>
                {changes.map((c) => (
                  <li key={c.id}>
                    <span>{c.body}</span>
                    {c.resolvedAt ? (
                      <span className={`${m.badge} ${m.badgeOk}`}>اتعمل</span>
                    ) : (
                      <button type="button" className={m.secondary} onClick={() => resolveChange(c.id)}>
                        <Icon name="check" /> خلص
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={o.block}>
            {ord.cancelledAt ? (
              <button
                type="button"
                className={m.secondary}
                disabled={busy}
                onClick={() => confirm("ترجّع الطلب واللينكات تشتغل تاني؟") && act({ action: "restore" }, "رجع")}
              >
                إلغاء الإلغاء
              </button>
            ) : (
              <button type="button" className={`${m.linkBtn} ${a.danger}`} disabled={busy} onClick={cancel}>
                إلغاء الطلب / مرتجع
              </button>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function EventEditor({
  details,
  onSave,
  busy,
}: {
  details: NonNullable<OrderRow["event"]>["details"];
  onSave: (d: NonNullable<OrderRow["event"]>["details"]) => void;
  busy: boolean;
}) {
  const [d, setD] = useState(details);
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }));
  return (
    <form
      className={o.inlineForm}
      onSubmit={(ev) => {
        ev.preventDefault();
        onSave(d);
      }}
    >
      <label className={m.field}>
        <span>الجملة اللي في أول الدعوة</span>
        <input className={m.input} value={d.generalText} maxLength={200} onChange={(ev) => set({ generalText: ev.target.value })} />
      </label>
      <div className={m.twoCols}>
        <label className={m.field}>
          <span>الاسم الأول</span>
          <input className={m.input} value={d.partnerA} maxLength={40} onChange={(ev) => set({ partnerA: ev.target.value })} />
        </label>
        <label className={m.field}>
          <span>الاسم التاني</span>
          <input className={m.input} value={d.partnerB} maxLength={40} onChange={(ev) => set({ partnerB: ev.target.value })} />
        </label>
      </div>
      <div className={m.field}>
        <span>التاريخ والساعة</span>
        <DateTimePicker value={d.date} onChange={(date) => set({ date })} />
      </div>
      <div className={m.twoCols}>
        <label className={m.field}>
          <span>المكان</span>
          <input className={m.input} value={d.venueName} maxLength={80} onChange={(ev) => set({ venueName: ev.target.value })} />
        </label>
        <label className={m.field}>
          <span>العنوان</span>
          <input className={m.input} value={d.venueAddress} maxLength={120} onChange={(ev) => set({ venueAddress: ev.target.value })} />
        </label>
      </div>
      <label className={m.field}>
        <span>لينك جوجل ماب أو آبل ماب</span>
        <input className={m.input} dir="ltr" value={d.mapsUrl} onChange={(ev) => set({ mapsUrl: ev.target.value })} />
      </label>
      <label className={m.field}>
        <span>اللغة</span>
        <select className={m.input} value={d.lang} onChange={(ev) => set({ lang: ev.target.value as Lang })}>
          <option value="ar">عربي</option>
          <option value="en">English</option>
        </select>
      </label>
      <button type="submit" className={m.primary} disabled={busy}>
        حفظ
      </button>
    </form>
  );
}
