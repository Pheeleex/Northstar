"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "grid" },
  { label: "Inventory", href: "/inventory", icon: "box" },
  { label: "Procurement", href: "/procurement", icon: "cart" },
  { label: "Quality", href: "/quality", icon: "check" },
  { label: "Transfers", href: "/transfers", icon: "arrows" },
  { label: "Distribution", href: "/distribution", icon: "truck" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
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

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const { activeEmployee, employees, setActiveEmployee } = useDemoStore();
  const personaMenuRef = useRef<HTMLDivElement>(null);
  const personaTriggerRef = useRef<HTMLButtonElement>(null);
  const personaOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = navigation.find((item) => item.href === pathname);
  const displayName = activeEmployee.displayName ?? `${activeEmployee.firstName} ${activeEmployee.lastName}`;
  const initials = displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const activeEmployeeIndex = employees.findIndex((employee) => employee.id === activeEmployee.id);

  useEffect(() => {
    if (!personaMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!personaMenuRef.current?.contains(event.target as Node)) setPersonaMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [personaMenuOpen]);

  useEffect(() => {
    if (personaMenuOpen && activeEmployeeIndex >= 0) personaOptionRefs.current[activeEmployeeIndex]?.focus();
  }, [personaMenuOpen, activeEmployeeIndex]);

  function focusPersona(index: number) {
    const nextIndex = (index + employees.length) % employees.length;
    personaOptionRefs.current[nextIndex]?.focus();
  }

  function handlePersonaTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setPersonaMenuOpen(true);
      const startIndex = activeEmployeeIndex < 0 ? 0 : activeEmployeeIndex;
      window.requestAnimationFrame(() => focusPersona(startIndex));
    }
  }

  function handlePersonaOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusPersona(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusPersona(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusPersona(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusPersona(employees.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setPersonaMenuOpen(false);
      personaTriggerRef.current?.focus();
    }
  }

  return (
    <div className="app-frame">
      {menuOpen && (
        <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="NorthStar workspace navigation">
        <Link className="brand" href="/dashboard" onClick={() => setMenuOpen(false)}>
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
                onClick={() => setMenuOpen(false)}
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

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="mobile-menu" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
            <div className="crumb"><span>NorthStar Foods</span><span className="crumb-divider" aria-hidden="true">/</span><strong>{current?.label ?? "Workspace"}</strong></div>
          </div>
          <div className="top-actions">
            <span className="demo-pill"><span className="demo-pill-dot"/> DEMO MODE</span>
            <span className="topbar-divider" aria-hidden="true"/>
            <div
              className="user-menu"
              ref={personaMenuRef}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPersonaMenuOpen(false);
              }}
            >
              <span className="user-avatar" aria-hidden="true">{initials}</span>
              <button
                ref={personaTriggerRef}
                className="persona-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={personaMenuOpen}
                aria-controls="demo-persona-menu"
                aria-label={`Switch demo user. Current user: ${displayName}, ${activeEmployee.role}`}
                onClick={() => setPersonaMenuOpen((open) => !open)}
                onKeyDown={handlePersonaTriggerKeyDown}
              >
                <span className="user-copy">
                  <span className="persona-name">{displayName}</span>
                  <span className="user-role">{activeEmployee.role}</span>
                </span>
                <svg className={`profile-chevron ${personaMenuOpen ? "open" : ""}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
              </button>
              {personaMenuOpen && (
                <div className="persona-menu" id="demo-persona-menu">
                  <div className="persona-menu-heading">Demo users<span>Choose a role to preview its workspace</span></div>
                  <div role="menu" aria-label="Switch demo user">
                    {employees.map((employee, index) => {
                      const name = employee.displayName ?? `${employee.firstName} ${employee.lastName}`;
                      const isActive = employee.id === activeEmployee.id;
                      return (
                        <button
                          key={employee.id}
                          ref={(element) => { personaOptionRefs.current[index] = element; }}
                          className={`persona-option ${isActive ? "selected" : ""}`}
                          type="button"
                          role="menuitemradio"
                          aria-checked={isActive}
                          onClick={() => {
                            setActiveEmployee(employee.id);
                            setPersonaMenuOpen(false);
                            personaTriggerRef.current?.focus();
                          }}
                          onKeyDown={(event) => handlePersonaOptionKeyDown(event, index)}
                        >
                          <span className="persona-option-avatar" aria-hidden="true">{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                          <span className="persona-option-copy"><span className="persona-option-name">{name}</span><span className="persona-option-role">{employee.role}{employee.warehouse ? ` · ${employee.warehouse}` : ""}</span></span>
                          {isActive && <svg className="persona-option-check" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
