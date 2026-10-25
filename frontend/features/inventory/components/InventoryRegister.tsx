"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { InventoryItem, Warehouse } from "@/features/inventory/types/inventory.types";
import { InventoryDialogs } from "@/features/inventory/components/InventoryDialogs";
import { InventoryAdjustmentHistory } from "@/features/inventory/components/InventoryAdjustmentHistory";
import {
  InventoryRegisterViews,
  type InventoryView,
} from "@/features/inventory/components/InventoryRegisterViews";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

export default function InventoryRegister() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All items");
  const [showItemForm, setShowItemForm] = useState(false);
  const [showOpeningStockForm, setShowOpeningStockForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [activeView, setActiveView] = useState<InventoryView>("items");
  const [movementWarehouse, setMovementWarehouse] = useState("All warehouses");
  const [formError, setFormError] = useState("");
  const {
    activeEmployee,
    employees,
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
  } = useDemoStore();
  const isAdmin = activeEmployee.role === "Inventory Admin";
  const isWarehouseLead = activeEmployee.role === "Warehouse Lead";
  const canAccessInventory = isAdmin || isWarehouseLead;
  const canSubmitAdjustment = canAccessInventory;
  const openingStockItems = inventoryItems.filter(
    (item) => item.canSetOpeningStock,
  );
  const visibleItems = isWarehouseLead
    ? inventoryItems.filter(
        (item) => item.warehouse === activeEmployee.warehouse,
      )
    : inventoryItems;
  const visibleWarehouses = isWarehouseLead
    ? warehouses.filter(
        (warehouse) => warehouse.name === activeEmployee.warehouse,
      )
    : warehouses;
  const visibleAdjustments = isWarehouseLead
    ? inventoryAdjustments.filter(
        (adjustment) =>
          adjustment.warehouse === activeEmployee.warehouse &&
          adjustment.requestedById === activeEmployee.id,
      )
    : inventoryAdjustments;
  const visibleMovements = inventoryMovements
    .filter(
      (movement) =>
        !isWarehouseLead || movement.warehouse === activeEmployee.warehouse,
    )
    .filter(
      (movement) =>
        movementWarehouse === "All warehouses" ||
        movement.warehouse === movementWarehouse,
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  const warehouseRows = visibleWarehouses.map((warehouse) => {
    const stock = inventoryItems.filter(
      (item) => item.warehouse === warehouse.name,
    );
    const leads = employees
      .filter(
        (employee) =>
          employee.role === "Warehouse Lead" &&
          employee.warehouse === warehouse.name,
      )
      .map(
        (employee) =>
          employee.displayName ?? `${employee.firstName} ${employee.lastName}`,
      );
    return {
      ...warehouse,
      itemCount: stock.length,
      lowStockCount: stock.filter((item) => item.status === "Low stock").length,
      qualityHoldCount: stock.filter((item) => item.status === "Quality hold")
        .length,
      leadNames: leads,
    };
  });
  const companyTotals = inventoryItems.reduce<Map<string, number>>(
    (totals, item) => {
      const code = item.code.toUpperCase();
      totals.set(code, (totals.get(code) ?? 0) + item.onHand);
      return totals;
    },
    new Map(),
  );

  const filteredItems = useMemo(
    () =>
      visibleItems.filter((item) => {
        const query = search.trim().toLowerCase();
        const matchesQuery =
          !query ||
          `${item.name} ${item.code} ${item.category} ${item.warehouse}`
            .toLowerCase()
            .includes(query);
        const matchesStatus = filter === "All items" || item.status === filter;
        return matchesQuery && matchesStatus;
      }),
    [visibleItems, search, filter],
  );

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const openingStock = Number(form.get("openingStock") || 0);
    const reorderAt = Number(form.get("reorderAt"));
    const code = String(form.get("code")).trim().toUpperCase();
    const warehouseName = String(form.get("warehouse"));
    const item: InventoryItem = {
      code,
      name: String(form.get("name")).trim(),
      category: String(form.get("category")),
      onHand: openingStock,
      unit: String(form.get("unit")).trim(),
      reorderAt,
      warehouse: warehouseName,
      status: openingStock < reorderAt ? "Low stock" : "Healthy",
    };
    const matchingSku = inventoryItems.filter(
      (record) => record.code.toLowerCase() === code.toLowerCase(),
    );
    if (matchingSku.some((record) => record.warehouse === warehouseName)) {
      setFormError(
        `Item code ${code} already has a stock record in ${warehouseName}.`,
      );
      return;
    }
    if (
      matchingSku.some(
        (record) =>
          record.name.toLowerCase() !== item.name.toLowerCase() ||
          record.category !== item.category ||
          record.unit.toLowerCase() !== item.unit.toLowerCase(),
      )
    ) {
      setFormError(
        `Item code ${code} must use the same name, category, and unit in every warehouse.`,
      );
      return;
    }
    if (!(await addInventoryItem(item))) {
      setFormError(
        "This item could not be added. Check its code and warehouse, then try again.",
      );
      return;
    }
    setShowItemForm(false);
    setFormError("");
    setSearch("");
    setFilter("All items");
  }

  async function submitOpeningStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const itemLocation = String(form.get("itemLocation"));
    const item = openingStockItems.find(
      (record) => `${record.code}::${record.warehouse}` === itemLocation,
    );
    const quantity = Number(form.get("quantity"));
    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      setFormError(
        "Choose an item and enter an opening quantity greater than zero.",
      );
      return;
    }
    if (
      !(await setOpeningStock({
        itemCode: item.code,
        warehouse: item.warehouse,
        quantity,
        reference: String(form.get("reference") ?? "").trim() || undefined,
      }))
    ) {
      setFormError(
        "Opening stock could not be set. This location may already have stock activity.",
      );
      return;
    }
    setShowOpeningStockForm(false);
    setFormError("");
  }

  async function createWarehouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const code = String(form.get("code")).trim().toUpperCase();
    const warehouse: Warehouse = {
      id: "",
      code,
      name,
    };
    if (!(await addWarehouse(warehouse))) {
      setFormError(
        "A warehouse with that name or code already exists. Choose a different one.",
      );
      return;
    }
    setShowWarehouseForm(false);
    setFormError("");
  }

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const itemLocation = String(form.get("itemLocation"));
    const item = visibleItems.find(
      (record) => `${record.code}::${record.warehouse}` === itemLocation,
    );
    const quantity = Number(form.get("quantity"));
    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      setFormError(
        "Choose an item and enter an adjustment quantity greater than zero.",
      );
      return;
    }
    const direction = String(form.get("direction")) as "Increase" | "Decrease";
    if (direction === "Decrease" && quantity > item.onHand) {
      setFormError(
        `This item only has ${item.onHand.toLocaleString()} ${item.unit} on hand.`,
      );
      return;
    }
    const success = await submitInventoryAdjustment({
      itemCode: item.code,
      itemName: item.name,
      warehouse: item.warehouse,
      direction,
      quantity,
      reason: String(form.get("reason")) as
        | "Count variance"
        | "Damage or spoilage"
        | "Receiving correction"
        | "Expiry"
        | "Other",
      notes: String(form.get("notes")).trim(),
      requestedById: activeEmployee.id,
      requestedBy:
        activeEmployee.displayName ??
        `${activeEmployee.firstName} ${activeEmployee.lastName}`,
    });
    if (!success) {
      setFormError(
        "We couldn’t submit this adjustment. Check the quantity and try again.",
      );
      return;
    }
    setShowAdjustmentForm(false);
    setFormError("");
  }

  if (!canAccessInventory)
    return (
      <section className="panel access-notice">
        <h2 className="section-title">Inventory access is limited</h2>
        <p className="section-note">
          Switch to an Inventory Admin or Warehouse Lead demo user to view
          inventory records.
        </p>
      </section>
    );

  return (
    <>
      <div className="page-heading inventory-page-heading">
        <div>
          <div className="eyebrow">Stock control</div>
          <h1>Inventory</h1>
          <p className="subtitle">
            Keep a clear view of what is on hand, where it is stored, and what
            needs attention.
          </p>
        </div>
        <span className="date-label">
          {isWarehouseLead
            ? activeEmployee.warehouse
            : `${warehouses.length} active warehouses`}
        </span>
      </div>
      <section className="inventory-summary" aria-label="Inventory summary">
        <div className="inventory-summary-card">
          <span>
            {isWarehouseLead ? "Items at this warehouse" : "Active items"}
          </span>
          <strong>{visibleItems.length}</strong>
        </div>
        <div className="inventory-summary-card">
          <span>Below reorder level</span>
          <strong>
            {visibleItems.filter((item) => item.status === "Low stock").length}
          </strong>
        </div>
        <div className="inventory-summary-card">
          <span>On quality hold</span>
          <strong>
            {
              visibleItems.filter((item) => item.status === "Quality hold")
                .length
            }
          </strong>
        </div>
      </section>
      <section className="panel inventory-panel">
        {inventoryLoading && (
          <p className="section-note" role="status">
            Loading inventory from the database…
          </p>
        )}
        {inventoryError && (
          <div className="form-error" role="alert">
            {inventoryError}{" "}
            <button
              className="button-secondary button-small"
              type="button"
              onClick={() => void refreshInventory()}
            >
              Retry
            </button>
          </div>
        )}
        <div className="section-head">
          <div>
            <h2 className="section-title">
              {activeView === "items"
                ? "Item register"
                : activeView === "movements"
                  ? "Stock movements"
                  : "Warehouses"}
            </h2>
            <p className="section-note">
              {activeView === "items"
                ? `Showing ${filteredItems.length} of ${visibleItems.length} items${isWarehouseLead && activeEmployee.warehouse ? ` · ${activeEmployee.warehouse}` : ""}`
                : activeView === "movements"
                  ? "Review quantity changes with their warehouse, reference, and running balance."
                  : `${warehouseRows.length} ${warehouseRows.length === 1 ? "warehouse" : "warehouses"} in this workspace.`}
            </p>
          </div>
          <div className="register-actions">
            {isAdmin &&
              activeView === "items" &&
              openingStockItems.length > 0 && (
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => {
                    setFormError("");
                    setShowOpeningStockForm(true);
                  }}
                >
                  Set opening stock
                </button>
              )}
            {canSubmitAdjustment && activeView === "items" && (
              <button
                className="button-secondary"
                type="button"
                onClick={() => {
                  setFormError("");
                  setShowAdjustmentForm(true);
                }}
              >
                Request adjustment
              </button>
            )}
            {isAdmin && activeView === "items" && (
              <button
                className="button-primary"
                type="button"
                onClick={() => {
                  setFormError("");
                  setShowItemForm(true);
                }}
              >
                <span aria-hidden="true">＋</span> Add item
              </button>
            )}
            {isAdmin && activeView === "warehouses" && (
              <button
                className="button-primary"
                type="button"
                onClick={() => {
                  setFormError("");
                  setShowWarehouseForm(true);
                }}
              >
                <span aria-hidden="true">＋</span> Add warehouse
              </button>
            )}
          </div>
        </div>
        <InventoryRegisterViews
          activeView={activeView}
          setActiveView={setActiveView}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          isAdmin={isAdmin}
          isWarehouseLead={isWarehouseLead}
          visibleItems={visibleItems}
          filteredItems={filteredItems}
          companyTotals={companyTotals}
          visibleMovements={visibleMovements}
          movementWarehouse={movementWarehouse}
          setMovementWarehouse={setMovementWarehouse}
          warehouses={warehouses}
          inventoryItems={inventoryItems}
          warehouseRows={warehouseRows}
        />
      </section>
      <InventoryAdjustmentHistory
        isAdmin={isAdmin}
        adjustments={visibleAdjustments}
      />
      <InventoryDialogs
        showItemForm={showItemForm}
        setShowItemForm={setShowItemForm}
        showOpeningStockForm={showOpeningStockForm}
        setShowOpeningStockForm={setShowOpeningStockForm}
        showWarehouseForm={showWarehouseForm}
        setShowWarehouseForm={setShowWarehouseForm}
        showAdjustmentForm={showAdjustmentForm}
        setShowAdjustmentForm={setShowAdjustmentForm}
        openingStockItems={openingStockItems}
        visibleItems={visibleItems}
        warehouses={warehouses}
        formError={formError}
        addItem={addItem}
        submitOpeningStock={submitOpeningStock}
        createWarehouse={createWarehouse}
        submitAdjustment={submitAdjustment}
      />
    </>
  );
}
