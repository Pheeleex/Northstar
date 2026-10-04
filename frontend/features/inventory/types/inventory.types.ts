export type InventoryStatus = "Healthy" | "Low stock" | "Quality hold";

export type InventoryItem = {
  code: string;
  name: string;
  category: string;
  onHand: number;
  unit: string;
  reorderAt: number;
  warehouse: string;
  status: InventoryStatus;
};

export type Warehouse = {
  id: string;
  code: string;
  name: string;
};

export type InventoryMovementType = "IN" | "OUT" | "ADJUSTMENT";

export type InventoryMovementReason = "Opening stock" | "Supplier receipt" | "Customer return" | "Transfer" | "Production use" | "Customer dispatch" | "Write-off" | AdjustmentReason;

export type InventoryMovement = {
  id: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  type: InventoryMovementType;
  reason: InventoryMovementReason;
  quantity: number;
  balanceAfter: number;
  reference?: string;
  performedBy: string;
  occurredAt: string;
};

export type AdjustmentStatus = "Pending review" | "Approved" | "Returned";

export type AdjustmentReason = "Count variance" | "Damage or spoilage" | "Receiving correction" | "Expiry" | "Other";

export type InventoryAdjustment = {
  id: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  direction: "Increase" | "Decrease";
  quantity: number;
  reason: AdjustmentReason;
  notes: string;
  requestedById: string;
  requestedBy: string;
  requestedAt: string;
  status: AdjustmentStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
};
