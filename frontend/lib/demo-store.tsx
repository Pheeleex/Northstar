"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { demoEmployees, inventoryItems, type DemoEmployee, type InventoryItem } from "@/lib/demo-data";

const STORE_KEY = "northstar.demo-store.v1";
const STORE_VERSION = 1;

type DemoStoreState = {
  version: number;
  activeEmployeeId: string;
  inventoryItems: InventoryItem[];
};

type DemoStoreValue = {
  activeEmployee: DemoEmployee;
  employees: DemoEmployee[];
  inventoryItems: InventoryItem[];
  setActiveEmployee: (employeeId: string) => void;
  addInventoryItem: (item: InventoryItem) => boolean;
  resetDemoStore: () => void;
};

const DemoStoreContext = createContext<DemoStoreValue | null>(null);
const serverSnapshot: DemoStoreState = createInitialState();
let browserSnapshot: DemoStoreState | null = null;
const subscribers = new Set<() => void>();

function createInitialState(): DemoStoreState {
  return {
    version: STORE_VERSION,
    activeEmployeeId: demoEmployees[0].id,
    inventoryItems: inventoryItems.map((item) => ({ ...item })),
  };
}

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<InventoryItem>;
  return typeof item.code === "string"
    && typeof item.name === "string"
    && typeof item.category === "string"
    && typeof item.onHand === "number"
    && Number.isFinite(item.onHand)
    && typeof item.unit === "string"
    && typeof item.reorderAt === "number"
    && Number.isFinite(item.reorderAt)
    && typeof item.warehouse === "string"
    && (item.status === "Healthy" || item.status === "Low stock" || item.status === "Quality hold");
}

function readStoredState(): DemoStoreState {
  const freshState = createInitialState();
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (!stored) return freshState;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return freshState;
    const saved = parsed as Partial<DemoStoreState>;
    if (saved.version !== STORE_VERSION) return freshState;
    const activeEmployeeId = demoEmployees.some((employee) => employee.id === saved.activeEmployeeId)
      ? saved.activeEmployeeId as string
      : freshState.activeEmployeeId;
    const storedItems = Array.isArray(saved.inventoryItems)
      ? saved.inventoryItems.filter(isInventoryItem)
      : freshState.inventoryItems;
    return { version: STORE_VERSION, activeEmployeeId, inventoryItems: storedItems };
  } catch {
    return freshState;
  }
}

function getBrowserSnapshot() {
  if (browserSnapshot === null) browserSnapshot = readStoredState();
  return browserSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== STORE_KEY && event.key !== null) return;
  browserSnapshot = event.newValue ? readStoredState() : createInitialState();
  notifySubscribers();
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  if (subscribers.size === 1 && typeof window !== "undefined") window.addEventListener("storage", handleStorageChange);
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", handleStorageChange);
  };
}

function updateStore(update: (current: DemoStoreState) => DemoStoreState) {
  const current = getBrowserSnapshot();
  const next = update(current);
  if (next === current) return;
  browserSnapshot = next;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Keep the demo usable in memory if browser storage is unavailable.
  }
  notifySubscribers();
}

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getBrowserSnapshot, getServerSnapshot);

  const setActiveEmployee = useCallback((employeeId: string) => {
    if (!demoEmployees.some((employee) => employee.id === employeeId)) return;
    updateStore((current) => current.activeEmployeeId === employeeId
      ? current
      : { ...current, activeEmployeeId: employeeId });
  }, []);

  const addInventoryItem = useCallback((item: InventoryItem) => {
    if (getBrowserSnapshot().inventoryItems.some((existing) => existing.code.toLowerCase() === item.code.toLowerCase())) return false;
    updateStore((current) => current.inventoryItems.some((existing) => existing.code.toLowerCase() === item.code.toLowerCase())
      ? current
      : { ...current, inventoryItems: [item, ...current.inventoryItems] });
    return true;
  }, []);

  const resetDemoStore = useCallback(() => updateStore(() => createInitialState()), []);
  const activeEmployee = demoEmployees.find((employee) => employee.id === state.activeEmployeeId) ?? demoEmployees[0];
  const value = useMemo<DemoStoreValue>(() => ({
    activeEmployee,
    employees: demoEmployees,
    inventoryItems: state.inventoryItems,
    setActiveEmployee,
    addInventoryItem,
    resetDemoStore,
  }), [activeEmployee, state.inventoryItems, setActiveEmployee, addInventoryItem, resetDemoStore]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return value;
}
