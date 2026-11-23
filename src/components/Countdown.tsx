"use client";

import { useEffect, useState } from "react";
import baseStyles from "./invitation.module.css";
import type { Strings } from "@/lib/i18n";

function remaining(target: number, now: number) {
  const diff = Math.max(0, target - now);
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({
  dateIso,
  strings: s,
  ui,
}: {
  dateIso: string;
  strings: Strings;
  /** Class overrides from a layout family's stylesheet. */
  ui?: Partial<Record<string, string>>;
}) {
  const styles = { ...baseStyles, ...ui } as Record<string, string>;
  const target = new Date(dateIso).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const r = remaining(target, now);
  if (r.done) return <p className={styles.where}>{s.eventStarted}</p>;

  const units: [number, string][] = [
    [r.days, s.days],
    [r.hours, s.hours],
    [r.minutes, s.minutes],
    [r.seconds, s.seconds],
  ];

  return (
    <div className={styles.countdown} role="timer">
      {units.map(([value, label]) => (
        <div key={label} className={styles.unit}>
          <span className={styles.unitValue} suppressHydrationWarning>
            {value}
          </span>
          <span className={styles.unitLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}
