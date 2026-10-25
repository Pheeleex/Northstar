"use client";

import { useEffect, useRef, useState } from "react";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

export function DemoPersonaSwitcher() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeEmployee, employees, setActiveEmployee } = useDemoStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeEmployeeIndex = employees.findIndex((employee) => employee.id === activeEmployee.id);
  const displayName = activeEmployee.displayName ?? `${activeEmployee.firstName} ${activeEmployee.lastName}`;
  const initials = displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen && activeEmployeeIndex >= 0) optionRefs.current[activeEmployeeIndex]?.focus();
  }, [menuOpen, activeEmployeeIndex]);

  function focusPersona(index: number) {
    const nextIndex = (index + employees.length) % employees.length;
    optionRefs.current[nextIndex]?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setMenuOpen(true);
      const startIndex = activeEmployeeIndex < 0 ? 0 : activeEmployeeIndex;
      window.requestAnimationFrame(() => focusPersona(startIndex));
    }
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
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
      setMenuOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div
      className="user-menu"
      ref={menuRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
      }}
    >
      <span className="user-avatar" aria-hidden="true">{initials}</span>
      <button
        ref={triggerRef}
        className="persona-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls="demo-persona-menu"
        aria-label={`Switch demo user. Current user: ${displayName}, ${activeEmployee.role}`}
        onClick={() => setMenuOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="user-copy">
          <span className="persona-name">{displayName}</span>
          <span className="user-role">{activeEmployee.role}</span>
        </span>
        <svg className={`profile-chevron ${menuOpen ? "open" : ""}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
      </button>
      {menuOpen && (
        <div className="persona-menu" id="demo-persona-menu">
          <div className="persona-menu-heading">Demo users<span>Choose a role to preview its workspace</span></div>
          <div role="menu" aria-label="Switch demo user">
            {employees.map((employee, index) => {
              const name = employee.displayName ?? `${employee.firstName} ${employee.lastName}`;
              const isActive = employee.id === activeEmployee.id;
              return (
                <button
                  key={employee.id}
                  ref={(element) => { optionRefs.current[index] = element; }}
                  className={`persona-option ${isActive ? "selected" : ""}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setActiveEmployee(employee.id);
                    setMenuOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
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
  );
}
