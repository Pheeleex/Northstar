"use client";

import { createContext, useContext, useMemo } from "react";
import type { DemoEmployee } from "@/features/workspace/data/demo-users";
import type {
  AdjustmentStatus,
  InventoryAdjustment,
  InventoryItem,
  InventoryMovement,
  Warehouse,
} from "@/features/inventory/types/inventory.types";
import { useDemoPersona } from "@/shared/stores/useDemoPersona";
import { useInventoryStore } from "@/shared/stores/useInventoryStore";

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
  setOpeningStock: (opening: { itemCode: string; warehouse: string; quantity: number; reference?: string }) => Promise<boolean>;
  submitInventoryAdjustment: (adjustment: Omit<InventoryAdjustment, "id" | "status" | "requestedAt">) => Promise<boolean>;
  reviewInventoryAdjustment: (
    adjustmentId: string,
    decision: Extract<AdjustmentStatus, "Approved" | "Returned">,
    reviewerId: string,
    note?: string,
  ) => Promise<boolean>;
};

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const persona = useDemoPersona();
  const {
    warehouses,
    inventoryItems,
    inventoryAdjustments,
    inventoryMovements,
    inventoryLoading,
    inventoryError,
    refreshInventory,
    addWarehouse,
    addInventoryItem,
    setOpeningStock,
    submitInventoryAdjustment,
    reviewInventoryAdjustment,
  } = useInventoryStore(persona.activeEmployeeId);
  const value = useMemo<DemoStoreValue>(() => ({
    activeEmployee: persona.activeEmployee,
    employees: persona.employees,
    warehouses,
    inventoryItems,
    inventoryAdjustments,
    inventoryMovements,
    inventoryLoading,
    inventoryError,
    refreshInventory,
    addWarehouse,
    addInventoryItem,
    setOpeningStock,
    submitInventoryAdjustment,
    reviewInventoryAdjustment,
    setActiveEmployee: persona.setActiveEmployee,
  }), [
    persona.activeEmployee,
    persona.employees,
    persona.setActiveEmployee,
    warehouses,
    inventoryItems,
    inventoryAdjustments,
    inventoryMovements,
    inventoryLoading,
    inventoryError,
    refreshInventory,
    addWarehouse,
    addInventoryItem,
    setOpeningStock,
    submitInventoryAdjustment,
    reviewInventoryAdjustment,
  ]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return value;
}
