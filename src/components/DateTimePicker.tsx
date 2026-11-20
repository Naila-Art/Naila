"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./datetime.module.css";

/**
 * Our own date (+ time) picker: day / month / year in that order, Arabic month names, 12-hour time
 * with ص / م. Same look on every browser. Value: "YYYY-MM-DDTHH:mm" (or "YYYY-MM-DD" with dateOnly),
 * Cairo wall-clock time. Emits "" until every part is chosen.
 */
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (year: number, month: number) => new Date(Date.UTC(year || 2028, month || 1, 0)).getUTCDate();

interface Parts {
  day: number;
  month: number;
  year: number;
  hour: number; // 1-12
  minute: number;
  pm: boolean;
}

function parse(value: string): Parts {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) return { day: 0, month: 0, year: 0, hour: 0, minute: -1, pm: true };
  const h24 = m[4] ? Number(m[4]) : -1;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: h24 < 0 ? 0 : h24 % 12 === 0 ? 12 : h24 % 12,
    minute: m[5] ? Number(m[5]) : -1,
    pm: h24 < 0 ? true : h24 >= 12,
  };
}

export default function DateTimePicker({
  value,
  onChange,
  dateOnly = false,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  dateOnly?: boolean;
  label?: string;
}) {
  const [p, setP] = useState<Parts>(() => parse(value));
  const thisYear = new Date().getFullYear();
  const years = useMemo(() => [0, 1, 2, 3].map((i) => thisYear + i), [thisYear]);

  // Follow outside changes (e.g. a saved draft restored after mount).
  useEffect(() => {
    if (value) setP(parse(value));
  }, [value]);

  function update(patch: Partial<Parts>) {
    const next = { ...p, ...patch };
    const max = daysIn(next.year, next.month);
    if (next.day > max) next.day = max;
    setP(next);
    const dateReady = next.day && next.month && next.year;
    if (!dateReady) return onChange("");
    const date = `${next.year}-${pad(next.month)}-${pad(next.day)}`;
    if (dateOnly) return onChange(date);
    if (!next.hour || next.minute < 0) return onChange("");
    const h24 = (next.hour % 12) + (next.pm ? 12 : 0);
    onChange(`${date}T${pad(h24)}:${pad(next.minute)}`);
  }

  const days = Array.from({ length: daysIn(p.year, p.month) }, (_, i) => i + 1);

  return (
    <div className={styles.picker} role="group" aria-label={label ?? (dateOnly ? "التاريخ" : "التاريخ والساعة")}>
      <div className={styles.row}>
        <label className={styles.cell}>
          <span>اليوم</span>
          <select value={p.day || ""} onChange={(e) => update({ day: Number(e.target.value) })}>
            <option value="">--</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.cell} ${styles.wideCell}`}>
          <span>الشهر</span>
          <select value={p.month || ""} onChange={(e) => update({ month: Number(e.target.value) })}>
            <option value="">--</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.cell}>
          <span>السنة</span>
          <select value={p.year || ""} onChange={(e) => update({ year: Number(e.target.value) })}>
            <option value="">--</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!dateOnly && (
        <div className={styles.row}>
          <label className={styles.cell}>
            <span>الساعة</span>
            <select value={p.hour || ""} onChange={(e) => update({ hour: Number(e.target.value) })}>
              <option value="">--</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.cell}>
            <span>الدقيقة</span>
            <select value={p.minute < 0 ? "" : p.minute} onChange={(e) => update({ minute: Number(e.target.value) })}>
              <option value="">--</option>
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.cell}>
            <span>الفترة</span>
            <div className={styles.period} role="radiogroup" aria-label="صباحاً أو مساءً">
              <button type="button" role="radio" aria-checked={!p.pm} onClick={() => update({ pm: false })}>
                صباحاً
              </button>
              <button type="button" role="radio" aria-checked={p.pm} onClick={() => update({ pm: true })}>
                مساءً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
