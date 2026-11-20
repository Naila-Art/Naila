"use client";

import { useState, type FormEvent } from "react";
import styles from "./store.module.css";
import { DETAIL_ERRORS } from "./Builder";
import DateTimePicker from "../DateTimePicker";
import { formatEgp, type PackageInfo } from "@/lib/pricing";
import { CATEGORY_LABELS, type Category, type PackageId } from "@/lib/types";
import { UploadError, postJson } from "@/lib/upload-client";

/** Packages 3-4: the client leaves a brief and we follow up on WhatsApp. */
export default function RequestForm({ pkg, whatsappUrl }: { pkg: PackageInfo; whatsappUrl: string }) {
  const packageId: PackageId = pkg.id;
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [category, setCategory] = useState<Category>("wedding");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await postJson("/api/requests", { packageId, clientName, clientPhone, category, date, notes });
      setSent(true);
    } catch (err) {
      setError(DETAIL_ERRORS[err instanceof UploadError ? err.code : "failed"] ?? DETAIL_ERRORS.failed);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className={`${styles.card} ${styles.success}`} role="status">
        <h2 style={{ justifyContent: "center" }}>وصلنا طلبك 🤍</h2>
        <p>هنكلمك على واتساب على {clientPhone} في أقرب وقت.</p>
        {whatsappUrl && (
          <a className={styles.cta} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            أو كلمنا دلوقتي على واتساب
          </a>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} style={{ paddingBottom: 40 }}>
      <section className={styles.card}>
        <h2>
          باقة {pkg.name} · {pkg.priceNote ? `${pkg.priceNote} ` : ""}
          {formatEgp(pkg.price)}
        </h2>
        <ul className={styles.hint}>
          {pkg.points.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>اسمك</span>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={60} required />
          </label>
          <label className={styles.field}>
            <span>رقم الواتساب</span>
            <input type="tel" dir="ltr" inputMode="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required placeholder="01xxxxxxxxx" />
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>المناسبة</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.field}>
            <span>التاريخ (لو محدد)</span>
            <DateTimePicker dateOnly value={date} onChange={setDate} />
          </div>
        </div>
        <label className={styles.field}>
          <span>احكيلنا عايز إيه</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            placeholder="الألوان، الستايل، لينكات ريفرنسات من بنترست أو إنستجرام..."
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button className={styles.cta} type="submit" disabled={busy}>
          {busy ? "ثانية..." : "ابعت الطلب"}
        </button>
      </section>
    </form>
  );
}
