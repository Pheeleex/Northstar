"use client";

import { InventoryAdminDashboard } from "@/features/dashboard/components/InventoryAdminDashboard";
import { WarehouseLeadDashboard } from "@/features/dashboard/components/WarehouseLeadDashboard";
import { ProcurementDashboard } from "@/features/dashboard/components/ProcurementDashboard";
import { FinanceDashboard } from "@/features/dashboard/components/FinanceDashboard";
import { QualityDashboard } from "@/features/dashboard/components/QualityDashboard";
import { OperationsDashboard } from "@/features/dashboard/components/OperationsDashboard";
import type { DashboardProps } from "@/features/dashboard/components/DashboardPrimitives";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

export default function DashboardPage() {
  const { activeEmployee, warehouses, inventoryItems, inventoryAdjustments, inventoryLoading, inventoryError, refreshInventory, reviewInventoryAdjustment } = useDemoStore();
  const props: DashboardProps = {
    employee: activeEmployee,
    warehouses,
    items: inventoryItems,
    adjustments: inventoryAdjustments,
    reviewAdjustment: (id, decision, note) => reviewInventoryAdjustment(id, decision, activeEmployee.id, note),
  };
  if (inventoryLoading) return <section className="panel access-notice"><h2 className="section-title">Loading workspace data</h2><p className="section-note">Connecting to the inventory database…</p></section>;
  if (inventoryError) return <section className="panel access-notice"><h2 className="section-title">Could not load workspace data</h2><p className="section-note">{inventoryError}</p><button className="button-secondary" type="button" onClick={() => void refreshInventory()}>Retry</button></section>;
  switch (activeEmployee.role) {
    case "Inventory Admin": return <InventoryAdminDashboard {...props}/>;
    case "Warehouse Lead": return <WarehouseLeadDashboard {...props}/>;
    case "Procurement Officer": return <ProcurementDashboard {...props}/>;
    case "Finance Approver": return <FinanceDashboard {...props}/>;
    case "Quality Manager": return <QualityDashboard {...props}/>;
    default: return <OperationsDashboard {...props}/>;
  }
}
