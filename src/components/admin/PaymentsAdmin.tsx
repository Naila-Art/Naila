"use client";

import { useState } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import type { PaymentMethodConfig } from "@/lib/types";
import { UploadError, postJson } from "@/lib/upload-client";

const PRESETS: { name: string; placeholder: string }[] = [
  { name: "إنستاباي", placeholder: "name@instapay" },
  { name: "فودافون كاش", placeholder: "010xxxxxxxx" },
  { name: "أورانج كاش", placeholder: "012xxxxxxxx" },
  { name: "اتصالات كاش", placeholder: "011xxxxxxxx" },
  { name: "تحويل بنكي", placeholder: "رقم الحساب / IBAN + اسم البنك" },
];

function errorText(code: string): string {
  const m = code.match(/^method_(\d+)_(name|account)$/);
  if (m) return `الطريقة رقم ${m[1]}: ${m[2] === "name" ? "اكتب الاسم" : "اكتب الرقم أو الحساب اللي هيتحوّل عليه، أو اقفلها"}.`;
  if (code === "one_card_method") return "مينفعش أكتر من طريقة فيزا.";
  return "ماتحفظش. جرب تاني.";
}

/** Payment methods the client can choose from, in this order. */
export default function PaymentsAdmin({ initial, paymobReady }: { initial: PaymentMethodConfig[]; paymobReady: boolean }) {
  const [list, setList] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(list) !== JSON.stringify(saved);

  const set = (i: number, patch: Partial<PaymentMethodConfig>) => setList((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setList((l) => {
      const n = [...l];
      const j = i + d;
      if (j < 0 || j >= n.length) return l;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const add = (name = "") =>
    setList((l) => [...l, { id: `pm_${Date.now().toString(36)}`, name, kind: "transfer", account: "", active: false }]);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const { methods } = await postJson<{ methods: PaymentMethodConfig[] }>("/api/admin/payments", { methods: list }, "PUT");
      setList(methods);
      setSaved(methods);
      setMsg({ ok: true, t: "اتحفظ. العملاء هيشوفوا الطرق المفتوحة بس." });
    } catch (err) {
      setMsg({ ok: false, t: errorText(err instanceof UploadError ? err.code : "") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>طرق الدفع</h1>
      </header>
      <p className={m.hint}>
        العميل بيختار طريقة من المفتوحة، يحوّل، ويرفع صورة التحويل. التحويل بيوصلك في الطلبات تحت &quot;مستني تأكيد&quot;.
      </p>

      <div className={a.methods}>
        {list.map((pm, i) => (
          <section key={pm.id} className={m.panel} data-off={!pm.active}>
            <div className={m.panelHead}>
              <h2>{pm.name || "طريقة جديدة"}</h2>
              <label className={m.checkRow}>
                <input type="checkbox" checked={pm.active} onChange={(e) => set(i, { active: e.target.checked })} />
                <span>{pm.active ? "مفتوحة" : "مقفولة"}</span>
              </label>
            </div>

            {pm.kind === "card" ? (
              <p className={m.hint}>
                الدفع بالفيزا / ميزة / أبل باي عن طريق باي موب.{" "}
                {paymobReady ? (
                  <span className={m.ok}>مفاتيح باي موب موجودة ✓</span>
                ) : (
                  <span className={m.warn}>مش هتظهر للعميل لحد ما مفاتيح باي موب تتحط في الإعدادات.</span>
                )}
              </p>
            ) : (
              <>
                <label className={m.field}>
                  <span>الاسم اللي العميل هيشوفه</span>
                  <input className={m.input} value={pm.name} maxLength={40} onChange={(e) => set(i, { name: e.target.value })} />
                </label>
                <label className={m.field}>
                  <span>يحوّل على</span>
                  <input
                    className={m.input}
                    dir="ltr"
                    value={pm.account}
                    maxLength={120}
                    placeholder={PRESETS.find((p) => p.name === pm.name)?.placeholder ?? "الرقم أو العنوان"}
                    onChange={(e) => set(i, { account: e.target.value })}
                  />
                </label>
                <label className={m.field}>
                  <span>تعليمات (اختياري)</span>
                  <input
                    className={m.input}
                    value={pm.instructions ?? ""}
                    maxLength={300}
                    placeholder="مثلاً: اكتب اسمك في ملاحظة التحويل"
                    onChange={(e) => set(i, { instructions: e.target.value || undefined })}
                  />
                </label>
              </>
            )}

            <div className={m.inlineActions}>
              <button type="button" className={m.secondary} disabled={i === 0} onClick={() => move(i, -1)} aria-label="لفوق">
                ↑
              </button>
              <button type="button" className={m.secondary} disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="لتحت">
                ↓
              </button>
              {pm.kind === "transfer" && (
                <button
                  type="button"
                  className={m.linkBtn}
                  onClick={() => confirm(`تمسح "${pm.name || "الطريقة دي"}"؟`) && setList((l) => l.filter((_, j) => j !== i))}
                >
                  مسح
                </button>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className={m.panel}>
        <h2>إضافة طريقة</h2>
        <div className={m.inlineActions}>
          {PRESETS.filter((p) => !list.some((x) => x.name === p.name)).map((p) => (
            <button key={p.name} type="button" className={m.chip} onClick={() => add(p.name)}>
              + {p.name}
            </button>
          ))}
          <button type="button" className={m.chip} onClick={() => add()}>
            + طريقة تانية
          </button>
        </div>
      </section>

      <div className={a.saveBar}>
        {msg && <p className={msg.ok ? m.ok : m.error}>{msg.t}</p>}
        <div className={m.inlineActions}>
          <button type="button" className={m.primary} disabled={!dirty || busy} onClick={save}>
            {busy ? "بيتحفظ..." : dirty ? "حفظ" : "مافيش تغييرات"}
          </button>
          {dirty && (
            <button type="button" className={m.secondary} onClick={() => setList(saved)}>
              تراجع
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
