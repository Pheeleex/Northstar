import { useCallback, useEffect, useState } from "react";
import { demoEmployees } from "@/features/workspace/data/demo-users";

const PERSONA_KEY = "northstar.demo-persona.v1";

export function useDemoPersona() {
  const [activeEmployeeId, setActiveEmployeeId] = useState(demoEmployees[0].id);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedId = localStorage.getItem(PERSONA_KEY);
        if (storedId && demoEmployees.some((employee) => employee.id === storedId)) {
          setActiveEmployeeId(storedId);
        }
      } catch {
        // The default persona remains available when browser storage is disabled.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setActiveEmployee = useCallback((employeeId: string) => {
    if (!demoEmployees.some((employee) => employee.id === employeeId)) return;
    setActiveEmployeeId(employeeId);
    try {
      localStorage.setItem(PERSONA_KEY, employeeId);
    } catch {
      // Persona selection still works for this page session.
    }
  }, []);

  const activeEmployee = demoEmployees.find((employee) => employee.id === activeEmployeeId) ?? demoEmployees[0];

  return {
    activeEmployee,
    activeEmployeeId,
    employees: demoEmployees,
    setActiveEmployee,
  };
}
