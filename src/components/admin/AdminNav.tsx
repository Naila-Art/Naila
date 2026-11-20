"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import a from "./admin.module.css";

export default function AdminNav({ adminKey }: { adminKey: string }) {
  const path = usePathname();
  const base = `/admin/${adminKey}`;
  const links = [
    { href: base, label: "الرئيسية" },
    { href: `${base}/orders`, label: "الطلبات" },
    { href: `${base}/pricing`, label: "الأسعار" },
    { href: `${base}/templates`, label: "التيمبليتس" },
    { href: `${base}/music`, label: "المزيكا" },
  ];
  return (
    <nav className={a.nav} dir="rtl" aria-label="داشبورد الإدارة">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
