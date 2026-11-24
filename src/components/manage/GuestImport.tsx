"use client";

import { useRef, useState } from "react";
import { Check, CircleAlert, Download, FileSpreadsheet, Mail, X } from "lucide-react";
import s from "./studio.module.css";
import { guestKey, parseCsv, parseSheet, toCsv, type ParsedGuest } from "@/lib/guests";

const ERROR_LABEL: Record<NonNullable<ParsedGuest["error"]>, string> = {
  name_missing: "الاسم فاضي",
  name_too_long: "الاسم طويل",
  title_too_long: "اللقب طويل",
  phone_invalid: "الرقم مش صحيح",
  message_too_long: "الرسالة طويلة (300 حرف بحد أقصى)",
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
      ["اللقب", "الاسم", "رقم الموبايل", "رسالة خاصة"],
      ["أستاذ", "محمود علي", "01001234567", "وجودك معانا هيفرّحنا جداً"],
      ["دكتورة", "منى حسن", "01112345678", ""],
      ["", "كريم", "", ""],
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "نموذج-الضيوف.csv";
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
    <div className={s.importBox}>
      <label className={`${s.dropzone} ${s.dropzoneCompact}`}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <span className={s.dropIcon} aria-hidden="true">
          <FileSpreadsheet size={17} />
        </span>
        <span>
          <strong>{fileName || "عندك شيت Excel؟ ارفعه مرة واحدة"}</strong>
          <small>اللقب (اختياري) · الاسم · رقم الموبايل (اختياري) · رسالة خاصة (اختياري). ملف ‎.xlsx أو ‎.csv</small>
        </span>
      </label>
      <div className={s.actions}>
        <button type="button" className={s.quiet} onClick={downloadTemplate}>
          <Download size={15} aria-hidden="true" /> تحميل نموذج الشيت
        </button>
      </div>

      {error && (
        <p className={s.error}>
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className={s.importSummary}>
            <span className={`${s.badge} ${s.toneOk}`}>
              <Check size={12} aria-hidden="true" /> {good.length} جاهزين
            </span>
            {dups.length > 0 && <span className={`${s.badge} ${s.toneMaybe}`}>{dups.length} مكرر (هيتشالوا)</span>}
            {bad.length > 0 && <span className={`${s.badge} ${s.toneBad}`}>{bad.length} فيهم مشكلة (هيتشالوا)</span>}
          </div>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>صف</th>
                  <th>اللقب</th>
                  <th>الاسم</th>
                  <th>الموبايل</th>
                  <th>رسالة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row} data-tone={r.error ? "bad" : r.duplicate ? "warn" : undefined}>
                    <td>{r.row}</td>
                    <td>{r.title}</td>
                    <td>{r.name}</td>
                    <td dir="ltr">{r.phone}</td>
                    <td>{r.message ? <Mail size={15} aria-label="فيه رسالة" /> : ""}</td>
                    <td>{r.error ? ERROR_LABEL[r.error] : r.duplicate ? "مكرر" : <Check size={15} aria-label="تمام" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={s.actions}>
            <button type="button" className={s.cta} disabled={busy || good.length === 0} onClick={save}>
              <Check size={16} aria-hidden="true" /> حفظ {good.length} ضيف
            </button>
            <button type="button" className={s.ghost} onClick={reset}>
              <X size={16} aria-hidden="true" /> إلغاء
            </button>
          </div>
        </>
      )}
    </div>
  );
}
