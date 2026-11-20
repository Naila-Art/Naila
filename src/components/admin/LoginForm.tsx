"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { UploadError, postJson } from "@/lib/upload-client";

const ERRORS: Record<string, string> = {
  invalid_login: "الإيميل أو الباسورد غلط.",
  locked: "محاولات غلط كتير. استنى 10 دقايق وجرب تاني.",
  invalid_code: "كود الإعداد غلط.",
  weak_password: "الباسورد لازم يبقى 8 حروف أو أكتر.",
  invalid_email: "الإيميل مش مظبوط.",
  name_required: "اكتب اسمك.",
  already_set_up: "فيه حساب متعمل خلاص. سجل دخول.",
};

export default function LoginForm({ firstRun }: { firstRun: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (firstRun) await postJson("/api/admin/setup", { code, name, email, password });
      else await postJson("/api/admin/login", { email, password });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(ERRORS[err instanceof UploadError ? err.code : ""] ?? "حصلت مشكلة. جرب تاني.");
      setBusy(false);
    }
  }

  return (
    <main className={a.loginPage} dir="rtl" lang="ar">
      <form className={`${m.panel} ${a.loginCard}`} onSubmit={submit}>
        <h1>{firstRun ? "أول حساب للداشبورد" : "تسجيل الدخول"}</h1>
        <p className={m.hint}>
          {firstRun
            ? "مافيش حسابات لسه. اعمل حسابك بكود الإعداد (ADMIN_TOKEN من ملف الإعدادات)، وبعدها تضيف باقي الفريق من صفحة الفريق."
            : "داشبورد الإدارة"}
        </p>
        {firstRun && (
          <>
            <label className={m.field}>
              <span>كود الإعداد</span>
              <input className={m.input} dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required />
            </label>
            <label className={m.field}>
              <span>اسمك</span>
              <input className={m.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
            </label>
          </>
        )}
        <label className={m.field}>
          <span>الإيميل</span>
          <input className={m.input} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className={m.field}>
          <span>الباسورد</span>
          <input
            className={m.input}
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={firstRun ? "new-password" : "current-password"}
            minLength={firstRun ? 8 : undefined}
            required
          />
        </label>
        {error && (
          <p className={m.error} role="alert">
            {error}
          </p>
        )}
        <button className={m.primary} type="submit" disabled={busy}>
          {busy ? "ثانية..." : firstRun ? "اعمل الحساب وادخل" : "دخول"}
        </button>
      </form>
    </main>
  );
}
