"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { InventoryItem, InventoryStatus } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";

function statusClass(status: InventoryStatus) {
  if (status === "Low stock") return "low";
  if (status === "Quality hold") return "held";
  return "available";
}

export default function InventoryRegister() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All items");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const { inventoryItems: records, addInventoryItem } = useDemoStore();
  const filteredItems = useMemo(() => records.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || `${item.name} ${item.code} ${item.category} ${item.warehouse}`.toLowerCase().includes(query);
    const matchesStatus = filter === "All items" || item.status === filter;
    return matchesQuery && matchesStatus;
  }), [records, search, filter]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const onHand = Number(form.get("onHand"));
    const reorderAt = Number(form.get("reorderAt"));
    const code = String(form.get("code")).trim().toUpperCase();
    const item: InventoryItem = {
      code,
      name: String(form.get("name")).trim(),
      category: String(form.get("category")),
      onHand,
      unit: String(form.get("unit")).trim(),
      reorderAt,
      warehouse: String(form.get("warehouse")).trim(),
      status: onHand < reorderAt ? "Low stock" : "Healthy",
    };
    if (!addInventoryItem(item)) {
      setFormError(`An item with code ${code} already exists.`);
      return;
    }
    setShowForm(false);
    setFormError("");
    setSearch("");
    setFilter("All items");
  }

  return <>
    <section className="inventory-summary" aria-label="Inventory summary">
      <div className="inventory-summary-card"><span>Active items</span><strong>{records.length}</strong></div>
      <div className="inventory-summary-card"><span>Below reorder level</span><strong>{records.filter((item) => item.status === "Low stock").length}</strong></div>
      <div className="inventory-summary-card"><span>On quality hold</span><strong>{records.filter((item) => item.status === "Quality hold").length}</strong></div>
    </section>
    <section className="panel inventory-panel">
    <div className="section-head"><div><h2 className="section-title">Item register</h2><p className="section-note">Showing {filteredItems.length} of {records.length} items</p></div><button className="button-primary" type="button" onClick={() => setShowForm(true)}><span aria-hidden="true">＋</span> Add item</button></div>
    <div className="toolbar">
      <label className="search-box"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by item, code, or warehouse" aria-label="Search inventory"/></label>
      <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter inventory by status"><option>All items</option><option>Healthy</option><option>Low stock</option><option>Quality hold</option></select>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>On hand</th><th>Reorder at</th><th>Warehouse</th><th>Status</th></tr></thead><tbody>
      {filteredItems.length ? filteredItems.map((item) => <tr key={item.code}><td><div className="item-name">{item.name}</div><div className="item-sub">{item.code}</div></td><td>{item.category}</td><td>{item.onHand.toLocaleString()} {item.unit}</td><td>{item.reorderAt.toLocaleString()} {item.unit}</td><td>{item.warehouse}</td><td><span className={`status ${statusClass(item.status)}`}>{item.status}</span></td></tr>) : <tr><td colSpan={6} className="empty-row">No items match that search. Try another name or status.</td></tr>}
    </tbody></table></div>
    </section>
    {showForm && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-item-title"><div className="dialog-head"><div><h2 id="add-item-title">Add inventory item</h2><p>This change is saved only in this browser’s demo store.</p></div><button type="button" className="dialog-close" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div><form className="item-form" onSubmit={addItem}>
      <label>Item name<input name="name" required placeholder="e.g. Raw cocoa beans" autoFocus/></label>
      <div className="form-row"><label>Item code<input name="code" required placeholder="e.g. RM-014"/></label><label>Category<select name="category"><option>Raw material</option><option>Packaging</option><option>Finished goods</option><option>Consumables</option></select></label></div>
      <div className="form-row"><label>Quantity on hand<input name="onHand" type="number" min="0" step="any" required placeholder="0"/></label><label>Unit<input name="unit" required placeholder="kg, L, pcs"/></label></div>
      <div className="form-row"><label>Reorder level<input name="reorderAt" type="number" min="0" step="any" required placeholder="0"/></label><label>Warehouse<input name="warehouse" required placeholder="Warehouse name"/></label></div>
      {formError && <p className="form-error" role="alert">{formError}</p>}<div className="dialog-actions"><button className="button-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="button-primary" type="submit">Add to register</button></div>
    </form></section></div>}
  </>;
}
