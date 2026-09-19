"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const APP_NAV = [
  { href: "/builder", label: "Builder", icon: "grid" },
  { href: "/run", label: "Live run", icon: "play" },
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
];

function Brand({ tag }: { tag: string }) {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark"><Icon name="layers" size={15} /></span>
      <span className="brand-name">Flowdesk</span>
      <span className="brand-tag">{tag}</span>
    </Link>
  );
}

function DatasetCard() {
  return (
    <div className="side-dataset">
      <div className="side-dataset-name">
        <Icon name="inbox" size={13} /> Nimbus CRM
      </div>
      <div className="side-dataset-meta">support inbox sample</div>
      <div className="side-dataset-count">21 tickets · 4 channels</div>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {APP_NAV.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          onClick={onNavigate}
          className={`side-link ${pathname.startsWith(t.href) ? "active" : ""}`}
        >
          <Icon name={t.icon} size={15} />
          {t.label}
        </Link>
      ))}
    </>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_NAV.some((t) => pathname.startsWith(t.href));
  const [menuOpen, setMenuOpen] = useState(false);

  // close the drawer on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const drawer = menuOpen && (
    <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <Brand tag="demo" />
          <button className="icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="side-section">
          <div className="side-label">Workspace</div>
          <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        </div>
        <div className="side-section">
          <div className="side-label">Dataset</div>
          <DatasetCard />
        </div>
        <div className="side-spacer" />
        <div className="side-badge" style={{ paddingTop: 14 }}>
          <span className="pulse-dot" /> Synthetic data only
        </div>
      </div>
    </div>
  );

  if (isApp) {
    return (
      <div className="shell">
        <aside className="sidebar">
          <Brand tag="demo" />
          <div className="side-section">
            <div className="side-label">Workspace</div>
            <NavLinks pathname={pathname} />
          </div>
          <div className="side-section">
            <div className="side-label">Dataset</div>
            <DatasetCard />
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
        <div className="shell-main">
          <div className="mobile-topbar">
            <Brand tag="demo" />
            <button className="btn btn-ghost btn-sm menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Icon name="menu" size={15} /> Menu
            </button>
          </div>
          {drawer}
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="topnav">
        <Brand tag="agentic ITSM demo" />
        <nav className="topnav-links">
          {APP_NAV.map((t) => (
            <Link key={t.href} href={t.href} className="topnav-link">
              {t.label}
            </Link>
          ))}
        </nav>
        <span className="nav-badge">Synthetic data</span>
        <button className="btn btn-ghost btn-sm menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Icon name="menu" size={15} /> Menu
        </button>
      </header>
      {drawer}
      {children}
    </>
  );
}
