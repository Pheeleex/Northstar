"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { demoEmployees } from "@/features/workspace/data/demo-users";
import type { DemoEmployee } from "@/features/workspace/data/demo-users";
import { inventoryAdjustments, inventoryItems, inventoryMovements, warehouses } from "@/features/inventory/data/demo-data";
import type { AdjustmentReason, AdjustmentStatus, InventoryAdjustment, InventoryItem, InventoryMovement, InventoryMovementReason, Warehouse } from "@/features/inventory/types/inventory.types";

const STORE_KEY = "northstar.demo-store.v1";
const STORE_VERSION = 5;
const adjustmentReasons: AdjustmentReason[] = ["Count variance", "Damage or spoilage", "Receiving correction", "Expiry", "Other"];
const movementReasons: InventoryMovementReason[] = ["Opening stock", "Supplier receipt", "Customer return", "Transfer", "Production use", "Customer dispatch", "Write-off", ...adjustmentReasons];
const legacyWarehouseNames: Record<string, string> = {
  "Lagos Main": "Lagos Main Warehouse",
  "Ikeja Packaging": "Ikeja Warehouse 1",
  "Ikeja Finished Goods": "Ikeja Warehouse 2",
};

function currentWarehouseName(name: string) {
  return legacyWarehouseNames[name] ?? name;
}

type DemoStoreState = {
  version: number;
  activeEmployeeId: string;
  warehouses: Warehouse[];
  inventoryItems: InventoryItem[];
  inventoryAdjustments: InventoryAdjustment[];
  inventoryMovements: InventoryMovement[];
};

type DemoStoreValue = {
  activeEmployee: DemoEmployee;
  employees: DemoEmployee[];
  warehouses: Warehouse[];
  inventoryItems: InventoryItem[];
  inventoryAdjustments: InventoryAdjustment[];
  inventoryMovements: InventoryMovement[];
  setActiveEmployee: (employeeId: string) => void;
  addWarehouse: (warehouse: Warehouse) => boolean;
  addInventoryItem: (item: InventoryItem) => boolean;
  submitInventoryAdjustment: (adjustment: Omit<InventoryAdjustment, "id" | "status" | "requestedAt">) => boolean;
  reviewInventoryAdjustment: (adjustmentId: string, decision: Extract<AdjustmentStatus, "Approved" | "Returned">, reviewer: string, note?: string) => boolean;
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
    warehouses: warehouses.map((warehouse) => ({ ...warehouse })),
    inventoryItems: inventoryItems.map((item) => ({ ...item })),
    inventoryAdjustments: inventoryAdjustments.map((adjustment) => ({ ...adjustment })),
    inventoryMovements: inventoryMovements.map((movement) => ({ ...movement })),
  };
}

function isInventoryAdjustment(value: unknown): value is InventoryAdjustment {
  if (!value || typeof value !== "object") return false;
  const adjustment = value as Partial<InventoryAdjustment>;
  return typeof adjustment.id === "string"
    && typeof adjustment.itemCode === "string"
    && typeof adjustment.itemName === "string"
    && typeof adjustment.warehouse === "string"
    && (adjustment.direction === "Increase" || adjustment.direction === "Decrease")
    && typeof adjustment.quantity === "number"
    && Number.isFinite(adjustment.quantity)
    && adjustmentReasons.includes(adjustment.reason as AdjustmentReason)
    && typeof adjustment.notes === "string"
    && adjustment.notes.trim().length >= 8
    && typeof adjustment.requestedById === "string"
    && typeof adjustment.requestedBy === "string"
    && typeof adjustment.requestedAt === "string"
    && (adjustment.status === "Pending review" || adjustment.status === "Approved" || adjustment.status === "Returned");
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

function isWarehouse(value: unknown): value is Warehouse {
  if (!value || typeof value !== "object") return false;
  const warehouse = value as Partial<Warehouse>;
  return typeof warehouse.id === "string" && typeof warehouse.code === "string" && typeof warehouse.name === "string";
}

function isInventoryMovement(value: unknown): value is InventoryMovement {
  if (!value || typeof value !== "object") return false;
  const movement = value as Partial<InventoryMovement>;
  return typeof movement.id === "string"
    && typeof movement.itemCode === "string"
    && typeof movement.itemName === "string"
    && typeof movement.warehouse === "string"
    && (movement.type === "IN" || movement.type === "OUT" || movement.type === "ADJUSTMENT")
    && movementReasons.includes(movement.reason as InventoryMovementReason)
    && typeof movement.quantity === "number"
    && Number.isFinite(movement.quantity)
    && (movement.type === "ADJUSTMENT" || (movement.type === "IN" ? movement.quantity >= 0 : movement.quantity <= 0))
    && typeof movement.balanceAfter === "number"
    && Number.isFinite(movement.balanceAfter)
    && (movement.reference === undefined || typeof movement.reference === "string")
    && typeof movement.performedBy === "string"
    && typeof movement.occurredAt === "string";
}

function migrateLegacyMovement(value: unknown): InventoryMovement | undefined {
  if (!value || typeof value !== "object") return undefined;
  const old = value as Omit<Partial<InventoryMovement>, "type"> & { note?: string; type?: string };
  const mappedType: InventoryMovement["type"] | undefined = old.type === "Opening balance" || old.type === "Receipt"
    ? "IN"
    : old.type === "Dispatch" || old.type === "Production issue"
      ? "OUT"
      : old.type === "Adjustment"
        ? "ADJUSTMENT"
        : old.type === "IN" || old.type === "OUT" || old.type === "ADJUSTMENT"
          ? old.type
          : undefined;
  if (!mappedType) return undefined;
  const adjustmentReason = adjustmentReasons.find((reason) => old.note?.startsWith(`${reason}:`));
  const reason: InventoryMovementReason = mappedType === "ADJUSTMENT"
    ? adjustmentReason ?? "Count variance"
    : old.type === "Opening balance" ? "Opening stock"
      : old.type === "Receipt" ? "Supplier receipt"
        : old.type === "Dispatch" ? "Customer dispatch"
          : old.type === "Production issue" ? "Production use"
            : movementReasons.includes(old.reason as InventoryMovementReason) ? old.reason as InventoryMovementReason
              : "Transfer";
  const migrated = {
    id: old.id,
    itemCode: old.itemCode,
    itemName: old.itemName,
    warehouse: old.warehouse,
    type: mappedType,
    reason,
    quantity: old.quantity,
    balanceAfter: old.balanceAfter,
    reference: old.reference,
    performedBy: old.performedBy,
    occurredAt: old.occurredAt,
  };
  return isInventoryMovement(migrated) ? migrated : undefined;
}

function reconcileMovements(items: InventoryItem[]) {
  const movements = inventoryMovements.map((movement) => ({ ...movement }));
  for (const item of items) {
    const itemMovements = movements.filter((movement) => movement.itemCode === item.code && movement.warehouse === item.warehouse);
    const ledgerBalance = itemMovements.reduce((total, movement) => total + movement.quantity, 0);
    const difference = item.onHand - ledgerBalance;
    if (difference === 0 && itemMovements.length) continue;
    movements.unshift({
      id: `MIG-${item.code}-${item.warehouse}`,
      itemCode: item.code,
      itemName: item.name,
      warehouse: item.warehouse,
      type: difference < 0 ? "ADJUSTMENT" : "IN",
      reason: difference < 0 ? "Count variance" : "Opening stock",
      quantity: difference,
      balanceAfter: item.onHand,
      reference: "STORE-UPGRADE",
      performedBy: "Demo store migration",
      occurredAt: new Date().toISOString(),
    });
  }
  return movements;
}

function readStoredState(): DemoStoreState {
  const freshState = createInitialState();
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (!stored) return freshState;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return freshState;
    const saved = parsed as Partial<DemoStoreState>;
    if (saved.version !== 1 && saved.version !== 2 && saved.version !== 3 && saved.version !== 4 && saved.version !== STORE_VERSION) return freshState;
    const activeEmployeeId = demoEmployees.some((employee) => employee.id === saved.activeEmployeeId)
      ? saved.activeEmployeeId as string
      : freshState.activeEmployeeId;
    const storedItems = Array.isArray(saved.inventoryItems)
      ? saved.inventoryItems.filter(isInventoryItem).map((item) => ({ ...item, warehouse: currentWarehouseName(item.warehouse) }))
      : freshState.inventoryItems;
    const storedAdjustments = saved.version >= 2 && Array.isArray(saved.inventoryAdjustments)
      ? saved.inventoryAdjustments.filter(isInventoryAdjustment).map((adjustment) => ({ ...adjustment, warehouse: currentWarehouseName(adjustment.warehouse) }))
      : freshState.inventoryAdjustments;
    const storedWarehouses = saved.version === STORE_VERSION && Array.isArray(saved.warehouses)
      ? saved.warehouses.filter(isWarehouse)
      : freshState.warehouses;
    const storedMovements = saved.version >= 3 && Array.isArray(saved.inventoryMovements)
      ? saved.inventoryMovements.map(migrateLegacyMovement).filter((movement): movement is InventoryMovement => Boolean(movement)).map((movement) => ({ ...movement, warehouse: currentWarehouseName(movement.warehouse) }))
      : reconcileMovements(storedItems);
    return { version: STORE_VERSION, activeEmployeeId, warehouses: storedWarehouses.length ? storedWarehouses : freshState.warehouses, inventoryItems: storedItems, inventoryAdjustments: storedAdjustments, inventoryMovements: storedMovements };
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

  const addWarehouse = useCallback((warehouse: Warehouse) => {
    if (!warehouse.name.trim() || !warehouse.code.trim() || !warehouse.id.trim()) return false;
    let added = false;
    updateStore((current) => {
      const duplicate = current.warehouses.some((existing) => existing.id.toLowerCase() === warehouse.id.toLowerCase()
        || existing.code.toLowerCase() === warehouse.code.toLowerCase()
        || existing.name.toLowerCase() === warehouse.name.toLowerCase());
      if (duplicate) return current;
      added = true;
      return { ...current, warehouses: [...current.warehouses, warehouse] };
    });
    return added;
  }, []);

  const addInventoryItem = useCallback((item: InventoryItem) => {
    const current = getBrowserSnapshot();
    if (!current.warehouses.some((warehouse) => warehouse.name === item.warehouse)) return false;
    const sameSku = current.inventoryItems.filter((existing) => existing.code.toLowerCase() === item.code.toLowerCase());
    if (sameSku.some((existing) => existing.warehouse.toLowerCase() === item.warehouse.toLowerCase())) return false;
    if (sameSku.some((existing) => existing.name.toLowerCase() !== item.name.toLowerCase() || existing.category !== item.category || existing.unit.toLowerCase() !== item.unit.toLowerCase())) return false;
    const createdAt = new Date().toISOString();
    const openingMovement: InventoryMovement = {
      id: `MOV-${Date.now()}`,
      itemCode: item.code,
      itemName: item.name,
      warehouse: item.warehouse,
      type: "IN",
      reason: "Opening stock",
      quantity: item.onHand,
      balanceAfter: item.onHand,
      reference: `OPEN-${item.code}`,
      performedBy: "Inventory Admin",
      occurredAt: createdAt,
    };
    updateStore((current) => current.inventoryItems.some((existing) => existing.code.toLowerCase() === item.code.toLowerCase() && existing.warehouse.toLowerCase() === item.warehouse.toLowerCase())
      ? current
      : { ...current, inventoryItems: [item, ...current.inventoryItems], inventoryMovements: [openingMovement, ...current.inventoryMovements] });
    return true;
  }, []);

  const submitInventoryAdjustment = useCallback((adjustment: Omit<InventoryAdjustment, "id" | "status" | "requestedAt">) => {
    const current = getBrowserSnapshot();
    const item = current.inventoryItems.find((record) => record.code === adjustment.itemCode && record.warehouse === adjustment.warehouse);
    if (!item || !adjustmentReasons.includes(adjustment.reason) || adjustment.notes.trim().length < 8 || !Number.isFinite(adjustment.quantity) || adjustment.quantity <= 0 || (adjustment.direction === "Decrease" && adjustment.quantity > item.onHand)) return false;
    const id = `ADJ-${Date.now()}`;
    updateStore((state) => ({
      ...state,
      inventoryAdjustments: [{ ...adjustment, id, requestedAt: new Date().toISOString(), status: "Pending review" }, ...state.inventoryAdjustments],
    }));
    return true;
  }, []);

  const reviewInventoryAdjustment = useCallback((adjustmentId: string, decision: Extract<AdjustmentStatus, "Approved" | "Returned">, reviewer: string, note?: string) => {
    let reviewed = false;
    updateStore((current) => {
      const adjustment = current.inventoryAdjustments.find((entry) => entry.id === adjustmentId && entry.status === "Pending review");
      if (!adjustment) return current;
      let updatedItems = current.inventoryItems;
      let reviewedAt: string | undefined;
      let newMovement: InventoryMovement | undefined;
      if (decision === "Approved") {
        const itemIndex = current.inventoryItems.findIndex((item) => item.code === adjustment.itemCode && item.warehouse === adjustment.warehouse);
        if (itemIndex < 0) return current;
        const item = current.inventoryItems[itemIndex];
        const onHand = adjustment.direction === "Increase" ? item.onHand + adjustment.quantity : item.onHand - adjustment.quantity;
        if (onHand < 0) return current;
        reviewedAt = new Date().toISOString();
        newMovement = {
          id: `MOV-${Date.now()}`,
          itemCode: adjustment.itemCode,
          itemName: adjustment.itemName,
          warehouse: adjustment.warehouse,
          type: "ADJUSTMENT",
          reason: adjustment.reason,
          quantity: adjustment.direction === "Increase" ? adjustment.quantity : -adjustment.quantity,
          balanceAfter: onHand,
          reference: adjustment.id,
          performedBy: reviewer,
          occurredAt: reviewedAt,
        };
        updatedItems = current.inventoryItems.map((record, index) => index !== itemIndex ? record : {
          ...record,
          onHand,
          status: record.status === "Quality hold" ? record.status : onHand < record.reorderAt ? "Low stock" : "Healthy",
        });
      }
      reviewed = true;
      return {
        ...current,
        inventoryItems: updatedItems,
        inventoryAdjustments: current.inventoryAdjustments.map((entry) => entry.id !== adjustmentId ? entry : {
          ...entry,
          status: decision,
          reviewedBy: reviewer,
          reviewedAt: reviewedAt ?? new Date().toISOString(),
          reviewNote: note,
        }),
        inventoryMovements: newMovement ? [newMovement, ...current.inventoryMovements] : current.inventoryMovements,
      };
    });
    return reviewed;
  }, []);

  const resetDemoStore = useCallback(() => updateStore(() => createInitialState()), []);
  const activeEmployee = demoEmployees.find((employee) => employee.id === state.activeEmployeeId) ?? demoEmployees[0];
  const value = useMemo<DemoStoreValue>(() => ({
    activeEmployee,
    employees: demoEmployees,
    warehouses: state.warehouses,
    inventoryItems: state.inventoryItems,
    inventoryAdjustments: state.inventoryAdjustments,
    inventoryMovements: state.inventoryMovements,
    setActiveEmployee,
    addWarehouse,
    addInventoryItem,
    submitInventoryAdjustment,
    reviewInventoryAdjustment,
    resetDemoStore,
  }), [activeEmployee, state.warehouses, state.inventoryItems, state.inventoryAdjustments, state.inventoryMovements, setActiveEmployee, addWarehouse, addInventoryItem, submitInventoryAdjustment, reviewInventoryAdjustment, resetDemoStore]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return value;
}
