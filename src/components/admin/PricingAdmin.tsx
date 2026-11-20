"use client";

import { useEffect, useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import {
  ADDON_LABELS,
  DEFAULT_PRICING,
  NAMES_TIER_IDS,
  formatEgp,
  isSelfServe,
  type AddonKey,
  type PackageInfo,
  type Pricing,
} from "@/lib/pricing";
import type { NamesTier } from "@/lib/types";
import { UploadError, postJson } from "@/lib/upload-client";

const ERRORS: Record<string, string> = {
  need_self_serve: "لازم باقة 1 أو 2 تفضل شغالة، عشان الموقع يقدر يبيع.",
  addon_price: "سعر إضافة مش مظبوط.",
  tier_order: "عدد المعازيم لازم يزيد: الأولى أقل من التانية، والتانية مش أكتر من المفتوحة.",
};

function errorText(code: string): string {
  if (ERRORS[code]) return ERRORS[code];
  const pkg = code.match(/^package_(\d)_(name|price|points)$/);
  if (pkg) return `باقة ${pkg[1]}: ${pkg[2] === "name" ? "الاسم فاضي أو طويل" : pkg[2] === "price" ? "السعر لازم يبقى رقم صحيح" : "النقط كتير أو طويلة (8 نقط بحد أقصى)"}.`;
  if (code.startsWith("tier_")) return "شريحة المعازيم: الاسم والسعر لازم يتكتبوا، والعدد من 1 لـ 5000.";
  return "ماتحفظش. جرب تاني.";
}

const OFF_NOTES: Record<"arabic" | "maps" | "customMusic", string> = {
  arabic: "مقفولة: العميل بيختار عربي أو إنجليزي ببلاش",
  maps: "مقفولة: اللوكيشن مجاناً في كل الباقات",
  customMusic: "مقفولة: العميل مش بيرفع أغنيته",
};

/** Whole numbers only; empty input stays editable while typing. */
const toNumber = (v: string) => (v.trim() === "" ? NaN : Number(v));

/** Packages, add-on prices and guest-count tiers. Saved prices apply to new orders only. */
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
  const setEnabled = (k: AddonKey, on: boolean) => setP((x) => ({ ...x, addonsEnabled: { ...x.addonsEnabled, [k]: on } }));
  const setTier =(id: NamesTier, patch: Partial<Pricing["namesTiers"][NamesTier]>) =>
    setP((x) => ({ ...x, namesTiers: { ...x.namesTiers, [id]: { ...x.namesTiers[id], ...patch } } }));

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
          التغيير بيطبق على الطلبات الجديدة بس. الطلبات القديمة بتفضل بسعرها، والعميل اللي لسه مادفعش هيشوف السعر الجديد لو
          غيّر باقته.
        </p>
      </header>

      <form className={a.pricingForm} onSubmit={save}>
        {p.packages.map((pk) => (
          <section key={pk.id} className={m.panel} data-off={!pk.active}>
            <div className={m.panelHead}>
              <h2>
                باقة {pk.id}
                <small className={m.hint}> · {isSelfServe(pk.id) ? "العميل بيعملها من الموقع" : "فريقنا بيعملها (طلب)"}</small>
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

        <section className={m.panel}>
          <h2>الإضافات</h2>
          <p className={m.hint}>
            الإضافة المقفولة مش بتظهر للعميل خالص. اللغة لما تتقفل بتبقى اختيار ببلاش (عربي أو إنجليزي)، واللوكيشن لما
            يتقفل بيبقى مجاناً في كل الباقات.
          </p>
          <div className={a.threeCols}>
            {(["arabic", "maps", "customMusic"] as const).map((k) => (
              <div key={k} className={a.addonBox} data-off={!p.addonsEnabled[k]}>
                <label className={m.checkRow}>
                  <input type="checkbox" checked={p.addonsEnabled[k]} onChange={(e) => setEnabled(k, e.target.checked)} />
                  <span>{ADDON_LABELS[k]}</span>
                </label>
                <label className={m.field}>
                  <span>السعر</span>
                  <input
                    className={m.input}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    disabled={!p.addonsEnabled[k]}
                    value={Number.isNaN(p.addons[k]) ? "" : p.addons[k]}
                    onChange={(e) => setP((x) => ({ ...x, addons: { ...x.addons, [k]: toNumber(e.target.value) } }))}
                  />
                </label>
                <small className={m.hint}>{p.addonsEnabled[k] ? "بتتباع كإضافة" : OFF_NOTES[k]}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={m.panel} data-off={!p.addonsEnabled.names}>
          <div className={m.panelHead}>
            <h2>{ADDON_LABELS.names}: الشرائح</h2>
            <label className={m.checkRow}>
              <input type="checkbox" checked={p.addonsEnabled.names} onChange={(e) => setEnabled("names", e.target.checked)} />
              <span>{p.addonsEnabled.names ? "بتتباع" : "مقفولة"}</span>
            </label>
          </div>
          <p className={m.hint}>
            {p.addonsEnabled.names
              ? "العدد هو أقصى عدد معازيم بالاسم. باقة 4 بتاخد الشريحة المفتوحة مجاناً."
              : "مقفولة: الدعوة باسم كل معزوم موجودة في باقة 4 بس."}
          </p>
          {NAMES_TIER_IDS.map((id) => (
            <div key={id} className={a.tierRow}>
              <label className={m.field}>
                <span>الاسم</span>
                <input className={m.input} value={p.namesTiers[id].label} maxLength={40} onChange={(e) => setTier(id, { label: e.target.value })} />
              </label>
              <label className={m.field}>
                <span>أقصى عدد</span>
                <input
                  className={m.input}
                  type="number"
                  min={1}
                  max={5000}
                  step={1}
                  inputMode="numeric"
                  value={Number.isNaN(p.namesTiers[id].limit) ? "" : p.namesTiers[id].limit}
                  onChange={(e) => setTier(id, { limit: toNumber(e.target.value) })}
                />
              </label>
              <label className={m.field}>
                <span>السعر</span>
                <input
                  className={m.input}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={Number.isNaN(p.namesTiers[id].price) ? "" : p.namesTiers[id].price}
                  onChange={(e) => setTier(id, { price: toNumber(e.target.value) })}
                />
              </label>
            </div>
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
              onClick={() => confirm("ترجّع أسعار ملف زياد الأصلية؟ (لسه محتاجة حفظ)") && setP(DEFAULT_PRICING)}
            >
              الأسعار الأصلية
            </button>
          </div>
          <p className={m.hint}>
            مثال: باقة {p.packages[0]?.name} بالعربي ={" "}
            {formatEgp((p.packages[0]?.price || 0) + (p.addonsEnabled.arabic ? p.addons.arabic || 0 : 0))}
          </p>
        </div>
      </form>
    </main>
  );
}
