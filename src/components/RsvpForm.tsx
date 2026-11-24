"use client";

import { useState, type FormEvent } from "react";
import baseStyles from "./invitation.module.css";
import type { Strings } from "@/lib/i18n";
import type { RsvpStatus } from "@/lib/types";

interface Props {
  slug: string;
  token?: string;
  strings: Strings;
  /** Class overrides from a layout family's stylesheet. */
  ui?: Partial<Record<string, string>>;
}

const MAX_PARTY = 20;

/** Attendance reply: coming / maybe / not coming, how many people, and an optional note to the hosts. */
export default function RsvpForm({ slug, token, strings: s, ui }: Props) {
  const styles = { ...baseStyles, ...ui } as Record<string, string>;
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [count, setCount] = useState(1);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<RsvpStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!status) return;
    // General links don't know the guest, so ask for a name.
    if (!token && !name.trim()) return setError(s.nameRequired);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: token ? undefined : name,
          status,
          count: status === "declined" ? undefined : count,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(status);
    } catch {
      setError(s.error);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.formDone}>
        <p>{sent === "attending" ? s.rsvpThanksAttending : sent === "maybe" ? s.rsvpThanksMaybe : s.rsvpThanksDeclined}</p>
        {/* Named guests can change their answer; general replies are one-off entries. */}
        {token && (
          <button type="button" className={styles.textButton} onClick={() => setSent(null)}>
            {s.change}
          </button>
        )}
      </div>
    );
  }

  const options: { id: RsvpStatus; label: string }[] = [
    { id: "attending", label: s.attending },
    { id: "maybe", label: s.maybe },
    { id: "declined", label: s.declined },
  ];

  return (
    <form className={styles.form} onSubmit={submit}>
      {!token && (
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={s.yourName}
          maxLength={80}
          autoComplete="name"
        />
      )}
      <div className={styles.rsvpButtons} role="radiogroup" aria-label={s.rsvpTitle}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={status === o.id}
            className={styles.rsvpChoice}
            onClick={() => setStatus(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {status && status !== "declined" && (
        <div className={styles.partyRow}>
          <span>{s.partySize}</span>
          <div className={styles.stepper}>
            <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} aria-label="-">
              −
            </button>
            <output aria-live="polite">{count}</output>
            <button type="button" onClick={() => setCount((c) => Math.min(MAX_PARTY, c + 1))} disabled={count >= MAX_PARTY} aria-label="+">
              +
            </button>
          </div>
        </div>
      )}

      {status && (
        <>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={s.rsvpNote}
            maxLength={200}
            rows={2}
          />
          <button type="submit" className={styles.primaryButton} disabled={busy}>
            {s.send}
          </button>
        </>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
