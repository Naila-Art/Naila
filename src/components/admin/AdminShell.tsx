"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import s from "./shell.module.css";

const LINKS = [
  { href: "/admin", label: "الرئيسية", icon: "⌂" },
  { href: "/admin/orders", label: "الطلبات", icon: "▤", badge: true },
  { href: "/admin/finance", label: "الحسابات 🔒", icon: "₤" },
  { href: "/admin/payments", label: "طرق الدفع", icon: "◈" },
  { href: "/admin/pricing", label: "الباقات والأسعار", icon: "◇" },
  { href: "/admin/templates", label: "التيمبليتس", icon: "▣" },
  { href: "/admin/music", label: "المزيكا", icon: "♪" },
  { href: "/admin/team", label: "الفريق", icon: "☺" },
];

/** Dashboard frame: sidebar on desktop, top bar + drawer on mobile. */
export default function AdminShell({ name, pending, children }: { name: string; pending: number; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className={s.shell} dir="rtl" lang="ar">
      <header className={s.topbar}>
        <button type="button" className={s.menuBtn} aria-label="القايمة" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          ☰
        </button>
        <span className={s.brand}>داشبورد الإدارة</span>
        {pending > 0 && (
          <Link href="/admin/orders?f=pending" className={s.pendingPill}>
            {pending} مستني تأكيد
          </Link>
        )}
      </header>

      <aside className={s.sidebar} data-open={open}>
        <div className={s.sideHead}>
          <strong>داشبورد الإدارة</strong>
          <small>أهلاً {name}</small>
        </div>
        <nav aria-label="داشبورد الإدارة">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={s.link} aria-current={active(l.href) ? "page" : undefined}>
              <span className={s.icon} aria-hidden>
                {l.icon}
              </span>
              <span>{l.label}</span>
              {l.badge && pending > 0 && <span className={s.badge}>{pending}</span>}
            </Link>
          ))}
        </nav>
        <div className={s.sideFoot}>
          <a href="/" target="_blank" rel="noopener noreferrer" className={s.link}>
            <span className={s.icon} aria-hidden>
              ↗
            </span>
            <span>الموقع</span>
          </a>
          <button type="button" className={s.logout} onClick={logout}>
            تسجيل خروج
          </button>
        </div>
      </aside>
      {open && <button type="button" className={s.scrim} aria-label="اقفل القايمة" onClick={() => setOpen(false)} />}

      <div className={s.content}>{children}</div>
    </div>
  );
}
