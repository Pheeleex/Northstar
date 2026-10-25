import Link from "next/link";
import type { ReactNode } from "react";

type NavigationIcon = "grid" | "box" | "cart" | "check" | "arrows" | "truck";

export type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIcon;
};

export const navigation: NavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: "grid" },
  { label: "Inventory", href: "/inventory", icon: "box" },
  { label: "Procurement", href: "/procurement", icon: "cart" },
  { label: "Quality", href: "/quality", icon: "check" },
  { label: "Transfers", href: "/transfers", icon: "arrows" },
  { label: "Distribution", href: "/distribution", icon: "truck" },
];

function NavIcon({ name }: { name: NavigationIcon }) {
  const paths: Record<NavigationIcon, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9M8 5.3l8 4.5"/></>,
    cart: <><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L20 8H6"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></>,
    check: <><path d="M12 3 20 6v5c0 5.1-3.4 8.5-8 10-4.6-1.5-8-4.9-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    arrows: <><path d="M7 7h13l-3-3M17 17H4l3 3"/><path d="m17 4 3 3-3 3M7 14l-3 3 3 3"/></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></>,
  };

  return (
    <span className="nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </svg>
    </span>
  );
}

export function WorkspaceNavigation({
  menuOpen,
  pathname,
  onNavigate,
}: {
  menuOpen: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="NorthStar workspace navigation">
      <Link className="brand" href="/dashboard" onClick={onNavigate}>
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="none"><path d="M18 4.5 20.7 15.3 31.5 18l-10.8 2.7L18 31.5l-2.7-10.8L4.5 18l10.8-2.7L18 4.5Z" fill="currentColor"/><circle cx="18" cy="18" r="3.2" fill="#102C42"/></svg>
        </span>
        <span className="brand-copy"><span className="brand-name">NorthStar</span><span className="brand-caption">Operations workspace</span></span>
      </Link>

      <div className="nav-label">Workspace</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navigation.map((item) => {
          const active = item.href === pathname;
          return (
            <Link
              key={item.href}
              className={`nav-link ${active ? "active" : ""}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <NavIcon name={item.icon}/><span>{item.label}</span>{active && <span className="nav-active-mark" aria-hidden="true"/>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="workspace-card">
          <div className="org-avatar" aria-hidden="true">NF</div>
          <div className="org-copy"><div className="org-name">NorthStar Foods</div><div className="org-plan"><span className="org-status-dot"/> Demo workspace</div></div>
          <span className="org-chevron" aria-hidden="true">⌄</span>
        </div>
        <p className="sidebar-footnote">A clearer view of work, stock, and decisions.</p>
      </div>
    </aside>
  );
}
