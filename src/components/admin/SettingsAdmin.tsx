"use client";

import { useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import Icon from "../Icon";
import { UploadError, postJson } from "@/lib/upload-client";

interface Settings {
  brand: string;
  whatsapp: string;
  socials: { facebook: string; instagram: string; tiktok: string };
}

const ERRORS: Record<string, string> = {
  brand_required: "اكتب اسم البراند.",
  whatsapp_invalid: "رقم الواتساب مش مظبوط (مثلاً 01001234567).",
  facebook_invalid: "لينك فيسبوك لازم يبدأ بـ https://facebook.com/",
  instagram_invalid: "لينك إنستجرام لازم يبدأ بـ https://instagram.com/",
  tiktok_invalid: "لينك تيك توك لازم يبدأ بـ https://tiktok.com/",
};

/** Brand, WhatsApp and social links shown on the site (header, footer, contact buttons). */
export default function SettingsAdmin({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const setSocial = (k: keyof Settings["socials"], v: string) => setS((x) => ({ ...x, socials: { ...x.socials, [k]: v } }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await postJson("/api/admin/settings", s, "PUT");
      setMsg({ ok: true, t: "اتحفظ. الموقع اتحدث." });
    } catch (err) {
      setMsg({ ok: false, t: ERRORS[err instanceof UploadError ? err.code : ""] ?? "ماتحفظش. جرب تاني." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>إعدادات الموقع</h1>
      </header>
      <form className={a.twoPanels} onSubmit={save}>
        <section className={m.panel}>
          <h2>البراند والتواصل</h2>
          <label className={m.field}>
            <span>اسم البراند</span>
            <input className={m.input} value={s.brand} maxLength={40} onChange={(e) => setS({ ...s, brand: e.target.value })} />
          </label>
          <label className={m.field}>
            <span className={a.labelIcon}>
              <Icon name="whatsapp" /> رقم الواتساب
            </span>
            <input
              className={m.input}
              dir="ltr"
              inputMode="tel"
              placeholder="01001234567"
              value={s.whatsapp}
              onChange={(e) => setS({ ...s, whatsapp: e.target.value })}
            />
          </label>
        </section>
        <section className={m.panel}>
          <h2>السوشيال ميديا (بتظهر في الفوتر)</h2>
          <label className={m.field}>
            <span className={a.labelIcon}>
              <Icon name="facebook" /> فيسبوك
            </span>
            <input className={m.input} dir="ltr" placeholder="https://facebook.com/..." value={s.socials.facebook} onChange={(e) => setSocial("facebook", e.target.value)} />
          </label>
          <label className={m.field}>
            <span className={a.labelIcon}>
              <Icon name="instagram" /> إنستجرام
            </span>
            <input className={m.input} dir="ltr" placeholder="https://instagram.com/..." value={s.socials.instagram} onChange={(e) => setSocial("instagram", e.target.value)} />
          </label>
          <label className={m.field}>
            <span className={a.labelIcon}>
              <Icon name="tiktok" /> تيك توك
            </span>
            <input className={m.input} dir="ltr" placeholder="https://tiktok.com/@..." value={s.socials.tiktok} onChange={(e) => setSocial("tiktok", e.target.value)} />
          </label>
          <p className={m.hint}>سيب الخانة فاضية لو مش عايزها تظهر.</p>
        </section>
        <div>
          {msg && <p className={msg.ok ? m.ok : m.error}>{msg.t}</p>}
          <button className={m.primary} type="submit" disabled={busy}>
            {busy ? "بيتحفظ..." : "حفظ"}
          </button>
        </div>
      </form>
    </main>
  );
}
