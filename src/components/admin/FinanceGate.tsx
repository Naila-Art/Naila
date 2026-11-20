"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { UploadError, postJson } from "@/lib/upload-client";

const ERRORS: Record<string, string> = {
  wrong_password: "الباسورد غلط.",
  invalid_code: "كود الإعداد غلط.",
  weak_password: "الباسورد لازم يبقى 8 حروف أو أكتر.",
  locked: "محاولات غلط كتير. استنى 10 دقايق وجرب تاني.",
  already_set_up: "الباسورد متحدد خلاص. حدّث الصفحة.",
};
const text = (err: unknown) => ERRORS[err instanceof UploadError ? err.code : ""] ?? "حصلت مشكلة. جرب تاني.";

/** Asks for the finance password (or sets it the first time with the setup code). */
export default function FinanceGate({ mode }: { mode: "unlock" | "setup" }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "setup" && password !== confirm) return setError("الباسوردين مش زي بعض.");
    setBusy(true);
    try {
      await postJson("/api/admin/finance", mode === "setup" ? { action: "setup", code, password } : { action: "unlock", password });
      router.refresh();
    } catch (err) {
      setError(text(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${m.panel} ${a.gate}`} onSubmit={submit}>
      <div className={a.gateIcon} aria-hidden>
        🔒
      </div>
      <h2>{mode === "setup" ? "حدد باسورد الحسابات" : "الصفحة دي محمية"}</h2>
      <p className={m.hint}>
        {mode === "setup"
          ? "أول مرة بس: اكتب كود الإعداد (ADMIN_TOKEN من ملف الإعدادات)، واختار باسورد للحسابات منفصل عن باسورد الدخول."
          : "اكتب باسورد الحسابات. الصفحة هتفضل مفتوحة على الجهاز ده ساعتين."}
      </p>
      {mode === "setup" && (
        <label className={m.field}>
          <span>كود الإعداد</span>
          <input className={m.input} dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required />
        </label>
      )}
      <label className={m.field}>
        <span>{mode === "setup" ? "باسورد الحسابات الجديد" : "باسورد الحسابات"}</span>
        <input
          className={m.input}
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "setup" ? "new-password" : "current-password"}
          required
          autoFocus
        />
      </label>
      {mode === "setup" && (
        <label className={m.field}>
          <span>اكتبه تاني</span>
          <input className={m.input} type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </label>
      )}
      {error && (
        <p className={m.error} role="alert">
          {error}
        </p>
      )}
      <button className={m.primary} type="submit" disabled={busy}>
        {mode === "setup" ? "حفظ وفتح الحسابات" : "افتح"}
      </button>
    </form>
  );
}

/** Lock button + change-password form, shown once the page is open. */
export function FinanceTools() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function lock() {
    await postJson("/api/admin/finance", { action: "lock" });
    router.refresh();
  }

  async function change(e: FormEvent) {
    e.preventDefault();
    try {
      await postJson("/api/admin/finance", { action: "change", current, next });
      setMsg({ ok: true, t: "الباسورد اتغير." });
      setCurrent("");
      setNext("");
    } catch (err) {
      setMsg({ ok: false, t: text(err) });
    }
  }

  return (
    <div className={a.financeTools}>
      <div className={m.inlineActions}>
        <button type="button" className={m.secondary} onClick={lock}>
          🔒 اقفل الحسابات
        </button>
        <button type="button" className={m.linkBtn} onClick={() => setOpen((o) => !o)}>
          تغيير باسورد الحسابات
        </button>
      </div>
      {open && (
        <form className={a.inlineForm} onSubmit={change}>
          <input className={m.input} type="password" dir="ltr" placeholder="الباسورد الحالي" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          <input className={m.input} type="password" dir="ltr" placeholder="الباسورد الجديد (8 حروف أو أكتر)" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <button className={m.primary} type="submit">
            حفظ
          </button>
          {msg && <span className={msg.ok ? m.ok : m.error}>{msg.t}</span>}
        </form>
      )}
    </div>
  );
}
