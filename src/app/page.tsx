import Link from "next/link";

/** Temporary dev index — the storefront replaces this in a later stage. */
export default function Home() {
  const links = [
    { href: "/i/demo", label: "دعوة عامة (عربي)" },
    { href: "/i/demo/k3x9m2p7qa", label: "دعوة بالاسم: أستاذ محمود" },
    { href: "/i/demo/w8t4z6n1re", label: "دعوة بالاسم من غير لقب: منى" },
    { href: "/i/demo-en", label: "General invitation (English)" },
    { href: "/i/demo-en/p5d2h8v3kc", label: "Named invitation: Mr. Karim" },
    { href: "/c/m7q2x9k4t8w3z6p1", label: "صفحة العميل (إدارة المعازيم)" },
  ];
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto", lineHeight: 2 }}>
      <h1 style={{ marginBottom: 12 }}>Demo invitations</h1>
      <ul style={{ listStyle: "none" }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
