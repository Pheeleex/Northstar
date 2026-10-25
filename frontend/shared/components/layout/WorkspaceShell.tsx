"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { DemoPersonaSwitcher } from "@/shared/components/layout/DemoPersonaSwitcher";
import { navigation, WorkspaceNavigation } from "@/shared/components/layout/WorkspaceNavigation";

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navigation.find((item) => item.href === pathname);

  return (
    <div className="app-frame">
      {menuOpen && (
        <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      )}

      <WorkspaceNavigation
        menuOpen={menuOpen}
        pathname={pathname}
        onNavigate={() => setMenuOpen(false)}
      />

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
            <div className="crumb"><span>NorthStar Foods</span><span className="crumb-divider" aria-hidden="true">/</span><strong>{current?.label ?? "Workspace"}</strong></div>
          </div>
          <div className="top-actions">
            <span className="demo-pill"><span className="demo-pill-dot"/> DEMO MODE</span>
            <span className="topbar-divider" aria-hidden="true"/>
            <DemoPersonaSwitcher />
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
