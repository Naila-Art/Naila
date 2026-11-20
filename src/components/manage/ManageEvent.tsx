"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import styles from "./manage.module.css";
import GuestImport from "./GuestImport";
import {
  MAX_GUEST_MESSAGE,
  guestKey,
  toCsv,
  validateGuest,
  type ParsedGuest,
} from "@/lib/guests";
import { displayName, fillPersonalText } from "@/lib/text";
import type { GuestWithStatus, Wish } from "@/lib/types";

export interface Dashboard {
  guests: GuestWithStatus[];
  generalOpens: number;
  wishes: Wish[];
}

interface Props {
  manageToken: string;
  slug: string;
  couple: string;
  initialTexts: { generalText: string; personalText: string };
  initial: Dashboard;
  /** Max named guests from the client's package; 0 = general link only. */
  namesLimit: number;
  /** Not paid yet: no shareable links (general, per guest, copy-all, export); previews only. */
  locked: boolean;
  showWishes: boolean;
  /** Order, payment, details, music and change-request panels, rendered under the header. */
  children?: ReactNode;
}

const TITLES = [
  "أستاذ",
  "أستاذة",
  "دكتور",
  "دكتورة",
  "مهندس",
  "مهندسة",
  "الحاج",
  "الحاجة",
];

type Filter = "all" | "opened" | "notOpened";

function statusOf(g: GuestWithStatus): { label: string; cls: string } {
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

export default function ManageEvent({
  manageToken,
  slug,
  couple,
  initialTexts,
  initial,
  namesLimit,
  showWishes,
  locked,
  children,
}: Props) {
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
  const previewBase = `/c/${encodeURIComponent(manageToken)}/preview`;
  const previewFor = (g: GuestWithStatus) =>
    `${previewBase}?guest=${encodeURIComponent(g.id)}`;
  const existingKeys = useMemo(
    () => new Set(data.guests.map(guestKey)),
    [data.guests],
  );

  // ---- stats ----
  const stats = useMemo(() => {
    const g = data.guests;
    return {
      total: g.length,
      opened: g.filter((x) => x.openedAt).length,
      wishes: data.wishes.length,
    };
  }, [data]);

  // ---- guests ----
  const saveGuests = async (guests: ParsedGuest[]) => {
    const res = await fetch(`${api}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guests: guests.map(({ title, name, phone, message }) => ({
          title,
          name,
          phone,
          message,
        })),
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const r = (await res.json()) as {
      added: number;
      duplicates: number;
      invalid: number;
      overLimit?: number;
    };
    setToast(
      r.overLimit
        ? `اتضاف ${r.added} ضيف، و${r.overLimit} فوق الحد بتاع باقتك (${namesLimit})`
        : `اتضاف ${r.added} ضيف`,
    );
    await refresh();
  };

  const removeGuest = async (g: GuestWithStatus) => {
    if (!window.confirm(`تمسح ${displayName(g)}؟ اللينك بتاعه هيبطل يشتغل.`))
      return;
    const res = await fetch(`${api}/guests?id=${encodeURIComponent(g.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setToast("اتمسح");
      await refresh();
    }
  };

  const visible = data.guests.filter((g) => {
    if (filter === "opened" && !g.openedAt) return false;
    if (filter === "notOpened" && g.openedAt) return false;
    const q = query.trim();
    return !q || displayName(g).includes(q) || (g.phone ?? "").includes(q);
  });

  const copyAll = async () => {
    const text = data.guests
      .map((g) => `${displayName(g)}: ${linkFor(g)}`)
      .join("\n");
    setToast(
      (await copy(text)) ? `اتنسخت ${data.guests.length} لينك` : "مقدرناش ننسخ",
    );
  };

  const exportCsv = () => {
    const csv = toCsv([
      ["اللقب", "الاسم", "رقم الموبايل", "رسالة خاصة", "اللينك", "الحالة"],
      ...data.guests.map((g) => [
        g.title,
        g.name,
        g.phone,
        g.message,
        linkFor(g),
        statusOf(g).label,
      ]),
    ]);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `لينكات-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={`${styles.page} ${styles.wide}`} dir="rtl" lang="ar">
      <nav className={styles.clientNav} aria-label="صفحة الدعوة">
        <strong>{couple}</strong>
        <div className={styles.clientNavLinks}>
          <a
            href={locked ? previewBase : generalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {locked ? "المعاينة ↗" : "الدعوة ↗"}
          </a>
          <a href="#payment">{locked ? "الدفع" : "الطلب"}</a>
          {namesLimit > 0 && <a href="#guests">الضيوف</a>}
          {showWishes && <a href="#wishes">التهاني</a>}
          <a href="#texts">الصيغة</a>
        </div>
      </nav>

      <div className={styles.layout}>
        <aside className={styles.sideCol}>
          {children}
          <TextsEditor
            api={api}
            initial={initialTexts}
            withNames={namesLimit > 0}
            onSaved={() => setToast("اتحفظ")}
          />
        </aside>

        <div className={styles.mainCol}>
          <section className={styles.stats}>
            <Stat label="ضيف بالاسم" value={stats.total} />
            <Stat label="فتحوا الدعوة" value={stats.opened} />
            {showWishes && <Stat label="تهاني" value={stats.wishes} />}
          </section>

          <section className={styles.panel}>
            <h2>اللينك العام</h2>
            {locked ? (
              <p className={styles.locked}>
                🔒 لينك الدعوة بيتفتح بعد الدفع. لحد كده تقدر تشوف المعاينة بس.
              </p>
            ) : (
              <>
                <p className={styles.hint}>لينك واحد لأي حد، من غير اسم.</p>
                <div className={styles.copyRow}>
                  <code dir="ltr">{generalLink}</code>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={async () =>
                      setToast(
                        (await copy(generalLink)) ? "اتنسخ" : "مقدرناش ننسخ",
                      )
                    }
                  >
                    نسخ
                  </button>
                </div>
              </>
            )}
          </section>

          {namesLimit > 0 ? (
            <>
              <AddGuestForm
                onAdd={(g) => saveGuests([g])}
                existingKeys={existingKeys}
              />

              <GuestImport existingKeys={existingKeys} onSave={saveGuests} />

              <section className={styles.panel} id="guests">
                <div className={styles.panelHead}>
                  <h2>الضيوف ({data.guests.length})</h2>
                  {data.guests.length > 0 && !locked && (
                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={copyAll}
                      >
                        نسخ كل اللينكات
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={exportCsv}
                      >
                        تصدير Excel
                      </button>
                    </div>
                  )}
                </div>

                {locked && data.guests.length > 0 && (
                  <p className={styles.locked}>
                    🔒 لينكات الضيوف ونسخها وتصديرها بيتفتحوا بعد الدفع. تقدر
                    تشوف معاينة أي ضيف.
                  </p>
                )}
                {data.guests.length === 0 ? (
                  <p className={styles.empty}>
                    لسه مفيش ضيوف بالاسم. ضيف بإيدك أو ارفع شيت.
                  </p>
                ) : (
                  <>
                    <div className={styles.filters}>
                      <input
                        className={styles.input}
                        placeholder="بحث بالاسم أو الرقم"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <select
                        className={styles.input}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as Filter)}
                      >
                        <option value="all">الكل</option>
                        <option value="opened">فتحوا الدعوة</option>
                        <option value="notOpened">لسه مفتحوش</option>
                      </select>
                    </div>
                    <ul className={styles.guestList}>
                      {visible.map((g) => {
                        const st = statusOf(g);
                        return (
                          <li key={g.id} className={styles.guest}>
                            <div className={styles.guestMain}>
                              <strong>{displayName(g)}</strong>
                              {g.phone && (
                                <span dir="ltr" className={styles.phone}>
                                  {g.phone}
                                </span>
                              )}
                              <GuestMessage
                                api={api}
                                guest={g}
                                onSaved={async (msg) => {
                                  setToast(
                                    msg ? "الرسالة اتحفظت" : "الرسالة اتشالت",
                                  );
                                  await refresh();
                                }}
                              />
                            </div>
                            <span className={`${styles.badge} ${st.cls}`}>
                              {st.label}
                            </span>
                            <div className={styles.guestActions}>
                              {locked ? (
                                <a
                                  className={styles.secondary}
                                  href={previewFor(g)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  معاينة ↗
                                </a>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={styles.secondary}
                                    onClick={async () =>
                                      setToast(
                                        (await copy(linkFor(g)))
                                          ? "اتنسخ اللينك"
                                          : "مقدرناش ننسخ",
                                      )
                                    }
                                  >
                                    نسخ اللينك
                                  </button>
                                  <a
                                    className={styles.iconBtn}
                                    href={linkFor(g)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="فتح الدعوة"
                                  >
                                    ↗
                                  </a>
                                </>
                              )}
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => removeGuest(g)}
                                aria-label="مسح"
                              >
                                ✕
                              </button>
                            </div>
                          </li>
                        );
                      })}
                      {visible.length === 0 && (
                        <li className={styles.empty}>مفيش نتايج</li>
                      )}
                    </ul>
                  </>
                )}
              </section>
            </>
          ) : (
            <section className={styles.panel}>
              <h2>دعوة باسم كل ضيف</h2>
              <p className={styles.hint}>
                باقتك فيها لينك عام واحد لكل الناس. الدعوة باسم كل ضيف (ورسالة
                خاصة لأي حد) موجودة في باقة &quot;على ذوقك&quot; والباقة الخاصة.
                كلمنا لو حابب تغيّر.
              </p>
            </section>
          )}

          {showWishes && (
            <section className={styles.panel} id="wishes">
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
          )}
        </div>
      </div>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
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

function TextsEditor({
  api,
  initial,
  withNames,
  onSaved,
}: {
  api: string;
  initial: Props["initialTexts"];
  /** Packages 3-4: also edit the named-invitation wording. */
  withNames: boolean;
  onSaved: () => void;
}) {
  const [generalText, setGeneralText] = useState(initial.generalText);
  const [personalText, setPersonalText] = useState(initial.personalText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = (token: string) =>
    setPersonalText((t) => `${t.trimEnd()} ${token}`);

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
      setError(
        body.error === "name_placeholder_missing"
          ? "لازم الصيغة يكون فيها {name}"
          : "الكلام فاضي أو طويل أوي",
      );
    }
  };

  return (
    <form className={styles.panel} onSubmit={save} id="texts">
      <h2>صيغة الدعوة</h2>
      <label className={styles.field}>
        <span>
          {withNames
            ? "الدعوة العامة (من غير اسم)"
            : "الجملة اللي في أول الدعوة"}
        </span>
        <input
          className={styles.input}
          value={generalText}
          maxLength={200}
          onChange={(e) => setGeneralText(e.target.value)}
        />
      </label>
      {withNames && (
        <>
          <label className={styles.field}>
            <span>الدعوة بالاسم</span>
            <input
              className={styles.input}
              value={personalText}
              maxLength={200}
              onChange={(e) => setPersonalText(e.target.value)}
            />
          </label>
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.chip}
              onClick={() => insert("{title}")}
            >
              + اللقب
            </button>
            <button
              type="button"
              className={styles.chip}
              onClick={() => insert("{name}")}
            >
              + الاسم
            </button>
            <button
              type="button"
              className={styles.chip}
              onClick={() =>
                setPersonalText(
                  "تشرفنا بحضورك أنت والأسرة الكريمة يا {title} {name}",
                )
              }
            >
              صيغة &quot;أنت والأسرة الكريمة&quot;
            </button>
          </div>
          <p className={styles.preview}>
            <span>معاينة:</span>{" "}
            {fillPersonalText(personalText, { title: "أستاذ", name: "أحمد" })}
          </p>
        </>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.primary} disabled={busy}>
        حفظ الصيغة
      </button>
    </form>
  );
}

function AddGuestForm({
  onAdd,
  existingKeys,
}: {
  onAdd: (g: ParsedGuest) => Promise<void>;
  existingKeys: Set<string>;
}) {
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const g = validateGuest({ title, name, phone, message });
    if (g.error) {
      setError(
        g.error === "phone_invalid"
          ? "الرقم مش صحيح"
          : g.error === "message_too_long"
            ? "الرسالة طويلة (300 حرف بحد أقصى)"
            : "اكتب الاسم",
      );
      return;
    }
    if (existingKeys.has(guestKey(g))) {
      setError("الضيف ده متضاف قبل كده");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd(g);
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      setError("حصلت مشكلة، جرب تاني");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.panel} onSubmit={submit}>
      <h2>إضافة ضيف</h2>
      <div className={styles.addRow}>
        <input
          className={styles.input}
          list="titles"
          placeholder="اللقب"
          value={title}
          maxLength={30}
          onChange={(e) => setTitle(e.target.value)}
        />
        <datalist id="titles">
          {TITLES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <input
          className={styles.input}
          placeholder="الاسم"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={styles.input}
          placeholder="رقم الموبايل (اختياري)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          dir="ltr"
        />
        <button type="submit" className={styles.primary} disabled={busy}>
          إضافة
        </button>
      </div>
      <textarea
        className={styles.input}
        rows={2}
        maxLength={MAX_GUEST_MESSAGE}
        placeholder="رسالة خاصة ليه (اختياري): هتظهر في دعوته هو بس"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

/** A guest's personal message: shown under their name, editable in place. */
function GuestMessage({
  api,
  guest,
  onSaved,
}: {
  api: string;
  guest: GuestWithStatus;
  onSaved: (msg: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(guest.message ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(value: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${api}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, message: value }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      await onSaved(value.trim() || null);
    } catch {
      setError("ماتحفظتش، جرب تاني");
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <span className={styles.guestMessage}>
        {guest.message && <em>✉ {guest.message}</em>}
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => {
            setText(guest.message ?? "");
            setEditing(true);
          }}
        >
          {guest.message ? "تعديل الرسالة" : "+ رسالة خاصة"}
        </button>
      </span>
    );
  }
  return (
    <span className={styles.guestMessage}>
      <textarea
        className={styles.input}
        rows={2}
        maxLength={MAX_GUEST_MESSAGE}
        value={text}
        autoFocus
        placeholder="هتظهر في دعوته هو بس"
        onChange={(e) => setText(e.target.value)}
      />
      <span className={styles.inlineActions}>
        <button
          type="button"
          className={styles.primary}
          disabled={busy}
          onClick={() => save(text)}
        >
          حفظ
        </button>
        {guest.message && (
          <button
            type="button"
            className={styles.secondary}
            disabled={busy}
            onClick={() => save("")}
          >
            شيل الرسالة
          </button>
        )}
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => setEditing(false)}
        >
          إلغاء
        </button>
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </span>
  );
}
