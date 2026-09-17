"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/builder", label: "Builder" },
  { href: "/run", label: "Run" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <span className="nav-logo">◆</span> Flowdesk
        <span className="nav-tag">agentic ITSM demo</span>
      </Link>
      <nav className="nav-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`nav-tab ${pathname.startsWith(t.href) ? "active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <span className="nav-badge">synthetic data</span>
    </header>
  );
}
