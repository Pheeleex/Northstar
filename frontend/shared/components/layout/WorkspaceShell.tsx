"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Inventory", href: "/inventory", icon: "box" },
  { label: "Procurement", href: "/procurement", icon: "cart" },
  { label: "Quality", href: "/quality", icon: "check" },
  { label: "Transfers", href: "/transfers", icon: "arrows" },
  { label: "Distribution", href: "/distribution", icon: "truck" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9M8 5.3l8 4.5"/></>,
    cart: <><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L20 8H6"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></>,
    check: <><path d="M12 3 20 6v5c0 5.1-3.4 8.5-8 10-4.6-1.5-8-4.9-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    arrows: <><path d="M7 7h13l-3-3M17 17H4l3 3"/><path d="m17 4 3 3-3 3M7 14l-3 3 3 3"/></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></>,
  };
  return <span className="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg></span>;
}

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeEmployee, employees, setActiveEmployee } = useDemoStore();
  const current = navigation.find((item) => item.href === pathname);
  const initials = `${activeEmployee.firstName[0]}${activeEmployee.lastName[0]}`;

  return (
    <div className="app-frame">
      {menuOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <Link className="brand" href="/dashboard" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">N</span>
          <span><span className="brand-name">NorthStar</span><span className="brand-caption">Operations workspace</span></span>
        </Link>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = item.href === pathname;
            return <Link key={item.href} className={`nav-link ${active ? "active" : ""}`} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}><NavIcon name={item.icon}/>{item.label}</Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="org-switcher"><span className="org-avatar">NF</span><span><span className="org-name">NorthStar Foods</span><span className="org-plan">Demo organization</span></span></div>
          <div className="sidebar-footnote">NorthStar workspace · Demo data</div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>☰</button>
          <div className="crumb">Workspace <span aria-hidden="true">/</span> <strong>{current?.label ?? "NorthStar"}</strong></div>
          <div className="top-actions"><span className="demo-pill" title="Demo changes are stored in this browser">DEMO · LOCAL</span><div className="user-menu"><span className="user-avatar">{initials}</span><span className="user-copy"><label className="sr-only" htmlFor="demo-employee">Switch demo user</label><select id="demo-employee" className="persona-select" value={activeEmployee.id} onChange={(event) => setActiveEmployee(event.target.value)} aria-label="Switch demo user">{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.displayName ?? `${employee.firstName} ${employee.lastName}`}</option>)}</select><span className="user-role">{activeEmployee.role}</span></span></div></div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
