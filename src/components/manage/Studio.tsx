"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy, type LucideIcon } from "lucide-react";
import s from "./studio.module.css";
import type { Order } from "@/lib/types";

/** The /create world for the client's own pages: blurred candlelit backdrop, dot grain, floating top bar. */
export function StudioShell({ photo, brand, dock, children }: { photo?: string; brand: string; dock?: ReactNode; children: ReactNode }) {
  return (
    <div
      className={s.shell}
      dir="rtl"
      lang="ar"
      style={photo ? ({ "--studio-photo": `url("${photo}")` } as CSSProperties) : undefined}
    >
      <div className={s.bgPhoto} aria-hidden="true" />
      <div className={s.bgOverlay} aria-hidden="true" />
      <div className={s.frame}>
        <header className={s.topbar}>
          <Link href="/" className={s.brand} dir="ltr">
            {brand}
          </Link>
          {dock && (
            <nav className={s.dock} aria-label="صفحة الدعوة">
              {dock}
            </nav>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

const SEALS: Record<Order["payment"], { label: string; tone: string }> = {
  unpaid: { label: "مش مدفوع", tone: "unpaid" },
  pending_review: { label: "بنراجع التحويل", tone: "pending" },
  paid: { label: "مدفوع", tone: "paid" },
};

/** Payment state as a hairline-ruled stationery stamp, in the rail's grammar. */
export function StatusSeal({ payment }: { payment: Order["payment"] }) {
  const seal = SEALS[payment] ?? SEALS.unpaid;
  return (
    <span className={s.seal} data-tone={seal.tone}>
      <span className={s.sealCaption}>حالة الدفع</span>
      <span className={s.sealValue}>
        <span className={s.sealMark} aria-hidden="true" />
        {seal.label}
      </span>
    </span>
  );
}

/** One editorial rail: numbered steps, a hairline progress underline. */
export function StepRail({ steps, current }: { steps: string[]; current: number }) {
  const NUMS = ["١", "٢", "٣", "٤"];
  return (
    <ol className={s.rail} aria-label="خطوات الطلب">
      <span aria-hidden="true" className={s.railProgress} style={{ width: `${(Math.min(current, steps.length) / steps.length) * 100}%` }} />
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} className={s.railItem} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={s.railNum} aria-hidden="true">
              {state === "done" ? <Check size={13} strokeWidth={2.2} /> : NUMS[i]}
            </span>
            <span className={s.railLabel}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** A link (or account) in a pill with a copy button. */
export function CopyField({
  value,
  icon: LeadIcon,
  dark = false,
  onCopied,
}: {
  value: string;
  icon?: LucideIcon;
  dark?: boolean;
  onCopied?: (ok: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    let ok = true;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      ok = false;
    }
    onCopied?.(ok);
  }
  return (
    <div className={`${s.copyField} ${dark ? s.copyFieldDark : ""}`}>
      {LeadIcon && <LeadIcon size={16} strokeWidth={1.7} className={s.copyLead} aria-hidden="true" />}
      <code dir="ltr">{value}</code>
      <button type="button" className={`${dark ? s.cta : s.ghost} ${s.small}`} onClick={copy}>
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        {copied ? "اتنسخ" : "نسخ"}
      </button>
    </div>
  );
}
