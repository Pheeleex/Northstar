"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoEmployees } from "@/features/workspace/data/demo-users";
import type { DemoEmployee } from "@/features/workspace/data/demo-users";
import { inventoryApi, type InventoryBootstrap } from "@/features/inventory/api/inventory-api";
import type { AdjustmentStatus, InventoryAdjustment, InventoryItem, InventoryMovement, Warehouse } from "@/features/inventory/types/inventory.types";

const PERSONA_KEY = "northstar.demo-persona.v1";

type DemoStoreValue = {
  activeEmployee: DemoEmployee;
  employees: DemoEmployee[];
  warehouses: Warehouse[];
  inventoryItems: InventoryItem[];
  inventoryAdjustments: InventoryAdjustment[];
  inventoryMovements: InventoryMovement[];
  inventoryLoading: boolean;
  inventoryError: string;
  refreshInventory: () => Promise<void>;
  setActiveEmployee: (employeeId: string) => void;
  addWarehouse: (warehouse: Pick<Warehouse, "code" | "name">) => Promise<boolean>;
  addInventoryItem: (item: InventoryItem) => Promise<boolean>;
  submitInventoryAdjustment: (adjustment: Omit<InventoryAdjustment, "id" | "status" | "requestedAt">) => Promise<boolean>;
  reviewInventoryAdjustment: (adjustmentId: string, decision: Extract<AdjustmentStatus, "Approved" | "Returned">, reviewerId: string, note?: string) => Promise<boolean>;
  resetDemoStore: () => Promise<void>;
};

const emptyInventory: InventoryBootstrap = { warehouses: [], items: [], movements: [], adjustments: [] };
const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [activeEmployeeId, setActiveEmployeeId] = useState(demoEmployees[0].id);
  const [inventory, setInventory] = useState<InventoryBootstrap>(emptyInventory);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");

  const refreshInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      setInventory(await inventoryApi.load());
      setInventoryError("");
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : "Could not load inventory.");
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedId = localStorage.getItem(PERSONA_KEY);
      if (storedId && demoEmployees.some((employee) => employee.id === storedId)) setActiveEmployeeId(storedId);
      void refreshInventory();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshInventory]);

  const setActiveEmployee = useCallback((employeeId: string) => {
    if (!demoEmployees.some((employee) => employee.id === employeeId)) return;
    setActiveEmployeeId(employeeId);
    try { localStorage.setItem(PERSONA_KEY, employeeId); } catch { /* persona can remain in memory */ }
  }, []);

  const afterMutation = useCallback(async (action: () => Promise<unknown>) => {
    try {
      await action();
      await refreshInventory();
      return true;
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : "The inventory change could not be saved.");
      return false;
    }
  }, [refreshInventory]);

  const addWarehouse = useCallback((warehouse: Pick<Warehouse, "code" | "name">) => afterMutation(() =>
    inventoryApi.addWarehouse({ actor_id: activeEmployeeId, ...warehouse })), [activeEmployeeId, afterMutation]);

  const addInventoryItem = useCallback((item: InventoryItem) => {
    const warehouse = inventory.warehouses.find((entry) => entry.name === item.warehouse);
    if (!warehouse) return Promise.resolve(false);
    return afterMutation(() => inventoryApi.addItem({
      actor_id: activeEmployeeId,
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      warehouse_id: warehouse.id,
      on_hand: item.onHand,
      reorder_at: item.reorderAt,
    }));
  }, [activeEmployeeId, afterMutation, inventory.warehouses]);

  const submitInventoryAdjustment = useCallback((adjustment: Omit<InventoryAdjustment, "id" | "status" | "requestedAt">) => {
    const warehouse = inventory.warehouses.find((entry) => entry.name === adjustment.warehouse);
    if (!warehouse) return Promise.resolve(false);
    return afterMutation(() => inventoryApi.submitAdjustment({
      actor_id: activeEmployeeId,
      item_code: adjustment.itemCode,
      warehouse_id: warehouse.id,
      direction: adjustment.direction,
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      notes: adjustment.notes,
    }));
  }, [activeEmployeeId, afterMutation, inventory.warehouses]);

  const reviewInventoryAdjustment = useCallback((adjustmentId: string, decision: Extract<AdjustmentStatus, "Approved" | "Returned">, reviewerId: string, note?: string) =>
    afterMutation(() => inventoryApi.reviewAdjustment(adjustmentId, { reviewer_id: reviewerId, decision, note })), [afterMutation]);

  const resetDemoStore = useCallback(async () => {
    setActiveEmployee(demoEmployees[0].id);
    await refreshInventory();
  }, [refreshInventory, setActiveEmployee]);

  const activeEmployee = demoEmployees.find((employee) => employee.id === activeEmployeeId) ?? demoEmployees[0];
  const value = useMemo<DemoStoreValue>(() => ({
    activeEmployee,
    employees: demoEmployees,
    warehouses: inventory.warehouses,
    inventoryItems: inventory.items,
    inventoryAdjustments: inventory.adjustments,
    inventoryMovements: inventory.movements,
    inventoryLoading,
    inventoryError,
    refreshInventory,
    setActiveEmployee,
    addWarehouse,
    addInventoryItem,
    submitInventoryAdjustment,
    reviewInventoryAdjustment,
    resetDemoStore,
  }), [activeEmployee, inventory, inventoryLoading, inventoryError, refreshInventory, setActiveEmployee, addWarehouse, addInventoryItem, submitInventoryAdjustment, reviewInventoryAdjustment, resetDemoStore]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return value;
}
