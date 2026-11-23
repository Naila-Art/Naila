"use client";

import { useState } from "react";
import baseStyles from "./invitation.module.css";
import type { Strings } from "@/lib/i18n";
import type { RsvpStatus } from "@/lib/types";

interface Props {
  slug: string;
  token?: string;
  strings: Strings;
  initial: RsvpStatus | null;
  /** Class overrides from a layout family's stylesheet. */
  ui?: Partial<Record<string, string>>;
}

export default function RsvpForm({ slug, token, strings: s, initial, ui }: Props) {
  const styles = { ...baseStyles, ...ui } as Record<string, string>;
  const [status, setStatus] = useState<RsvpStatus | null>(initial);
  const [editing, setEditing] = useState(initial === null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (choice: RsvpStatus) => {
    // General links don't know the guest, so ask for a name.
    if (!token && !name.trim()) {
      setError(s.nameRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: token ? undefined : name, status: choice }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus(choice);
      setEditing(false);
    } catch {
      setError(s.error);
    } finally {
      setBusy(false);
    }
  };

  if (!editing && status) {
    return (
      <div className={styles.formDone}>
        <p>{status === "attending" ? s.rsvpThanksAttending : s.rsvpThanksDeclined}</p>
        {/* Named guests can change their answer; general replies are one-off entries. */}
        {token && (
          <button type="button" className={styles.textButton} onClick={() => setEditing(true)}>
            {s.change}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.form}>
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
      <div className={styles.rsvpButtons}>
        <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => submit("attending")}>
          {s.attending}
        </button>
        <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => submit("declined")}>
          {s.declined}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
