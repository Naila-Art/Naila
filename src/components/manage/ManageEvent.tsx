"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./manage.module.css";
import GuestImport from "./GuestImport";
import { guestKey, toCsv, validateGuest, type ParsedGuest } from "@/lib/guests";
import { displayName, fillPersonalText } from "@/lib/text";
import type { GuestWithStatus, Rsvp, Wish } from "@/lib/types";

export interface Dashboard {
  guests: GuestWithStatus[];
  generalRsvps: Rsvp[];
  generalOpens: number;
  wishes: Wish[];
}

interface Props {
  manageToken: string;
  slug: string;
  couple: string;
  initialTexts: { generalText: string; personalText: string };
  initial: Dashboard;
}

const TITLES = ["أستاذ", "أستاذة", "دكتور", "دكتورة", "مهندس", "مهندسة", "الحاج", "الحاجة"];

type Filter = "all" | "opened" | "notOpened" | "attending" | "declined";

function statusOf(g: GuestWithStatus): { label: string; cls: string } {
  if (g.rsvp === "attending") return { label: "هيحضر", cls: styles.badgeOk };
  if (g.rsvp === "declined") return { label: "اعتذر", cls: styles.badgeBad };
  if (g.openedAt) return { label: "فتح الدعوة", cls: styles.badgeInfo };
  return { label: "لسه مفتحش", cls: styles.badgeMuted };
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ManageEvent({ manageToken, slug, couple, initialTexts, initial }: Props) {
  const [data, setData] = useState<Dashboard>(initial);
  const [origin, setOrigin] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const api = `/api/manage/${encodeURIComponent(manageToken)}`;

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const refresh = async () => {
    const res = await fetch(`${api}/guests`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
  };

  const generalLink = `${origin}/i/${slug}`;
  const linkFor = (g: GuestWithStatus) => `${origin}/i/${slug}/${g.token}`;
  const existingKeys = useMemo(() => new Set(data.guests.map(guestKey)), [data.guests]);

  // ---- stats ----
  const stats = useMemo(() => {
    const g = data.guests;
    const gen = data.generalRsvps;
    return {
      total: g.length,
      opened: g.filter((x) => x.openedAt).length,
      attending: g.filter((x) => x.rsvp === "attending").length + gen.filter((r) => r.status === "attending").length,
      declined: g.filter((x) => x.rsvp === "declined").length + gen.filter((r) => r.status === "declined").length,
    };
  }, [data]);

  // ---- guests ----
  const saveGuests = async (guests: ParsedGuest[]) => {
    const res = await fetch(`${api}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: guests.map(({ title, name, phone }) => ({ title, name, phone })) }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const r = (await res.json()) as { added: number; duplicates: number; invalid: number };
    setToast(`اتضاف ${r.added} معزوم`);
    await refresh();
  };

  const removeGuest = async (g: GuestWithStatus) => {
    if (!window.confirm(`تمسح ${displayName(g)}؟ اللينك بتاعه هيبطل يشتغل.`)) return;
    const res = await fetch(`${api}/guests?id=${encodeURIComponent(g.id)}`, { method: "DELETE" });
    if (res.ok) {
      setToast("اتمسح");
      await refresh();
    }
  };

  const visible = data.guests.filter((g) => {
    if (filter === "opened" && !g.openedAt) return false;
    if (filter === "notOpened" && g.openedAt) return false;
    if (filter === "attending" && g.rsvp !== "attending") return false;
    if (filter === "declined" && g.rsvp !== "declined") return false;
    const q = query.trim();
    return !q || displayName(g).includes(q) || (g.phone ?? "").includes(q);
  });

  const copyAll = async () => {
    const text = data.guests.map((g) => `${displayName(g)}: ${linkFor(g)}`).join("\n");
    setToast((await copy(text)) ? `اتنسخت ${data.guests.length} لينك` : "مقدرناش ننسخ");
  };

  const exportCsv = () => {
    const csv = toCsv([
      ["اللقب", "الاسم", "رقم الموبايل", "اللينك", "الحالة"],
      ...data.guests.map((g) => [g.title, g.name, g.phone, linkFor(g), statusOf(g).label]),
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `لينكات-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.page} dir="rtl" lang="ar">
      <header className={styles.header}>
        <p className={styles.kicker}>دعوة</p>
        <h1>{couple}</h1>
        <a className={styles.linkBtn} href={generalLink} target="_blank" rel="noopener noreferrer">
          شوف الدعوة ↗
        </a>
      </header>

      <section className={styles.stats}>
        <Stat label="معزوم بالاسم" value={stats.total} />
        <Stat label="فتحوا الدعوة" value={stats.opened} />
        <Stat label="هيحضروا" value={stats.attending} />
        <Stat label="اعتذروا" value={stats.declined} />
      </section>

      <section className={styles.panel}>
        <h2>اللينك العام</h2>
        <p className={styles.hint}>لينك واحد لأي حد، من غير اسم. المعزوم بيكتب اسمه وهو بيرد.</p>
        <div className={styles.copyRow}>
          <code dir="ltr">{generalLink}</code>
          <button type="button" className={styles.secondary} onClick={async () => setToast((await copy(generalLink)) ? "اتنسخ" : "مقدرناش ننسخ")}>
            نسخ
          </button>
        </div>
      </section>

      <TextsEditor api={api} initial={initialTexts} onSaved={() => setToast("اتحفظ")} />

      <AddGuestForm onAdd={(g) => saveGuests([g])} existingKeys={existingKeys} />

      <GuestImport existingKeys={existingKeys} onSave={saveGuests} />

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>المعازيم ({data.guests.length})</h2>
          {data.guests.length > 0 && (
            <div className={styles.inlineActions}>
              <button type="button" className={styles.secondary} onClick={copyAll}>
                نسخ كل اللينكات
              </button>
              <button type="button" className={styles.secondary} onClick={exportCsv}>
                تصدير Excel
              </button>
            </div>
          )}
        </div>

        {data.guests.length === 0 ? (
          <p className={styles.empty}>لسه مفيش معازيم بالاسم. ضيف بإيدك أو ارفع شيت.</p>
        ) : (
          <>
            <div className={styles.filters}>
              <input className={styles.input} placeholder="بحث بالاسم أو الرقم" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className={styles.input} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
                <option value="all">الكل</option>
                <option value="opened">فتحوا الدعوة</option>
                <option value="notOpened">لسه مفتحوش</option>
                <option value="attending">هيحضروا</option>
                <option value="declined">اعتذروا</option>
              </select>
            </div>
            <ul className={styles.guestList}>
              {visible.map((g) => {
                const st = statusOf(g);
                return (
                  <li key={g.id} className={styles.guest}>
                    <div className={styles.guestMain}>
                      <strong>{displayName(g)}</strong>
                      {g.phone && <span dir="ltr" className={styles.phone}>{g.phone}</span>}
                    </div>
                    <span className={`${styles.badge} ${st.cls}`}>{st.label}</span>
                    <div className={styles.guestActions}>
                      <button type="button" className={styles.secondary} onClick={async () => setToast((await copy(linkFor(g))) ? "اتنسخ اللينك" : "مقدرناش ننسخ")}>
                        نسخ اللينك
                      </button>
                      <a className={styles.iconBtn} href={linkFor(g)} target="_blank" rel="noopener noreferrer" aria-label="فتح الدعوة">
                        ↗
                      </a>
                      <button type="button" className={styles.iconBtn} onClick={() => removeGuest(g)} aria-label="مسح">
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
              {visible.length === 0 && <li className={styles.empty}>مفيش نتايج</li>}
            </ul>
          </>
        )}
      </section>

      {data.generalRsvps.length > 0 && (
        <section className={styles.panel}>
          <h2>ردود من اللينك العام ({data.generalRsvps.length})</h2>
          <ul className={styles.simpleList}>
            {data.generalRsvps.map((r, i) => (
              <li key={i}>
                <span>{r.name}</span>
                <span className={`${styles.badge} ${r.status === "attending" ? styles.badgeOk : styles.badgeBad}`}>
                  {r.status === "attending" ? "هيحضر" : "اعتذر"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.panel}>
        <h2>التهاني ({data.wishes.length})</h2>
        {data.wishes.length === 0 ? (
          <p className={styles.empty}>لسه مفيش تهاني.</p>
        ) : (
          <ul className={styles.wishes}>
            {data.wishes.map((w) => (
              <li key={w.id}>
                <strong>{w.name}</strong>
                <p>{w.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function TextsEditor({ api, initial, onSaved }: { api: string; initial: Props["initialTexts"]; onSaved: () => void }) {
  const [generalText, setGeneralText] = useState(initial.generalText);
  const [personalText, setPersonalText] = useState(initial.personalText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = (token: string) => setPersonalText((t) => `${t.trimEnd()} ${token}`);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`${api}/texts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generalText, personalText }),
    });
    setBusy(false);
    if (res.ok) onSaved();
    else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error === "name_placeholder_missing" ? "لازم الصيغة يكون فيها {name}" : "الكلام فاضي أو طويل أوي");
    }
  };

  return (
    <form className={styles.panel} onSubmit={save}>
      <h2>صيغة الدعوة</h2>
      <label className={styles.field}>
        <span>الدعوة العامة (من غير اسم)</span>
        <input className={styles.input} value={generalText} maxLength={200} onChange={(e) => setGeneralText(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span>الدعوة بالاسم</span>
        <input className={styles.input} value={personalText} maxLength={200} onChange={(e) => setPersonalText(e.target.value)} />
      </label>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.chip} onClick={() => insert("{title}")}>+ اللقب</button>
        <button type="button" className={styles.chip} onClick={() => insert("{name}")}>+ الاسم</button>
        <button type="button" className={styles.chip} onClick={() => setPersonalText("تشرفنا بحضورك أنت والأسرة الكريمة يا {title} {name}")}>
          صيغة &quot;أنت والأسرة الكريمة&quot;
        </button>
      </div>
      <p className={styles.preview}>
        <span>معاينة:</span> {fillPersonalText(personalText, { title: "أستاذ", name: "أحمد" })}
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.primary} disabled={busy}>
        حفظ الصيغة
      </button>
    </form>
  );
}

function AddGuestForm({ onAdd, existingKeys }: { onAdd: (g: ParsedGuest) => Promise<void>; existingKeys: Set<string> }) {
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const g = validateGuest({ title, name, phone });
    if (g.error) {
      setError(g.error === "phone_invalid" ? "الرقم مش صحيح" : "اكتب الاسم");
      return;
    }
    if (existingKeys.has(guestKey(g))) {
      setError("المعزوم ده متضاف قبل كده");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd(g);
      setName("");
      setPhone("");
    } catch {
      setError("حصلت مشكلة، جرب تاني");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.panel} onSubmit={submit}>
      <h2>إضافة معزوم</h2>
      <div className={styles.addRow}>
        <input className={styles.input} list="titles" placeholder="اللقب" value={title} maxLength={30} onChange={(e) => setTitle(e.target.value)} />
        <datalist id="titles">
          {TITLES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <input className={styles.input} placeholder="الاسم" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
        <input className={styles.input} placeholder="رقم الموبايل (اختياري)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" />
        <button type="submit" className={styles.primary} disabled={busy}>
          إضافة
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
