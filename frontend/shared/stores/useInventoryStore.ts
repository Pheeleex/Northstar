import { useCallback, useEffect, useState } from "react";
import { inventoryApi, type InventoryBootstrap } from "@/features/inventory/api/inventory-api";
import type {
  AdjustmentStatus,
  InventoryAdjustment,
  InventoryItem,
  Warehouse,
} from "@/features/inventory/types/inventory.types";

const emptyInventory: InventoryBootstrap = { warehouses: [], items: [], movements: [], adjustments: [] };

export function useInventoryStore(activeEmployeeId: string) {
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
    const timer = window.setTimeout(() => void refreshInventory(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshInventory]);

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
      opening_stock: item.onHand,
      reorder_at: item.reorderAt,
    }));
  }, [activeEmployeeId, afterMutation, inventory.warehouses]);

  const setOpeningStock = useCallback((opening: { itemCode: string; warehouse: string; quantity: number; reference?: string }) => {
    const warehouse = inventory.warehouses.find((entry) => entry.name === opening.warehouse);
    if (!warehouse) return Promise.resolve(false);
    return afterMutation(() => inventoryApi.setOpeningStock({
      actor_id: activeEmployeeId,
      item_code: opening.itemCode,
      warehouse_id: warehouse.id,
      quantity: opening.quantity,
      reference_code: opening.reference,
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

  const reviewInventoryAdjustment = useCallback((
    adjustmentId: string,
    decision: Extract<AdjustmentStatus, "Approved" | "Returned">,
    reviewerId: string,
    note?: string,
  ) => afterMutation(() => inventoryApi.reviewAdjustment(adjustmentId, {
    reviewer_id: reviewerId,
    decision,
    note,
  })), [afterMutation]);

  return {
    warehouses: inventory.warehouses,
    inventoryItems: inventory.items,
    inventoryAdjustments: inventory.adjustments,
    inventoryMovements: inventory.movements,
    inventoryLoading,
    inventoryError,
    refreshInventory,
    addWarehouse,
    addInventoryItem,
    setOpeningStock,
    submitInventoryAdjustment,
    reviewInventoryAdjustment,
  };
}
