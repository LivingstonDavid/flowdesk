"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const APP_NAV = [
  { href: "/builder", label: "Builder", icon: "grid" },
  { href: "/run", label: "Live run", icon: "play" },
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_NAV.some((t) => pathname.startsWith(t.href));

  if (isApp) {
    return (
      <div className="shell">
        <aside className="sidebar">
          <Link href="/" className="brand">
            <span className="brand-mark"><Icon name="layers" size={15} /></span>
            <span className="brand-name">Flowdesk</span>
            <span className="brand-tag">demo</span>
          </Link>

          <div className="side-section">
            <div className="side-label">Workspace</div>
            {APP_NAV.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`side-link ${pathname.startsWith(t.href) ? "active" : ""}`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </Link>
            ))}
          </div>

          <div className="side-section">
            <div className="side-label">Dataset</div>
            <div className="side-dataset">
              <div className="side-dataset-name">
                <Icon name="inbox" size={13} /> Nimbus CRM
              </div>
              <div className="side-dataset-meta">support inbox sample</div>
              <div className="side-dataset-count">21 tickets · 4 channels</div>
            </div>
          </div>

          <div className="side-spacer" />

          <div className="side-foot">
            <div className="side-badge">
              <span className="pulse-dot" /> Synthetic data only
            </div>
            <div className="side-user">
              <span className="avatar sm">DA</span>
              <span className="side-user-meta">
                <span className="side-user-name">Demo Admin</span>
                <span className="side-user-sub">portfolio build</span>
              </span>
            </div>
          </div>
        </aside>
        <div className="shell-main">{children}</div>
      </div>
    );
  }

  return (
    <>
      <header className="topnav">
        <Link href="/" className="brand">
          <span className="brand-mark"><Icon name="layers" size={15} /></span>
          <span className="brand-name">Flowdesk</span>
          <span className="brand-tag">agentic ITSM demo</span>
        </Link>
        <nav className="topnav-links">
          {APP_NAV.map((t) => (
            <Link key={t.href} href={t.href} className="topnav-link">
              {t.label}
            </Link>
          ))}
        </nav>
        <span className="nav-badge">Synthetic data</span>
      </header>
      {children}
    </>
  );
}
