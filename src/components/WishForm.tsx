"use client";

import { useState, type FormEvent } from "react";
import styles from "./invitation.module.css";
import type { Strings } from "@/lib/i18n";

interface Props {
  slug: string;
  token?: string;
  strings: Strings;
}

export default function WishForm({ slug, token, strings: s }: Props) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!token && !name.trim()) {
      setError(s.nameRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/wishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: token ? undefined : name, body }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
      setBody("");
    } catch {
      setError(s.error);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.formDone}>
        <p>{s.wishThanks}</p>
      </div>
    );
  }

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
      <textarea
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={s.wishPlaceholder}
        maxLength={500}
        rows={3}
      />
      <button type="submit" className={styles.primaryButton} disabled={busy || !body.trim()}>
        {s.send}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
