"use client";

import { useEffect, useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import {
  DEFAULT_PRICING,
  INCLUDED_IN_ALL,
  hasNamedGuests,
  isSelfServe,
  type PackageInfo,
  type Pricing,
  type StepText,
} from "@/lib/pricing";
import { UploadError, postJson } from "@/lib/upload-client";

const ERRORS: Record<string, string> = {
  need_self_serve: "لازم باقة 1 أو 2 تفضل شغالة، عشان الموقع يقدر يبيع.",
  steps_count: "لازم يبقى فيه 3 نقط بالظبط.",
};

function errorText(code: string): string {
  if (ERRORS[code]) return ERRORS[code];
  const pkg = code.match(/^package_(\d)_(name|price|points|pointsEn)$/);
  if (pkg) {
    const what =
      pkg[2] === "name"
        ? "الاسم فاضي أو طويل"
        : pkg[2] === "price"
          ? "السعر لازم يبقى رقم صحيح"
          : pkg[2] === "pointsEn"
            ? "المميزات بالإنجليزي كتير أو طويلة (8 نقط بحد أقصى)"
            : "النقط كتير أو طويلة (8 نقط بحد أقصى)";
    return `باقة ${pkg[1]}: ${what}.`;
  }
  const step = code.match(/^step_(\d)_(ar|en)_(title|body)$/);
  if (step) {
    const lang = step[2] === "ar" ? "العربي" : "الإنجليزي";
    const what = step[3] === "title" ? "العنوان فاضي أو طويل (80 حرف)" : "الشرح فاضي أو طويل (240 حرف)";
    return `نقطة ${step[1]} (${lang}): ${what}.`;
  }
  return "ماتحفظش. جرب تاني.";
}

/** Whole numbers only; empty input stays editable while typing. */
const toNumber = (v: string) => (v.trim() === "" ? NaN : Number(v));

function describe(id: PackageInfo["id"]): string {
  const who = isSelfServe(id) ? "العميل بيعملها من الموقع" : "فريقنا بيعملها (طلب)";
  return hasNamedGuests(id) ? `${who} · فيها دعوة باسم كل معزوم` : who;
}

/** Packages and prices. Saved prices apply to new orders only. */
export default function PricingAdmin({ adminKey, initial }: { adminKey: string; initial: Pricing }) {
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
    setP((x) => ({ ...x, packages: x.packages.map((pk) => (pk.id === id ? { ...pk, ...patch } : pk)) }));

  const setStep = (i: number, lang: "ar" | "en", patch: Partial<StepText>) =>
    setP((x) => ({
      ...x,
      steps: x.steps.map((s, j) => (j === i ? { ...s, [lang]: { ...s[lang], ...patch } } : s)),
    }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { pricing } = await postJson<{ pricing: Pricing }>(`/api/admin/${adminKey}/pricing`, { pricing: p }, "PUT");
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
    <main className={m.page} dir="rtl" lang="ar">
      <header className={m.header}>
        <div className={m.kicker}>داشبورد الإدارة</div>
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
            <label className={m.field}>
              <span>المميزات بالإنجليزي (للزوار اللي فاتحين الموقع إنجليزي، كل سطر نقطة)</span>
              <textarea
                className={m.input}
                dir="ltr"
                rows={Math.max(3, (pk.pointsEn?.length ?? 0) + 1)}
                value={(pk.pointsEn ?? []).join("\n")}
                placeholder="Leave empty to use the built-in English text"
                onChange={(e) => setPkg(pk.id, { pointsEn: e.target.value.split("\n") })}
              />
            </label>
          </section>
        ))}

        <section className={m.panel}>
          <div className={m.panelHead}>
            <h2>
              النقط التلاتة تحت الباقات
              <small className={m.hint}> · ظاهرة في كارت الأسعار على الصفحة الرئيسية</small>
            </h2>
          </div>
          {p.steps.map((step, i) => (
            <fieldset key={i} className={a.stepFields}>
              <legend>نقطة {i + 1}</legend>
              <div className={a.twoCols}>
                <label className={m.field}>
                  <span>العنوان (عربي)</span>
                  <input
                    className={m.input}
                    value={step.ar.title}
                    maxLength={80}
                    onChange={(e) => setStep(i, "ar", { title: e.target.value })}
                  />
                </label>
                <label className={m.field}>
                  <span>Title (English)</span>
                  <input
                    className={m.input}
                    dir="ltr"
                    value={step.en.title}
                    maxLength={80}
                    onChange={(e) => setStep(i, "en", { title: e.target.value })}
                  />
                </label>
                <label className={m.field}>
                  <span>الشرح (عربي)</span>
                  <textarea
                    className={m.input}
                    rows={3}
                    value={step.ar.body}
                    maxLength={240}
                    onChange={(e) => setStep(i, "ar", { body: e.target.value })}
                  />
                </label>
                <label className={m.field}>
                  <span>Description (English)</span>
                  <textarea
                    className={m.input}
                    dir="ltr"
                    rows={3}
                    value={step.en.body}
                    maxLength={240}
                    onChange={(e) => setStep(i, "en", { body: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>
          ))}
        </section>

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
