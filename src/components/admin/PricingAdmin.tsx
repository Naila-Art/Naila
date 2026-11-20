"use client";

import { useEffect, useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { DEFAULT_PRICING, INCLUDED_IN_ALL, hasNamedGuests, isSelfServe, type PackageInfo, type Pricing } from "@/lib/pricing";
import { UploadError, postJson } from "@/lib/upload-client";

const ERRORS: Record<string, string> = {
  need_self_serve: "لازم باقة 1 أو 2 تفضل شغالة، عشان الموقع يقدر يبيع.",
};

function errorText(code: string): string {
  if (ERRORS[code]) return ERRORS[code];
  const pkg = code.match(/^package_(\d)_(name|price|points)$/);
  if (pkg) {
    const what =
      pkg[2] === "name" ? "الاسم فاضي أو طويل" : pkg[2] === "price" ? "السعر لازم يبقى رقم صحيح" : "النقط كتير أو طويلة (8 نقط بحد أقصى)";
    return `باقة ${pkg[1]}: ${what}.`;
  }
  return "ماتحفظش. جرب تاني.";
}

/** Whole numbers only; empty input stays editable while typing. */
const toNumber = (v: string) => (v.trim() === "" ? NaN : Number(v));

function describe(id: PackageInfo["id"]): string {
  const who = isSelfServe(id) ? "العميل بيعملها من الموقع" : "فريقنا بيعملها (طلب)";
  return hasNamedGuests(id) ? `${who} · فيها دعوة باسم كل ضيف` : who;
}

/** Packages and prices. Saved prices apply to new orders only. */
export default function PricingAdmin({ initial }: { initial: Pricing }) {
  const [p, setP] = useState<Pricing>(initial);
  const [saved, setSaved] = useState<Pricing>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(p) !== JSON.stringify(saved);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setPkg = (id: number, patch: Partial<PackageInfo>) =>
    setP((x) => ({ packages: x.packages.map((pk) => (pk.id === id ? { ...pk, ...patch } : pk)) }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { pricing } = await postJson<{ pricing: Pricing }>(`/api/admin/pricing`, { pricing: p }, "PUT");
      setP(pricing);
      setSaved(pricing);
      setMsg({ ok: true, text: "اتحفظ. الأسعار الجديدة ظاهرة على الموقع دلوقتي." });
    } catch (err) {
      setMsg({ ok: false, text: errorText(err instanceof UploadError ? err.code : "") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>الباقات والأسعار</h1>
        <p className={m.hint}>
          التغيير بيطبق على الطلبات الجديدة بس. الطلبات القديمة بتفضل بسعرها. في كل الباقات ببلاش: {INCLUDED_IN_ALL.join(" · ")}.
        </p>
      </header>

      <form className={a.pricingForm} onSubmit={save}>
        {p.packages.map((pk) => (
          <section key={pk.id} className={m.panel} data-off={!pk.active}>
            <div className={m.panelHead}>
              <h2>
                باقة {pk.id}
                <small className={m.hint}> · {describe(pk.id)}</small>
              </h2>
              <label className={m.checkRow}>
                <input type="checkbox" checked={pk.active} onChange={(e) => setPkg(pk.id, { active: e.target.checked })} />
                <span>{pk.active ? "معروضة" : "مخفية"}</span>
              </label>
            </div>
            <div className={a.twoCols}>
              <label className={m.field}>
                <span>الاسم</span>
                <input className={m.input} value={pk.name} maxLength={40} onChange={(e) => setPkg(pk.id, { name: e.target.value })} />
              </label>
              <label className={m.field}>
                <span>السعر (جنيه)</span>
                <input
                  className={m.input}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={Number.isNaN(pk.price) ? "" : pk.price}
                  onChange={(e) => setPkg(pk.id, { price: toNumber(e.target.value) })}
                />
              </label>
            </div>
            <label className={m.field}>
              <span>كلمة قبل السعر (اختياري، زي &quot;تبدأ من&quot;)</span>
              <input
                className={m.input}
                value={pk.priceNote ?? ""}
                maxLength={20}
                onChange={(e) => setPkg(pk.id, { priceNote: e.target.value || undefined })}
              />
            </label>
            <label className={m.field}>
              <span>المميزات (كل سطر نقطة، لحد 8)</span>
              <textarea
                className={m.input}
                rows={Math.max(3, pk.points.length + 1)}
                value={pk.points.join("\n")}
                onChange={(e) => setPkg(pk.id, { points: e.target.value.split("\n") })}
              />
            </label>
          </section>
        ))}

        <div className={a.saveBar}>
          {msg && (
            <p className={msg.ok ? m.ok : m.error} role={msg.ok ? "status" : "alert"}>
              {msg.text}
            </p>
          )}
          <div className={m.inlineActions}>
            <button className={m.primary} type="submit" disabled={busy || !dirty}>
              {busy ? "بيتحفظ..." : dirty ? "حفظ التغييرات" : "مافيش تغييرات"}
            </button>
            {dirty && (
              <button type="button" className={m.secondary} onClick={() => setP(saved)}>
                تراجع
              </button>
            )}
            <button
              type="button"
              className={m.linkBtn}
              onClick={() => confirm("ترجّع الباقات والأسعار الأصلية؟ (لسه محتاجة حفظ)") && setP(DEFAULT_PRICING)}
            >
              الأسعار الأصلية
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
