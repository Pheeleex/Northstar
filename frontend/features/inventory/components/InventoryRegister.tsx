"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { InventoryItem, Warehouse } from "@/features/inventory/types/inventory.types";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

function statusClass(status: string) {
  if (status === "Low stock") return "low";
  if (status === "Quality hold" || status === "Returned") return "held";
  if (status === "Pending review") return "pending";
  return "available";
}

export default function InventoryRegister() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All items");
  const [showItemForm, setShowItemForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [activeView, setActiveView] = useState<"items" | "movements" | "warehouses">("items");
  const [movementWarehouse, setMovementWarehouse] = useState("All warehouses");
  const [formError, setFormError] = useState("");
  const { activeEmployee, employees, warehouses, inventoryItems, inventoryAdjustments, inventoryMovements, addWarehouse, addInventoryItem, submitInventoryAdjustment } = useDemoStore();
  const isAdmin = activeEmployee.role === "Inventory Admin";
  const isWarehouseLead = activeEmployee.role === "Warehouse Lead";
  const canAccessInventory = isAdmin || isWarehouseLead;
  const canSubmitAdjustment = canAccessInventory;
  const visibleItems = isWarehouseLead
    ? inventoryItems.filter((item) => item.warehouse === activeEmployee.warehouse)
    : inventoryItems;
  const visibleWarehouses = isWarehouseLead
    ? warehouses.filter((warehouse) => warehouse.name === activeEmployee.warehouse)
    : warehouses;
  const visibleAdjustments = isWarehouseLead
    ? inventoryAdjustments.filter((adjustment) => adjustment.warehouse === activeEmployee.warehouse && adjustment.requestedById === activeEmployee.id)
    : inventoryAdjustments;
  const visibleMovements = inventoryMovements
    .filter((movement) => !isWarehouseLead || movement.warehouse === activeEmployee.warehouse)
    .filter((movement) => movementWarehouse === "All warehouses" || movement.warehouse === movementWarehouse)
    .slice()
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const warehouseRows = visibleWarehouses.map((warehouse) => {
    const stock = inventoryItems.filter((item) => item.warehouse === warehouse.name);
    const leads = employees
      .filter((employee) => employee.role === "Warehouse Lead" && employee.warehouse === warehouse.name)
      .map((employee) => employee.displayName ?? `${employee.firstName} ${employee.lastName}`);
    return {
      ...warehouse,
      itemCount: stock.length,
      lowStockCount: stock.filter((item) => item.status === "Low stock").length,
      qualityHoldCount: stock.filter((item) => item.status === "Quality hold").length,
      leadNames: leads,
    };
  });
  const companyTotals = inventoryItems.reduce<Map<string, number>>((totals, item) => {
    const code = item.code.toUpperCase();
    totals.set(code, (totals.get(code) ?? 0) + item.onHand);
    return totals;
  }, new Map());

  const filteredItems = useMemo(() => visibleItems.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || `${item.name} ${item.code} ${item.category} ${item.warehouse}`.toLowerCase().includes(query);
    const matchesStatus = filter === "All items" || item.status === filter;
    return matchesQuery && matchesStatus;
  }), [visibleItems, search, filter]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const onHand = Number(form.get("onHand"));
    const reorderAt = Number(form.get("reorderAt"));
    const code = String(form.get("code")).trim().toUpperCase();
    const warehouseName = String(form.get("warehouse"));
    const item: InventoryItem = {
      code,
      name: String(form.get("name")).trim(),
      category: String(form.get("category")),
      onHand,
      unit: String(form.get("unit")).trim(),
      reorderAt,
      warehouse: warehouseName,
      status: onHand < reorderAt ? "Low stock" : "Healthy",
    };
    const matchingSku = inventoryItems.filter((record) => record.code.toLowerCase() === code.toLowerCase());
    if (matchingSku.some((record) => record.warehouse === warehouseName)) {
      setFormError(`Item code ${code} already has a stock record in ${warehouseName}.`);
      return;
    }
    if (matchingSku.some((record) => record.name.toLowerCase() !== item.name.toLowerCase() || record.category !== item.category || record.unit.toLowerCase() !== item.unit.toLowerCase())) {
      setFormError(`Item code ${code} must use the same name, category, and unit in every warehouse.`);
      return;
    }
    if (!addInventoryItem(item)) {
      setFormError("This item could not be added. Check its code and warehouse, then try again.");
      return;
    }
    setShowItemForm(false);
    setFormError("");
    setSearch("");
    setFilter("All items");
  }

  function createWarehouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const code = String(form.get("code")).trim().toUpperCase();
    const warehouse: Warehouse = {
      id: `warehouse-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      code,
      name,
    };
    if (!addWarehouse(warehouse)) {
      setFormError("A warehouse with that name or code already exists. Choose a different one.");
      return;
    }
    setShowWarehouseForm(false);
    setFormError("");
  }

  function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const itemLocation = String(form.get("itemLocation"));
    const item = visibleItems.find((record) => `${record.code}::${record.warehouse}` === itemLocation);
    const quantity = Number(form.get("quantity"));
    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Choose an item and enter an adjustment quantity greater than zero.");
      return;
    }
    const direction = String(form.get("direction")) as "Increase" | "Decrease";
    if (direction === "Decrease" && quantity > item.onHand) {
      setFormError(`This item only has ${item.onHand.toLocaleString()} ${item.unit} on hand.`);
      return;
    }
    const success = submitInventoryAdjustment({
      itemCode: item.code,
      itemName: item.name,
      warehouse: item.warehouse,
      direction,
      quantity,
      reason: String(form.get("reason")) as "Count variance" | "Damage or spoilage" | "Receiving correction" | "Expiry" | "Other",
      notes: String(form.get("notes")).trim(),
      requestedById: activeEmployee.id,
      requestedBy: activeEmployee.displayName ?? `${activeEmployee.firstName} ${activeEmployee.lastName}`,
    });
    if (!success) {
      setFormError("We couldn’t submit this adjustment. Check the quantity and try again.");
      return;
    }
    setShowAdjustmentForm(false);
    setFormError("");
  }

  if (!canAccessInventory) return <section className="panel access-notice"><h2 className="section-title">Inventory access is limited</h2><p className="section-note">Switch to an Inventory Admin or Warehouse Lead demo user to view inventory records.</p></section>;

  return <>
    <div className="page-heading inventory-page-heading">
      <div><div className="eyebrow">Stock control</div><h1>Inventory</h1><p className="subtitle">Keep a clear view of what is on hand, where it is stored, and what needs attention.</p></div>
      <span className="date-label">{isWarehouseLead ? activeEmployee.warehouse : `${warehouses.length} active warehouses`}</span>
    </div>
    <section className="inventory-summary" aria-label="Inventory summary">
      <div className="inventory-summary-card"><span>{isWarehouseLead ? "Items at this warehouse" : "Active items"}</span><strong>{visibleItems.length}</strong></div>
      <div className="inventory-summary-card"><span>Below reorder level</span><strong>{visibleItems.filter((item) => item.status === "Low stock").length}</strong></div>
      <div className="inventory-summary-card"><span>On quality hold</span><strong>{visibleItems.filter((item) => item.status === "Quality hold").length}</strong></div>
    </section>
    <section className="panel inventory-panel">
      <div className="section-head"><div><h2 className="section-title">{activeView === "items" ? "Item register" : activeView === "movements" ? "Stock movements" : "Warehouses"}</h2><p className="section-note">{activeView === "items" ? `Showing ${filteredItems.length} of ${visibleItems.length} items${isWarehouseLead && activeEmployee.warehouse ? ` · ${activeEmployee.warehouse}` : ""}` : activeView === "movements" ? "Review quantity changes with their warehouse, reference, and running balance." : `${warehouseRows.length} ${warehouseRows.length === 1 ? "warehouse" : "warehouses"} in this workspace.`}</p></div>
        <div className="register-actions">{canSubmitAdjustment && activeView === "items" && <button className="button-secondary" type="button" onClick={() => { setFormError(""); setShowAdjustmentForm(true); }}>Request adjustment</button>}{isAdmin && activeView === "items" && <button className="button-primary" type="button" onClick={() => { setFormError(""); setShowItemForm(true); }}><span aria-hidden="true">＋</span> Add item</button>}{isAdmin && activeView === "warehouses" && <button className="button-primary" type="button" onClick={() => { setFormError(""); setShowWarehouseForm(true); }}><span aria-hidden="true">＋</span> Add warehouse</button>}</div>
      </div>
      <div className="inventory-tabs" aria-label="Inventory views"><button className={`inventory-tab ${activeView === "items" ? "active" : ""}`} type="button" aria-pressed={activeView === "items"} onClick={() => setActiveView("items")}>Item register <span>{visibleItems.length}</span></button><button className={`inventory-tab ${activeView === "movements" ? "active" : ""}`} type="button" aria-pressed={activeView === "movements"} onClick={() => setActiveView("movements")}>Stock movements <span>{visibleMovements.length}</span></button><button className={`inventory-tab ${activeView === "warehouses" ? "active" : ""}`} type="button" aria-pressed={activeView === "warehouses"} onClick={() => setActiveView("warehouses")}>Warehouses <span>{warehouseRows.length}</span></button></div>
      {activeView === "items" ? <>
      <div className="toolbar">
        <label className="search-box"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by item, code, or warehouse" aria-label="Search inventory"/></label>
        <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter inventory by status"><option>All items</option><option>Healthy</option><option>Low stock</option><option>Quality hold</option></select>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>At warehouse</th>{isAdmin && <th>Company total</th>}<th>Reorder at</th><th>Warehouse</th><th>Status</th></tr></thead><tbody>
        {filteredItems.length ? filteredItems.map((item) => <tr key={`${item.code}-${item.warehouse}`}><td><div className="item-name">{item.name}</div><div className="item-sub">{item.code}</div></td><td>{item.category}</td><td>{item.onHand.toLocaleString()} {item.unit}</td>{isAdmin && <td><strong>{companyTotals.get(item.code.toUpperCase())?.toLocaleString() ?? 0} {item.unit}</strong></td>}<td>{item.reorderAt.toLocaleString()} {item.unit}</td><td>{item.warehouse}</td><td><span className={`status ${statusClass(item.status)}`}>{item.status}</span></td></tr>) : <tr><td colSpan={isAdmin ? 7 : 6} className="empty-row">No items match that search. Try another name or status.</td></tr>}
      </tbody></table></div>
      </> : activeView === "movements" ? <>
        <div className="toolbar movement-toolbar"><p className="section-note">Incoming and outgoing stock, plus approved adjustments. Pending requests do not appear until approved.</p>{!isWarehouseLead && <label className="movement-filter">Warehouse<select className="filter-select" value={movementWarehouse} onChange={(event) => setMovementWarehouse(event.target.value)}><option>All warehouses</option>{warehouses.map((warehouse) => <option key={warehouse.id}>{warehouse.name}</option>)}</select></label>}</div>
        <div className="table-wrap"><table><thead><tr><th>Movement</th><th>Reason</th><th>Item</th><th>Warehouse</th><th>Change</th><th>Balance after</th><th>Reference</th><th>Recorded by</th></tr></thead><tbody>
          {visibleMovements.length ? visibleMovements.map((movement) => {
            const item = inventoryItems.find((record) => record.code === movement.itemCode && record.warehouse === movement.warehouse);
            return <tr key={movement.id}><td><div className={`movement-type ${movement.type.toLowerCase()}`}>{movement.type}</div><div className="item-sub">{new Date(movement.occurredAt).toLocaleString()}</div></td><td>{movement.reason}</td><td><div className="item-name">{movement.itemName}</div><div className="item-sub">{movement.itemCode}</div></td><td>{movement.warehouse}</td><td className={movement.quantity < 0 ? "movement-negative" : "movement-positive"}>{movement.quantity > 0 ? "+" : ""}{movement.quantity.toLocaleString()} {item?.unit}</td><td>{movement.balanceAfter.toLocaleString()} {item?.unit}</td><td>{movement.reference ?? "—"}</td><td>{movement.performedBy}</td></tr>;
          }) : <tr><td colSpan={8} className="empty-row">No stock movements for this warehouse yet.</td></tr>}
        </tbody></table></div>
      </> : <>
        <div className="toolbar warehouse-toolbar"><p className="section-note">Warehouse locations, stock coverage, and assigned Warehouse Leads.</p></div>
        <div className="table-wrap"><table><thead><tr><th>Warehouse</th><th>Code</th><th>Item records</th><th>Low stock</th><th>Quality hold</th><th>Warehouse lead</th></tr></thead><tbody>
          {warehouseRows.length ? warehouseRows.map((warehouse) => <tr key={warehouse.id}><td><div className="item-name">{warehouse.name}</div></td><td>{warehouse.code}</td><td>{warehouse.itemCount}</td><td>{warehouse.lowStockCount || "—"}</td><td>{warehouse.qualityHoldCount || "—"}</td><td>{warehouse.leadNames.length ? warehouse.leadNames.join(", ") : <span className="item-sub">Not assigned · Inventory Admin coverage</span>}</td></tr>) : <tr><td colSpan={6} className="empty-row">No warehouses are set up yet.</td></tr>}
        </tbody></table></div>
      </>}
    </section>

    <section className="panel adjustment-history"><div className="section-head"><div><h2 className="section-title">{isAdmin ? "Adjustment history" : "Your adjustment requests"}</h2><p className="section-note">Each request includes a reason and stays out of stock balances until approved.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Request</th><th>Item and location</th><th>Change</th><th>Reason</th><th>Requested by</th><th>Status</th></tr></thead><tbody>
        {visibleAdjustments.length ? visibleAdjustments.map((adjustment) => <tr key={adjustment.id}><td><div className="item-name">{adjustment.id}</div><div className="item-sub">{new Date(adjustment.requestedAt).toLocaleString()}</div></td><td><div className="item-name">{adjustment.itemName}</div><div className="item-sub">{adjustment.itemCode} · {adjustment.warehouse}</div></td><td>{adjustment.direction === "Decrease" ? "−" : "+"}{adjustment.quantity.toLocaleString()}</td><td><div className="item-name">{adjustment.reason}</div><div className="item-sub">{adjustment.notes}</div></td><td>{adjustment.requestedBy}</td><td><span className={`status ${statusClass(adjustment.status)}`}>{adjustment.status}</span></td></tr>) : <tr><td colSpan={6} className="empty-row">No adjustment requests yet.</td></tr>}
      </tbody></table></div>
    </section>

    {showItemForm && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowItemForm(false); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-item-title"><div className="dialog-head"><div><h2 id="add-item-title">Add inventory item</h2><p>This change is saved only in this browser’s demo store.</p></div><button type="button" className="dialog-close" aria-label="Close" onClick={() => setShowItemForm(false)}>×</button></div><form className="item-form" onSubmit={addItem}>
      <label>Item name<input name="name" required placeholder="e.g. Raw cocoa beans" autoFocus/></label>
      <div className="form-row"><label>Item code<input name="code" required placeholder="e.g. RM-014"/></label><label>Category<select name="category"><option>Raw material</option><option>Packaging</option><option>Finished goods</option><option>Consumables</option></select></label></div>
      <div className="form-row"><label>Quantity on hand<input name="onHand" type="number" min="0" step="any" required placeholder="0"/></label><label>Unit<input name="unit" required placeholder="kg, L, pcs"/></label></div>
      <div className="form-row"><label>Reorder level<input name="reorderAt" type="number" min="0" step="any" required placeholder="0"/></label><label>Warehouse<select name="warehouse" required defaultValue=""><option value="" disabled>Select a warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.name}>{warehouse.name} · {warehouse.code}</option>)}</select></label></div>
      {formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button className="button-secondary" type="button" onClick={() => setShowItemForm(false)}>Cancel</button><button className="button-primary" type="submit">Add to register</button></div>
    </form></section></div>}

    {showWarehouseForm && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowWarehouseForm(false); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-warehouse-title"><div className="dialog-head"><div><h2 id="add-warehouse-title">Add warehouse</h2><p>It will be available in the item register and saved to this browser’s demo store.</p></div><button type="button" className="dialog-close" aria-label="Close" onClick={() => setShowWarehouseForm(false)}>×</button></div><form className="item-form" onSubmit={createWarehouse}>
      <label>Warehouse name<input name="name" required maxLength={60} placeholder="e.g. Abuja Warehouse" autoFocus/></label>
      <label>Warehouse code<input name="code" required maxLength={12} pattern="[A-Za-z0-9-]+" title="Use letters, numbers, and hyphens only" placeholder="e.g. ABJ-01"/></label>
      {formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button className="button-secondary" type="button" onClick={() => setShowWarehouseForm(false)}>Cancel</button><button className="button-primary" type="submit">Add warehouse</button></div>
    </form></section></div>}

    {showAdjustmentForm && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAdjustmentForm(false); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="adjustment-title"><div className="dialog-head"><div><h2 id="adjustment-title">Request stock adjustment</h2><p>Inventory Admin must review this request before the stock balance changes.</p></div><button type="button" className="dialog-close" aria-label="Close" onClick={() => setShowAdjustmentForm(false)}>×</button></div><form className="item-form" onSubmit={submitAdjustment}>
      <label>Item and warehouse<select name="itemLocation" required defaultValue=""><option value="" disabled>Select an item</option>{visibleItems.map((item) => <option key={`${item.code}-${item.warehouse}`} value={`${item.code}::${item.warehouse}`}>{item.name} · {item.warehouse} · {item.onHand.toLocaleString()} {item.unit}</option>)}</select></label>
      <div className="form-row"><label>Adjustment type<select name="direction"><option>Decrease</option><option>Increase</option></select></label><label>Quantity<input name="quantity" type="number" min="0.01" step="any" required placeholder="0"/></label></div>
      <label>Reason<select name="reason" required defaultValue=""><option value="" disabled>Select a reason</option><option>Count variance</option><option>Damage or spoilage</option><option>Receiving correction</option><option>Expiry</option><option>Other</option></select></label>
      <label>Explain the reason<textarea name="notes" required minLength={8} rows={3} placeholder="Describe what happened and how the quantity was confirmed."/></label>
      {formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button className="button-secondary" type="button" onClick={() => setShowAdjustmentForm(false)}>Cancel</button><button className="button-primary" type="submit">Submit for review</button></div>
    </form></section></div>}
  </>;
}
