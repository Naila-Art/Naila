"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock3,
  Copy,
  Download,
  Eye,
  ExternalLink,
  Heart,
  Link2,
  Lock,
  Mail,
  MailOpen,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Quote,
  Receipt,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import s from "./studio.module.css";
import GuestImport from "./GuestImport";
import { CopyField, StudioShell } from "./Studio";
import { MAX_GUEST_MESSAGE, guestKey, toCsv, validateGuest, type ParsedGuest } from "@/lib/guests";
import { displayName } from "@/lib/text";
import type { GuestWithStatus, Rsvp, RsvpStatus, Wish } from "@/lib/types";

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
  /** The site's wordmark for the top bar. */
  brand: string;
  /** The event date, already formatted for people (Arabic, Cairo time). */
  dateLabel?: string;
  venue?: string;
  /** The design's poster, used as the blurred backdrop. */
  photo?: string;
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

const TITLES = ["أستاذ", "أستاذة", "دكتور", "دكتورة", "مهندس", "مهندسة", "الحاج", "الحاجة"];

type Filter = "all" | "opened" | "notOpened";

const RSVP_TONES: Record<RsvpStatus, { label: string; cls: string; icon: LucideIcon; color: string }> = {
  attending: { label: "جاي", cls: s.toneOk, icon: CircleCheck, color: "#2e6b45" },
  maybe: { label: "يمكن", cls: s.toneMaybe, icon: CircleHelp, color: "#b7793f" },
  declined: { label: "مش جاي", cls: s.toneBad, icon: CircleX, color: "#9a3b2a" },
};

function statusOf(g: GuestWithStatus): { label: string; cls: string; icon: LucideIcon } {
  if (g.rsvp === "attending") return { ...RSVP_TONES.attending, label: `جاي${(g.rsvpCount ?? 1) > 1 ? ` (${g.rsvpCount})` : ""}` };
  if (g.rsvp === "maybe") return { ...RSVP_TONES.maybe, label: "يمكن ييجي" };
  if (g.rsvp === "declined") return RSVP_TONES.declined;
  if (g.openedAt) return { label: "فتح الدعوة", cls: s.toneInfo, icon: MailOpen };
  return { label: "لسه مفتحش", cls: s.toneMuted, icon: Clock3 };
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const initialOf = (g: GuestWithStatus) => (g.name.trim()[0] ?? "؟").toUpperCase();

export default function ManageEvent({
  manageToken,
  slug,
  couple,
  brand,
  dateLabel,
  venue,
  photo,
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
  const previewFor = (g: GuestWithStatus) => `${previewBase}?guest=${encodeURIComponent(g.id)}`;
  const existingKeys = useMemo(() => new Set(data.guests.map(guestKey)), [data.guests]);

  // ---- stats ----
  const stats = useMemo(() => {
    const g = data.guests;
    const rsvps = data.rsvps ?? [];
    return {
      total: g.length,
      opened: g.filter((x) => x.openedAt).length,
      wishes: data.wishes.length,
      // People expected = everyone the "coming" replies said they're bringing, themselves included.
      people: rsvps.filter((r) => r.status === "attending").reduce((n, r) => n + (r.count ?? 1), 0),
      attending: rsvps.filter((r) => r.status === "attending").length,
      maybe: rsvps.filter((r) => r.status === "maybe").length,
      declined: rsvps.filter((r) => r.status === "declined").length,
    };
  }, [data]);

  // ---- guests ----
  const saveGuests = async (guests: ParsedGuest[]) => {
    const res = await fetch(`${api}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guests: guests.map(({ title, name, phone, message }) => ({ title, name, phone, message })),
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const r = (await res.json()) as { added: number; duplicates: number; invalid: number; overLimit?: number };
    setToast(r.overLimit ? `اتضاف ${r.added} ضيف، و${r.overLimit} فوق الحد بتاع باقتك (${namesLimit})` : `اتضاف ${r.added} ضيف`);
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
    const q = query.trim();
    return !q || displayName(g).includes(q) || (g.phone ?? "").includes(q);
  });

  const copyAll = async () => {
    const text = data.guests.map((g) => `${displayName(g)}: ${linkFor(g)}`).join("\n");
    setToast((await copy(text)) ? `اتنسخت ${data.guests.length} لينك` : "مقدرناش ننسخ");
  };

  const exportCsv = () => {
    const csv = toCsv([
      ["اللقب", "الاسم", "رقم الموبايل", "رسالة خاصة", "اللينك", "الحالة"],
      ...data.guests.map((g) => [g.title, g.name, g.phone, g.message, linkFor(g), statusOf(g).label]),
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `لينكات-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasGuests = namesLimit > 0;
  const rsvpTotal = stats.attending + stats.maybe + stats.declined;

  const dock = (
    <>
      <a className={`${s.dockLink} ${s.dockLinkSolid}`} href={locked ? previewBase : generalLink} target="_blank" rel="noopener noreferrer">
        {locked ? <Eye size={15} aria-hidden="true" /> : <ExternalLink size={15} aria-hidden="true" />}
        {locked ? "المعاينة" : "الدعوة"}
      </a>
      {hasGuests && (
        <a className={s.dockLink} href="#guests">
          <Users size={15} aria-hidden="true" /> الضيوف
        </a>
      )}
      {showRsvp && (
        <a className={s.dockLink} href="#rsvps">
          <CalendarCheck size={15} aria-hidden="true" /> الحضور
        </a>
      )}
      {showWishes && (
        <a className={s.dockLink} href="#wishes">
          <Heart size={15} aria-hidden="true" /> التهاني
        </a>
      )}
      {orderUrl && (
        <a className={s.dockLink} href={orderUrl}>
          <Receipt size={15} aria-hidden="true" /> طلبي
        </a>
      )}
    </>
  );

  return (
    <StudioShell photo={photo} brand={brand} dock={dock}>
      <main className={s.dash}>
        <section className={s.hero} aria-labelledby="couple-title">
          <div>
            <p className={s.eyebrow}>
              صفحتك
            </p>
            <h1 id="couple-title" className={s.heroTitle}>
              <bdi>{couple}</bdi>
            </h1>
            {(dateLabel || venue) && (
              <p className={s.subtitle}>
                {dateLabel && (
                  <span>
                    <CalendarDays size={14} aria-hidden="true" /> {dateLabel}
                  </span>
                )}
                {venue && (
                  <span>
                    <MapPin size={14} aria-hidden="true" /> <bdi>{venue}</bdi>
                  </span>
                )}
              </p>
            )}
          </div>

          <div className={s.heroSide}>
            <div className={s.stats}>
              {showRsvp && <Stat icon={Users} label="فرد جايين" value={stats.people} />}
              {hasGuests && <Stat icon={UserRound} label="ضيف بالاسم" value={stats.total} />}
              {hasGuests && <Stat icon={MailOpen} label="فتحوا الدعوة" value={stats.opened} />}
              {showWishes && <Stat icon={Heart} label="تهنئة" value={stats.wishes} />}
            </div>
            <div className={s.heroLink}>
              <span className={s.heroLinkLabel}>اللينك العام · لينك واحد لأي حد، من غير اسم</span>
              {locked ? (
                <p className={s.lockedNote}>
                  <Lock size={15} aria-hidden="true" /> لينك الدعوة بيتفتح بعد الدفع. لحد كده تقدر تشوف المعاينة بس.
                </p>
              ) : (
                <CopyField value={generalLink} icon={Link2} dark onCopied={(ok) => setToast(ok ? "اتنسخ" : "مقدرناش ننسخ")} />
              )}
            </div>
          </div>
        </section>

        {children}

        <div className={s.dashGrid} data-guests={hasGuests}>
          {hasGuests && (
            <section className={`${s.card} ${s.section}`} id="guests" aria-labelledby="guests-title">
              <div className={s.cardHead}>
                <h2 id="guests-title" className={s.cardTitle}>
                  <Users size={22} strokeWidth={1.5} aria-hidden="true" /> ضيوفك
                  <span className={s.count}>{namesLimit <= 500 ? `${data.guests.length} / ${namesLimit}` : data.guests.length}</span>
                </h2>
                {data.guests.length > 0 && !locked && (
                  <div className={s.actions}>
                    <button type="button" className={`${s.ghost} ${s.small}`} onClick={copyAll}>
                      <Copy size={15} aria-hidden="true" /> نسخ كل اللينكات
                    </button>
                    <button type="button" className={`${s.ghost} ${s.small}`} onClick={exportCsv}>
                      <Download size={15} aria-hidden="true" /> تصدير Excel
                    </button>
                  </div>
                )}
              </div>
              <p className={s.lead}>كل ضيف ليه لينك باسمه، وتقدر تكتبله رسالة خاصة تظهر في دعوته هو بس.</p>

              <AddGuestForm onAdd={(g) => saveGuests([g])} existingKeys={existingKeys} />
              <GuestImport existingKeys={existingKeys} onSave={saveGuests} />

              {locked && data.guests.length > 0 && (
                <p className={s.note}>
                  <Lock size={16} aria-hidden="true" /> لينكات الضيوف ونسخها وتصديرها بيتفتحوا بعد الدفع. تقدر تشوف معاينة أي ضيف.
                </p>
              )}

              {data.guests.length === 0 ? (
                <div className={s.empty}>
                  <span className={s.emptyIcon} aria-hidden="true">
                    <UserPlus size={22} strokeWidth={1.5} />
                  </span>
                  <strong>لسه مفيش ضيوف بالاسم</strong>
                  ضيف بإيدك أو ارفع شيت Excel.
                </div>
              ) : (
                <>
                  <div className={s.toolbar}>
                    <div className={s.inputWrap}>
                      <Search size={16} aria-hidden="true" />
                      <input
                        className={s.input}
                        type="search"
                        placeholder="بحث بالاسم أو الرقم"
                        aria-label="بحث بالاسم أو الرقم"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className={s.tabs} role="group" aria-label="فلترة الضيوف">
                      {(
                        [
                          ["all", "الكل", stats.total],
                          ["opened", "فتحوا", stats.opened],
                          ["notOpened", "لسه", stats.total - stats.opened],
                        ] as const
                      ).map(([id, label, n]) => (
                        <button key={id} type="button" className={s.tab} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                          {label} <span className={s.tabCount}>{n}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <ul className={s.guestList}>
                    {visible.map((g) => {
                      const st = statusOf(g);
                      const StIcon = st.icon;
                      return (
                        <li key={g.id} className={s.guest}>
                          <span className={s.avatar} aria-hidden="true">
                            {initialOf(g)}
                          </span>
                          <div className={s.guestMain}>
                            <span className={s.guestName} dir="auto">
                              {displayName(g)}
                            </span>
                            {g.phone && (
                              <span dir="ltr" className={s.phone}>
                                {g.phone}
                              </span>
                            )}
                            <GuestMessage
                              api={api}
                              guest={g}
                              onSaved={async (msg) => {
                                setToast(msg ? "الرسالة اتحفظت" : "الرسالة اتشالت");
                                await refresh();
                              }}
                            />
                          </div>
                          <span className={`${s.badge} ${st.cls} ${s.guestStatus}`}>
                            <StIcon size={12} strokeWidth={2} aria-hidden="true" /> {st.label}
                          </span>
                          <div className={s.guestActions}>
                            {locked ? (
                              <a className={`${s.ghost} ${s.small}`} href={previewFor(g)} target="_blank" rel="noopener noreferrer">
                                <Eye size={15} aria-hidden="true" /> معاينة
                              </a>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={`${s.ghost} ${s.small}`}
                                  onClick={async () => setToast((await copy(linkFor(g))) ? "اتنسخ اللينك" : "مقدرناش ننسخ")}
                                >
                                  <Copy size={15} aria-hidden="true" /> نسخ اللينك
                                </button>
                                <a className={s.iconBtn} href={linkFor(g)} target="_blank" rel="noopener noreferrer" aria-label="فتح الدعوة">
                                  <ExternalLink size={15} aria-hidden="true" />
                                </a>
                              </>
                            )}
                            <button type="button" className={`${s.iconBtn} ${s.iconBtnDanger}`} onClick={() => removeGuest(g)} aria-label={`مسح ${displayName(g)}`}>
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                    {visible.length === 0 && (
                      <li className={s.empty}>
                        <span className={s.emptyIcon} aria-hidden="true">
                          <Search size={20} strokeWidth={1.5} />
                        </span>
                        مفيش نتايج
                      </li>
                    )}
                  </ul>
                </>
              )}
            </section>
          )}

          <div className={s.sideStack}>
            {showRsvp && (
              <section className={`${s.card} ${s.section}`} id="rsvps" aria-labelledby="rsvps-title">
                <h2 id="rsvps-title" className={s.cardTitle}>
                  <CalendarCheck size={22} strokeWidth={1.5} aria-hidden="true" /> الحضور
                  <span className={s.count}>{rsvpTotal} رد</span>
                </h2>
                <div className={s.rsvpLegend}>
                  {(["attending", "maybe", "declined"] as const).map((k) => (
                    <div key={k}>
                      <strong>{k === "attending" ? stats.attending : k === "maybe" ? stats.maybe : stats.declined}</strong>
                      <span>
                        <span className={s.dot} style={{ background: RSVP_TONES[k].color }} aria-hidden="true" />
                        {k === "attending" ? "جايين" : k === "maybe" ? "يمكن" : "مش جايين"}
                      </span>
                    </div>
                  ))}
                </div>
                {rsvpTotal > 0 && (
                  <div className={s.rsvpBar} aria-hidden="true">
                    <span style={{ width: `${(stats.attending / rsvpTotal) * 100}%`, background: RSVP_TONES.attending.color }} />
                    <span style={{ width: `${(stats.maybe / rsvpTotal) * 100}%`, background: RSVP_TONES.maybe.color }} />
                    <span style={{ width: `${(stats.declined / rsvpTotal) * 100}%`, background: RSVP_TONES.declined.color }} />
                  </div>
                )}
                <p className={s.hint}>
                  <Users size={14} aria-hidden="true" /> {stats.people} فرد جايين من {stats.attending} رد
                </p>
                {rsvpTotal === 0 ? (
                  <div className={s.empty}>
                    <span className={s.emptyIcon} aria-hidden="true">
                      <CalendarCheck size={20} strokeWidth={1.5} />
                    </span>
                    لسه محدش رد.
                  </div>
                ) : (
                  <ul className={s.replyList}>
                    {data.rsvps.map((r) => {
                      const tone = RSVP_TONES[r.status];
                      const TIcon = tone.icon;
                      return (
                        <li key={`${r.guestId ?? r.name}-${r.createdAt}`} className={s.reply}>
                          <div className={s.replyHead}>
                            <bdi>{r.name}</bdi>
                            <span className={`${s.badge} ${tone.cls}`}>
                              <TIcon size={12} strokeWidth={2} aria-hidden="true" />
                              {tone.label}
                              {r.status !== "declined" && (r.count ?? 1) > 1 ? ` · ${r.count} أفراد` : ""}
                            </span>
                          </div>
                          {r.note && <p dir="auto">{r.note}</p>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {showWishes && (
              <section className={`${s.card} ${s.section}`} id="wishes" aria-labelledby="wishes-title">
                <h2 id="wishes-title" className={s.cardTitle}>
                  <Heart size={22} strokeWidth={1.5} aria-hidden="true" /> التهاني
                  <span className={s.count}>{data.wishes.length}</span>
                </h2>
                {data.wishes.length === 0 ? (
                  <div className={s.empty}>
                    <span className={s.emptyIcon} aria-hidden="true">
                      <Heart size={20} strokeWidth={1.5} />
                    </span>
                    لسه مفيش تهاني.
                  </div>
                ) : (
                  <ul className={s.wishList}>
                    {data.wishes.map((w) => (
                      <li key={w.id} className={s.wish}>
                        <Quote size={18} aria-hidden="true" />
                        <p dir="auto">{w.body}</p>
                        <footer>
                          <bdi>{w.name}</bdi>
                        </footer>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className={s.toast} role="status">
          <Check size={15} aria-hidden="true" /> {toast}
        </div>
      )}
    </StudioShell>
  );
}

function Stat({ icon: StatIcon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className={s.stat}>
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>
        <StatIcon size={13} aria-hidden="true" /> {label}
      </span>
    </div>
  );
}

function AddGuestForm({ onAdd, existingKeys }: { onAdd: (g: ParsedGuest) => Promise<void>; existingKeys: Set<string> }) {
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
      setError(g.error === "phone_invalid" ? "الرقم مش صحيح" : g.error === "message_too_long" ? "الرسالة طويلة (300 حرف بحد أقصى)" : "اكتب الاسم");
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
    <form className={s.addGuest} onSubmit={submit}>
      <span className={s.addGuestTitle}>
        <UserPlus size={16} aria-hidden="true" /> إضافة ضيف
      </span>
      <div className={s.addRow}>
        <input
          className={s.input}
          list="titles"
          placeholder="اللقب (اختياري)"
          aria-label="اللقب"
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
        <div className={s.inputWrap}>
          <UserRound size={16} aria-hidden="true" />
          <input
            className={s.input}
            placeholder="الاسم"
            aria-label="الاسم"
            dir="auto"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={s.inputWrap}>
          <Phone size={16} aria-hidden="true" />
          <input
            className={s.input}
            placeholder="رقم الموبايل (اختياري)"
            aria-label="رقم الموبايل"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
          />
        </div>
        <button type="submit" className={s.cta} disabled={busy}>
          <Plus size={16} aria-hidden="true" /> إضافة
        </button>
      </div>
      <div className={s.inputWrap}>
        <Mail size={16} aria-hidden="true" style={{ alignSelf: "flex-start", marginTop: "0.95rem" }} />
        <textarea
          className={s.input}
          rows={2}
          maxLength={MAX_GUEST_MESSAGE}
          aria-label="رسالة خاصة"
          placeholder="رسالة خاصة ليه (اختياري): هتظهر في دعوته هو بس"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && (
        <p className={s.error}>
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}
    </form>
  );
}

/** A guest's personal message: shown under their name, editable in place. */
function GuestMessage({ api, guest, onSaved }: { api: string; guest: GuestWithStatus; onSaved: (msg: string | null) => Promise<void> }) {
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
      <span className={s.guestMessage}>
        {guest.message && (
          <em dir="auto">
            <Mail size={14} aria-hidden="true" /> {guest.message}
          </em>
        )}
        <button
          type="button"
          className={s.quiet}
          style={{ minHeight: "1.9rem", paddingInline: "0.5rem", marginInlineStart: "-0.5rem" }}
          onClick={() => {
            setText(guest.message ?? "");
            setEditing(true);
          }}
        >
          {guest.message ? <Pencil size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          {guest.message ? "تعديل الرسالة" : "رسالة خاصة"}
        </button>
      </span>
    );
  }
  return (
    <span className={s.guestMessage}>
      <textarea
        className={s.input}
        rows={2}
        maxLength={MAX_GUEST_MESSAGE}
        value={text}
        autoFocus
        aria-label={`رسالة خاصة لـ ${displayName(guest)}`}
        placeholder="هتظهر في دعوته هو بس"
        onChange={(e) => setText(e.target.value)}
      />
      <span className={s.actions}>
        <button type="button" className={`${s.cta} ${s.small}`} disabled={busy} onClick={() => save(text)}>
          <Check size={14} aria-hidden="true" /> حفظ
        </button>
        {guest.message && (
          <button type="button" className={`${s.ghost} ${s.small}`} disabled={busy} onClick={() => save("")}>
            <Trash2 size={14} aria-hidden="true" /> شيل الرسالة
          </button>
        )}
        <button type="button" className={s.quiet} onClick={() => setEditing(false)}>
          إلغاء
        </button>
      </span>
      {error && (
        <span className={s.error}>
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </span>
      )}
    </span>
  );
}
