"use client";

import { useRef, useState } from "react";
import styles from "./manage.module.css";
import { guestKey, parseCsv, parseSheet, toCsv, type ParsedGuest } from "@/lib/guests";

const ERROR_LABEL: Record<NonNullable<ParsedGuest["error"]>, string> = {
  name_missing: "الاسم فاضي",
  name_too_long: "الاسم طويل",
  title_too_long: "اللقب طويل",
  phone_invalid: "الرقم مش صحيح",
};

interface Props {
  /** Keys of guests already saved, so re-uploading the same sheet doesn't duplicate them. */
  existingKeys: Set<string>;
  onSave: (guests: ParsedGuest[]) => Promise<void>;
}

export default function GuestImport({ existingKeys, onSave }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedGuest[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = () => {
    const csv = toCsv([
      ["اللقب", "الاسم", "رقم الموبايل"],
      ["أستاذ", "محمود علي", "01001234567"],
      ["دكتورة", "منى حسن", "01112345678"],
      ["", "كريم", ""],
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "نموذج-المعازيم.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    try {
      let sheet: unknown[][];
      if (/\.csv$/i.test(file.name)) {
        sheet = parseCsv(await file.text());
      } else if (/\.xlsx$/i.test(file.name)) {
        // Loaded on demand so the page stays light for clients who never upload.
        const { readSheet } = await import("read-excel-file/browser");
        sheet = (await readSheet(file)) as unknown[][];
      } else {
        setError("الملف لازم يكون Excel (‎.xlsx) أو CSV");
        return;
      }
      const parsed = parseSheet(sheet).map((g) =>
        !g.error && existingKeys.has(guestKey(g)) ? { ...g, duplicate: true } : g,
      );
      if (parsed.length === 0) setError("الملف فاضي");
      setRows(parsed);
    } catch {
      setError("مقدرناش نقرا الملف. لو ملف ‎.xls قديم، احفظه كـ ‎.xlsx وارفعه تاني");
    }
  };

  const reset = () => {
    setRows(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const good = rows?.filter((r) => !r.error && !r.duplicate) ?? [];
  const bad = rows?.filter((r) => r.error) ?? [];
  const dups = rows?.filter((r) => !r.error && r.duplicate) ?? [];

  const save = async () => {
    setBusy(true);
    try {
      await onSave(good);
      reset();
    } catch {
      setError("حصلت مشكلة في الحفظ، جرب تاني");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>رفع شيت إكسل</h2>
        <button type="button" className={styles.linkBtn} onClick={downloadTemplate}>
          تحميل نموذج
        </button>
      </div>
      <p className={styles.hint}>الأعمدة: اللقب (اختياري) · الاسم · رقم الموبايل (اختياري). أول صف ممكن يكون عناوين.</p>

      <label className={styles.dropzone}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <span>{fileName || "اختار ملف ‎.xlsx أو ‎.csv"}</span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      {rows && rows.length > 0 && (
        <>
          <div className={styles.importSummary}>
            <span className={styles.ok}>{good.length} جاهزين</span>
            {dups.length > 0 && <span className={styles.warn}>{dups.length} مكرر (هيتشالوا)</span>}
            {bad.length > 0 && <span className={styles.bad}>{bad.length} فيهم مشكلة (هيتشالوا)</span>}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>صف</th>
                  <th>اللقب</th>
                  <th>الاسم</th>
                  <th>الموبايل</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row} className={r.error ? styles.rowBad : r.duplicate ? styles.rowWarn : undefined}>
                    <td>{r.row}</td>
                    <td>{r.title}</td>
                    <td>{r.name}</td>
                    <td dir="ltr">{r.phone}</td>
                    <td>{r.error ? ERROR_LABEL[r.error] : r.duplicate ? "مكرر" : "✓"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.primary} disabled={busy || good.length === 0} onClick={save}>
              حفظ {good.length} معزوم
            </button>
            <button type="button" className={styles.secondary} onClick={reset}>
              إلغاء
            </button>
          </div>
        </>
      )}
    </div>
  );
}
