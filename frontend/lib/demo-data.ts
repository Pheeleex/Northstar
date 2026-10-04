export type InventoryStatus = "Healthy" | "Low stock" | "Quality hold";

export type DemoEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const demoEmployees: DemoEmployee[] = [
  { id: "grace-okafor", firstName: "Grace", lastName: "Okafor", role: "Operations Manager" },
  { id: "tunde-bello", firstName: "Tunde", lastName: "Bello", role: "Procurement Officer" },
  { id: "amaka-nwosu", firstName: "Amaka", lastName: "Nwosu", role: "Warehouse Lead" },
  { id: "david-mensah", firstName: "David", lastName: "Mensah", role: "Quality Manager" },
  { id: "sarah-adeyemi", firstName: "Sarah", lastName: "Adeyemi", role: "Finance Approver" },
  { id: "michael-cole", firstName: "Michael", lastName: "Cole", role: "Managing Director" },
];

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

export const inventoryItems: InventoryItem[] = [
  { code: "RM-001", name: "Refined Sunflower Oil", category: "Raw material", onHand: 1240, unit: "L", reorderAt: 500, warehouse: "Lagos Main", status: "Healthy" },
  { code: "RM-004", name: "Cocoa Powder", category: "Raw material", onHand: 185, unit: "kg", reorderAt: 250, warehouse: "Lagos Main", status: "Low stock" },
  { code: "PK-012", name: "500ml PET Bottle", category: "Packaging", onHand: 8200, unit: "pcs", reorderAt: 3000, warehouse: "Ikeja Packaging", status: "Healthy" },
  { code: "RM-009", name: "Whole Milk Powder", category: "Raw material", onHand: 0, unit: "kg", reorderAt: 120, warehouse: "Lagos Main", status: "Quality hold" },
  { code: "FG-021", name: "Cocoa Oat Drink 12-pack", category: "Finished goods", onHand: 460, unit: "ctn", reorderAt: 200, warehouse: "Ikeja Finished Goods", status: "Healthy" },
  { code: "PK-008", name: "Printed Carton — 12 pack", category: "Packaging", onHand: 1480, unit: "pcs", reorderAt: 1800, warehouse: "Ikeja Packaging", status: "Low stock" },
];

export const recentActivity = [
  { initials: "AB", actor: "Amaka Nwosu", action: "received PO-2026-0142", time: "12 min ago", mark: "↓" },
  { initials: "DM", actor: "David Mensah", action: "cleared lot LOT-8841 for use", time: "48 min ago", mark: "✓" },
  { initials: "TB", actor: "Tunde Bello", action: "submitted PR-2026-0089 for approval", time: "2 hours ago", mark: "＋" },
  { initials: "AB", actor: "Amaka Nwosu", action: "dispatched transfer TR-2026-0031", time: "3 hours ago", mark: "→" },
];
