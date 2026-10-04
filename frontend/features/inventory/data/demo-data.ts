import type { InventoryAdjustment, InventoryItem, InventoryMovement, Warehouse } from "../types/inventory.types";

export const warehouses: Warehouse[] = [
  { id: "lagos-main", code: "LAG-MAIN", name: "Lagos Main Warehouse" },
  { id: "ikeja-warehouse-1", code: "IKE-01", name: "Ikeja Warehouse 1" },
  { id: "ikeja-warehouse-2", code: "IKE-02", name: "Ikeja Warehouse 2" },
];

export const inventoryItems: InventoryItem[] = [
  { code: "RM-001", name: "Refined Sunflower Oil", category: "Raw material", onHand: 1240, unit: "L", reorderAt: 500, warehouse: "Lagos Main Warehouse", status: "Healthy" },
  { code: "RM-004", name: "Cocoa Powder", category: "Raw material", onHand: 185, unit: "kg", reorderAt: 250, warehouse: "Lagos Main Warehouse", status: "Low stock" },
  { code: "PK-012", name: "500ml PET Bottle", category: "Packaging", onHand: 8200, unit: "pcs", reorderAt: 3000, warehouse: "Ikeja Warehouse 1", status: "Healthy" },
  { code: "RM-009", name: "Whole Milk Powder", category: "Raw material", onHand: 0, unit: "kg", reorderAt: 120, warehouse: "Lagos Main Warehouse", status: "Quality hold" },
  { code: "FG-021", name: "Cocoa Oat Drink 12-pack", category: "Finished goods", onHand: 460, unit: "ctn", reorderAt: 200, warehouse: "Ikeja Warehouse 2", status: "Healthy" },
  { code: "PK-008", name: "Printed Carton — 12 pack", category: "Packaging", onHand: 1480, unit: "pcs", reorderAt: 1800, warehouse: "Ikeja Warehouse 1", status: "Low stock" },
];

// Each item's signed movements reconcile to its current seeded on-hand balance.

export const inventoryMovements: InventoryMovement[] = [
  { id: "MOV-001", itemCode: "RM-001", itemName: "Refined Sunflower Oil", warehouse: "Lagos Main Warehouse", type: "IN", reason: "Opening stock", quantity: 1300, balanceAfter: 1300, reference: "OPEN-2026-10", performedBy: "Inventory Admin", occurredAt: "2026-10-01T08:00:00+01:00" },
  { id: "MOV-002", itemCode: "RM-001", itemName: "Refined Sunflower Oil", warehouse: "Lagos Main Warehouse", type: "OUT", reason: "Production use", quantity: -60, balanceAfter: 1240, reference: "ISS-2026-0318", performedBy: "Amaka Nwosu", occurredAt: "2026-10-03T09:15:00+01:00" },
  { id: "MOV-003", itemCode: "RM-004", itemName: "Cocoa Powder", warehouse: "Lagos Main Warehouse", type: "IN", reason: "Opening stock", quantity: 225, balanceAfter: 225, reference: "OPEN-2026-10", performedBy: "Inventory Admin", occurredAt: "2026-10-01T08:05:00+01:00" },
  { id: "MOV-004", itemCode: "RM-004", itemName: "Cocoa Powder", warehouse: "Lagos Main Warehouse", type: "IN", reason: "Supplier receipt", quantity: 18, balanceAfter: 243, reference: "PO-2026-0132", performedBy: "Amaka Nwosu", occurredAt: "2026-10-02T11:20:00+01:00" },
  { id: "MOV-005", itemCode: "RM-004", itemName: "Cocoa Powder", warehouse: "Lagos Main Warehouse", type: "OUT", reason: "Production use", quantity: -58, balanceAfter: 185, reference: "ISS-2026-0321", performedBy: "Amaka Nwosu", occurredAt: "2026-10-03T13:40:00+01:00" },
  { id: "MOV-006", itemCode: "PK-012", itemName: "500ml PET Bottle", warehouse: "Ikeja Warehouse 1", type: "IN", reason: "Opening stock", quantity: 7000, balanceAfter: 7000, reference: "OPEN-2026-10", performedBy: "Inventory Admin", occurredAt: "2026-10-01T08:10:00+01:00" },
  { id: "MOV-007", itemCode: "PK-012", itemName: "500ml PET Bottle", warehouse: "Ikeja Warehouse 1", type: "IN", reason: "Supplier receipt", quantity: 1500, balanceAfter: 8500, reference: "PO-2026-0135", performedBy: "Chidi Okoye", occurredAt: "2026-10-02T14:10:00+01:00" },
  { id: "MOV-008", itemCode: "PK-012", itemName: "500ml PET Bottle", warehouse: "Ikeja Warehouse 1", type: "OUT", reason: "Production use", quantity: -300, balanceAfter: 8200, reference: "ISS-2026-0320", performedBy: "Chidi Okoye", occurredAt: "2026-10-03T15:25:00+01:00" },
  { id: "MOV-009", itemCode: "RM-009", itemName: "Whole Milk Powder", warehouse: "Lagos Main Warehouse", type: "IN", reason: "Opening stock", quantity: 80, balanceAfter: 80, reference: "OPEN-2026-10", performedBy: "Inventory Admin", occurredAt: "2026-10-01T08:15:00+01:00" },
  { id: "MOV-010", itemCode: "RM-009", itemName: "Whole Milk Powder", warehouse: "Lagos Main Warehouse", type: "OUT", reason: "Production use", quantity: -80, balanceAfter: 0, reference: "ISS-2026-0316", performedBy: "Amaka Nwosu", occurredAt: "2026-10-02T16:05:00+01:00" },
  { id: "MOV-011", itemCode: "FG-021", itemName: "Cocoa Oat Drink 12-pack", warehouse: "Ikeja Warehouse 2", type: "IN", reason: "Opening stock", quantity: 500, balanceAfter: 500, reference: "OPEN-2026-10", performedBy: "Inventory Admin", occurredAt: "2026-10-01T08:20:00+01:00" },
  { id: "MOV-012", itemCode: "FG-021", itemName: "Cocoa Oat Drink 12-pack", warehouse: "Ikeja Warehouse 2", type: "OUT", reason: "Customer dispatch", quantity: -40, balanceAfter: 460, reference: "DSP-2026-0207", performedBy: "Muna Bello", occurredAt: "2026-10-03T10:50:00+01:00" },
  { id: "MOV-013", itemCode: "PK-008", itemName: "Printed Carton — 12 pack", warehouse: "Ikeja Warehouse 1", type: "IN", reason: "Opening stock", quantity: 2000, balanceAfter: 2000, reference: "OPEN-2026-10", performedBy: "Inventory Admin", occurredAt: "2026-10-01T08:25:00+01:00" },
  { id: "MOV-014", itemCode: "PK-008", itemName: "Printed Carton — 12 pack", warehouse: "Ikeja Warehouse 1", type: "OUT", reason: "Production use", quantity: -520, balanceAfter: 1480, reference: "ISS-2026-0319", performedBy: "Chidi Okoye", occurredAt: "2026-10-03T12:30:00+01:00" },
];

export const inventoryAdjustments: InventoryAdjustment[] = [
  { id: "ADJ-2026-0012", itemCode: "RM-004", itemName: "Cocoa Powder", warehouse: "Lagos Main Warehouse", direction: "Decrease", quantity: 12, reason: "Count variance", notes: "Physical count was 12 kg below the system balance after the weekly count.", requestedById: "amaka-nwosu", requestedBy: "Amaka Nwosu", requestedAt: "2026-10-04T08:52:00+01:00", status: "Pending review" },
];
