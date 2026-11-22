"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Lang } from "@/lib/types";
import styles from "./store.module.css";

/* ============================================================================
   1. EDITORIAL SELECT — Custom Luxury Hairline Dropdown Menu
   ============================================================================ */

export interface EditorialSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface EditorialSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: EditorialSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  icon?: ReactNode;
  dir?: "ltr" | "rtl";
}

export function EditorialSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  ariaLabel,
  icon,
  dir = "ltr",
}: EditorialSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Smoothly scroll selected item into view when menu opens
  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(
      '[aria-selected="true"]'
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={styles.editorialControlWrap}
      data-open={open ? "true" : "false"}
      dir={dir}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${styles.editorialTrigger} ${
          open ? styles.editorialTriggerOpen : ""
        }`}
      >
        <span className={styles.editorialTriggerLead}>
          {icon && <span className={styles.editorialTriggerIcon}>{icon}</span>}
          <span
            className={`${styles.editorialTriggerValue} ${
              !selected ? styles.editorialTriggerPlaceholder : ""
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.6}
          aria-hidden="true"
          className={`${styles.editorialChevron} ${
            open ? styles.editorialChevronOpen : ""
          }`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className={styles.editorialPopover}
        >
          <div className={styles.editorialOptionList}>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`${styles.editorialOption} ${
                    active ? styles.editorialOptionActive : ""
                  }`}
                >
                  <span className={styles.editorialOptionText}>
                    <span className={styles.editorialOptionLabel}>
                      {opt.label}
                    </span>
                    {opt.sublabel && (
                      <span className={styles.editorialOptionSub}>
                        {opt.sublabel}
                      </span>
                    )}
                  </span>
                  {active && (
                    <Check
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={styles.editorialOptionCheck}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   2. EDITORIAL DATE PICKER — Custom Luxury Stationery Calendar Sheet (EN / AR)
   ============================================================================ */

const MONTHS_BY_LANG: Record<Lang, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
};

const WEEKDAYS_BY_LANG: Record<Lang, string[]> = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  ar: ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"],
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseYmd(str: string): { y: number; m: number; d: number } | null {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function formatEditorialDate(ymd: string, locale: Lang): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return "";
  const dt = new Date(parsed.y, parsed.m, parsed.d);
  if (Number.isNaN(dt.getTime())) return ymd;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    month: locale === "ar" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

interface EditorialDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (ymd: string) => void;
  placeholder?: string;
  ariaLabel: string;
  clearable?: boolean;
  locale?: Lang;
}

export function EditorialDatePicker({
  value,
  onChange,
  placeholder = "Choose celebration date",
  ariaLabel,
  clearable = false,
  locale = "en",
}: EditorialDatePickerProps) {
  const now = useMemo(() => new Date(), []);
  const parsedVal = useMemo(() => parseYmd(value), [value]);
  const isAr = locale === "ar";
  const months = MONTHS_BY_LANG[locale];
  const weekdays = WEEKDAYS_BY_LANG[locale];

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    parsedVal?.y ?? now.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    parsedVal?.m ?? now.getMonth()
  );
  const [yearMode, setYearMode] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (parsedVal) {
      setViewYear(parsedVal.y);
      setViewMonth(parsedVal.m);
    }
  }, [parsedVal]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setYearMode(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setYearMode(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stepMonth = (delta: -1 | 1) => {
    let nextM = viewMonth + delta;
    let nextY = viewYear;
    if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    } else if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    setViewMonth(nextM);
    setViewYear(nextY);
  };

  const days = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const years = useMemo(() => {
    const base = now.getFullYear();
    return Array.from({ length: 8 }, (_, i) => base + i);
  }, [now]);

  const todayYmd = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )}`;
  const formatted = formatEditorialDate(value, locale);

  return (
    <div
      ref={rootRef}
      className={styles.editorialControlWrap}
      data-open={open ? "true" : "false"}
      dir={isAr ? "rtl" : "ltr"}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setYearMode(false);
        }}
        className={`${styles.editorialTrigger} ${
          open ? styles.editorialTriggerOpen : ""
        }`}
      >
        <span className={styles.editorialTriggerLead}>
          <span className={styles.editorialTriggerIcon}>
            <Calendar size={15} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span
            className={`${styles.editorialTriggerValue} ${
              !formatted ? styles.editorialTriggerPlaceholder : ""
            }`}
          >
            {formatted || placeholder}
          </span>
        </span>
        <span className={styles.editorialTriggerTrail}>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              aria-label={isAr ? "مسح التاريخ" : "Clear date"}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className={styles.editorialClearBtn}
            >
              <X size={12} strokeWidth={2} />
            </span>
          )}
          <ChevronDown
            size={15}
            strokeWidth={1.6}
            aria-hidden="true"
            className={`${styles.editorialChevron} ${
              open ? styles.editorialChevronOpen : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className={`${styles.editorialPopover} ${styles.calendarSheet}`}
        >
          {/* Calendar Editorial Header */}
          <div className={styles.calendarHeader}>
            <button
              type="button"
              aria-label={isAr ? "الشهر السابق" : "Previous month"}
              onClick={() => stepMonth(-1)}
              className={styles.calendarNavBtn}
            >
              {isAr ? (
                <ChevronRight size={15} strokeWidth={1.6} />
              ) : (
                <ChevronLeft size={15} strokeWidth={1.6} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setYearMode((y) => !y)}
              className={styles.calendarMonthTitle}
              title={isAr ? "تغيير السنة" : "Change year"}
            >
              <span>{months[viewMonth]}</span>
              <span className={styles.calendarYearAccent}>
                {isAr ? viewYear.toLocaleString("ar-EG", { useGrouping: false }) : viewYear}
              </span>
            </button>

            <button
              type="button"
              aria-label={isAr ? "الشهر التالي" : "Next month"}
              onClick={() => stepMonth(1)}
              className={styles.calendarNavBtn}
            >
              {isAr ? (
                <ChevronLeft size={15} strokeWidth={1.6} />
              ) : (
                <ChevronRight size={15} strokeWidth={1.6} />
              )}
            </button>
          </div>

          {yearMode ? (
            <div className={styles.calendarYearGrid}>
              {years.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setViewYear(yr);
                    setYearMode(false);
                  }}
                  className={`${styles.calendarYearCell} ${
                    yr === viewYear ? styles.calendarYearCellActive : ""
                  }`}
                >
                  {isAr ? yr.toLocaleString("ar-EG", { useGrouping: false }) : yr}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className={styles.calendarWeekRow} aria-hidden="true">
                {weekdays.map((wd) => (
                  <span key={wd} className={styles.calendarWeekLabel}>
                    {wd}
                  </span>
                ))}
              </div>

              <div className={styles.calendarDayGrid}>
                {days.map((day, i) => {
                  if (day === null) {
                    return <span key={`empty-${i}`} />;
                  }
                  const ymd = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
                  const isSelected = ymd === value;
                  const isToday = ymd === todayYmd;

                  return (
                    <button
                      key={ymd}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        onChange(ymd);
                        setOpen(false);
                      }}
                      className={`${styles.calendarDayBtn} ${
                        isSelected ? styles.calendarDaySelected : ""
                      } ${isToday && !isSelected ? styles.calendarDayToday : ""}`}
                    >
                      {isAr ? day.toLocaleString("ar-EG") : day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className={styles.calendarFooter}>
            <button
              type="button"
              onClick={() => {
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                onChange(todayYmd);
                setOpen(false);
              }}
              className={styles.calendarActionLink}
            >
              {isAr ? "اليوم" : "Today"}
            </button>
            {clearable && value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={styles.calendarActionLink}
              >
                {isAr ? "مسح" : "Clear"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
