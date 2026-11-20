"use client";

import { useState, type FormEvent } from "react";
import m from "../manage/manage.module.css";
import a from "./admin.module.css";
import { UploadError, postJson } from "@/lib/upload-client";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const ERRORS: Record<string, string> = {
  weak_password: "الباسورد لازم يبقى 8 حروف أو أكتر.",
  invalid_email: "الإيميل مش مظبوط.",
  name_required: "اكتب الاسم.",
  email_taken: "الإيميل ده عليه حساب.",
  wrong_password: "الباسورد الحالي غلط.",
  cannot_remove_self: "مينفعش تمسح حسابك.",
  last_admin: "مينفعش تمسح آخر حساب.",
};
const text = (err: unknown) => ERRORS[err instanceof UploadError ? err.code : ""] ?? "حصلت مشكلة. جرب تاني.";

/** Team accounts for the dashboard. Everyone can sign in; money needs the separate finance password. */
export default function TeamAdmin({ initial, meId }: { initial: User[]; meId: string }) {
  const [users, setUsers] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const { user } = await postJson<{ user: User }>("/api/admin/team", { name, email, password });
      setUsers((u) => [...u, user]);
      setName("");
      setEmail("");
      setPassword("");
      setMsg({ ok: true, t: `اتضاف ${user.name}. ابعتله الإيميل والباسورد.` });
    } catch (err) {
      setMsg({ ok: false, t: text(err) });
    }
  }

  async function remove(u: User) {
    if (!confirm(`تمسح حساب ${u.name}؟ مش هيقدر يدخل الداشبورد تاني.`)) return;
    const res = await fetch(`/api/admin/team?id=${encodeURIComponent(u.id)}`, { method: "DELETE" });
    if (res.ok) setUsers((list) => list.filter((x) => x.id !== u.id));
    else setMsg({ ok: false, t: ERRORS[((await res.json().catch(() => ({}))) as { error?: string }).error ?? ""] ?? "ماتمسحش." });
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    try {
      await postJson("/api/admin/team", { current, next }, "PATCH");
      setPwMsg({ ok: true, t: "الباسورد اتغير." });
      setCurrent("");
      setNext("");
    } catch (err) {
      setPwMsg({ ok: false, t: text(err) });
    }
  }

  return (
    <main className={`${m.page} ${a.wide}`} dir="rtl" lang="ar">
      <header className={a.pageHead}>
        <h1>الفريق</h1>
      </header>

      <div className={a.twoPanels}>
        <section className={m.panel}>
          <h2>الحسابات ({users.length})</h2>
          <ul className={m.simpleList}>
            {users.map((u) => (
              <li key={u.id}>
                <span>
                  <strong>{u.name}</strong>
                  {u.id === meId && " (أنت)"}
                  <br />
                  <small className={m.hint} dir="ltr">
                    {u.email}
                  </small>
                </span>
                {u.id !== meId && (
                  <button type="button" className={m.linkBtn} onClick={() => remove(u)}>
                    مسح
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <form className={m.panel} onSubmit={add}>
          <h2>إضافة حد للفريق</h2>
          <label className={m.field}>
            <span>الاسم</span>
            <input className={m.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </label>
          <label className={m.field}>
            <span>الإيميل</span>
            <input className={m.input} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
          </label>
          <label className={m.field}>
            <span>باسورد مبدئي (8 حروف أو أكتر)</span>
            <input className={m.input} type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          </label>
          {msg && <p className={msg.ok ? m.ok : m.error}>{msg.t}</p>}
          <button className={m.primary} type="submit">
            إضافة
          </button>
        </form>

        <form className={m.panel} onSubmit={changePassword}>
          <h2>تغيير الباسورد بتاعي</h2>
          <input className={m.input} type="password" dir="ltr" placeholder="الباسورد الحالي" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          <input className={m.input} type="password" dir="ltr" placeholder="الباسورد الجديد" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
          {pwMsg && <p className={pwMsg.ok ? m.ok : m.error}>{pwMsg.t}</p>}
          <button className={m.primary} type="submit">
            حفظ
          </button>
        </form>
      </div>
    </main>
  );
}
