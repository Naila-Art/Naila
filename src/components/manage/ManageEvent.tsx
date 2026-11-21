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
import { displayName } from "@/lib/text";
import type { GuestWithStatus, Rsvp, RsvpStatus, Wish } from "@/lib/types";
import Icon from "../Icon";

export interface Dashboard {
  guests: GuestWithStatus[];
  generalOpens: number;
  wishes: Wish[];
  rsvps: Rsvp[];
}

interface Props {
  manageToken: string;
  slug: string;
  couple: string;
  initial: Dashboard;
  /** Max named guests from the client's package; 0 = general link only. */
  namesLimit: number;
  /** Not paid yet: no shareable links (general, per guest, copy-all, export); previews only. */
  locked: boolean;
  /** The client's order page (receipt, payment, change requests to us). */
  orderUrl?: string;
  showWishes: boolean;
  /** Attendance replies are on for this invitation. */
  showRsvp?: boolean;
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

const RSVP_LABELS: Record<RsvpStatus, string> = { attending: "جاي", maybe: "يمكن", declined: "مش جاي" };

function statusOf(g: GuestWithStatus): { label: string; cls: string } {
  if (g.rsvp === "attending") return { label: `جاي${(g.rsvpCount ?? 1) > 1 ? ` (${g.rsvpCount})` : ""}`, cls: styles.badgeOk };
  if (g.rsvp === "maybe") return { label: "يمكن ييجي", cls: styles.badgeInfo };
  if (g.rsvp === "declined") return { label: "مش جاي", cls: styles.badgeBad };
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
  initial,
  namesLimit,
  showWishes,
  showRsvp = false,
  locked,
  orderUrl,
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
      // People expected = everyone the "coming" replies said they're bringing, themselves included.
      people: (data.rsvps ?? []).filter((r) => r.status === "attending").reduce((n, r) => n + (r.count ?? 1), 0),
      attending: (data.rsvps ?? []).filter((r) => r.status === "attending").length,
      maybe: (data.rsvps ?? []).filter((r) => r.status === "maybe").length,
      declined: (data.rsvps ?? []).filter((r) => r.status === "declined").length,
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
            {locked ? "المعاينة" : "الدعوة"}
          </a>
          {orderUrl && <a href={orderUrl}>طلبي</a>}
          {namesLimit > 0 && <a href="#guests">الضيوف</a>}
          {showRsvp && <a href="#rsvps">الحضور</a>}
          {showWishes && <a href="#wishes">التهاني</a>}
        </div>
      </nav>

      <div className={styles.layout}>
        <aside className={styles.sideCol}>
          {children}
        </aside>

        <div className={styles.mainCol}>
          <section className={styles.stats}>
            {showRsvp && <Stat label="فرد جايين" value={stats.people} />}
            {namesLimit > 0 && <Stat label="ضيف بالاسم" value={stats.total} />}
            {namesLimit > 0 && <Stat label="فتحوا الدعوة" value={stats.opened} />}
            {showWishes && <Stat label="تهاني" value={stats.wishes} />}
          </section>

          <section className={styles.panel}>
            <h2>اللينك العام</h2>
            {locked ? (
              <p className={styles.locked}>
                لينك الدعوة بيتفتح بعد الدفع. لحد كده تقدر تشوف المعاينة بس.
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
                    لينكات الضيوف ونسخها وتصديرها بيتفتحوا بعد الدفع. تقدر
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
                                  <Icon name="eye" size={16} /> معاينة
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
                                    <Icon name="external" size={16} />
                                  </a>
                                </>
                              )}
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => removeGuest(g)}
                                aria-label="مسح"
                              >
                                <Icon name="x" />
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
        ) : null}

          {showRsvp && (
            <section className={styles.panel} id="rsvps">
              <h2>الحضور ({data.rsvps?.length ?? 0} رد)</h2>
              <p className={styles.hint}>
                {stats.people} فرد جايين من {stats.attending} رد · {stats.maybe} يمكن · {stats.declined} مش جايين
              </p>
              {(data.rsvps ?? []).length === 0 ? (
                <p className={styles.empty}>لسه محدش رد.</p>
              ) : (
                <ul className={styles.wishes}>
                  {data.rsvps.map((r) => (
                    <li key={`${r.guestId ?? r.name}-${r.createdAt}`}>
                      <strong>{r.name}</strong>{" "}
                      <span
                        className={`${styles.badge} ${r.status === "attending" ? styles.badgeOk : r.status === "maybe" ? styles.badgeInfo : styles.badgeBad}`}
                      >
                        {RSVP_LABELS[r.status]}
                        {r.status !== "declined" && (r.count ?? 1) > 1 ? ` · ${r.count} أفراد` : ""}
                      </span>
                      {r.note && <p>{r.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
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
          placeholder="اللقب (اختياري)"
          autoComplete="off"
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
        {guest.message && (
          <em>
            <Icon name="mail" size={14} /> {guest.message}
          </em>
        )}
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
