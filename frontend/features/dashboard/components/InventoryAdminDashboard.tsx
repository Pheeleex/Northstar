import Link from "next/link";
import type { DashboardProps } from "./DashboardPrimitives";
import {
  ActivityPanel,
  InventoryWatchTable,
  MetricCards,
  PageHeading,
} from "./DashboardPrimitives";

export function InventoryAdminDashboard({ employee, warehouses, items, adjustments, reviewAdjustment }: DashboardProps) {
  const warehouseRows = warehouses.map((warehouse) => {
    const stock = items.filter((item) => item.warehouse === warehouse.name);
    return { name: warehouse.name, skuCount: stock.length, low: stock.filter((item) => item.status === "Low stock").length, holds: stock.filter((item) => item.status === "Quality hold").length };
  });
  const lowStock = items.filter((item) => item.status === "Low stock").length;
  const held = items.filter((item) => item.status === "Quality hold").length;
  const pendingAdjustments = adjustments.filter((adjustment) => adjustment.status === "Pending review");

  return <>
    <PageHeading eyebrow="Inventory control" title="Inventory overview" subtitle={`Company-wide stock position across ${warehouseRows.length} warehouses.`} side={`Welcome, ${employee.displayName ?? employee.firstName}`} />
    <MetricCards metrics={[
      { label: "Active item records", value: items.length, note: "In the shared register" },
      { label: "Below reorder level", value: lowStock, note: "Replenishment to review", tone: lowStock ? "warning" : undefined },
      { label: "On quality hold", value: held, note: "Unavailable until released", tone: held ? "warning" : undefined },
      { label: "Adjustments to review", value: pendingAdjustments.length, note: "Submitted by warehouse teams", tone: pendingAdjustments.length ? "warning" : undefined },
    ]}/>
    <div className="dashboard-grid">
      <div>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Stock by warehouse</h2><p className="section-note">Item coverage and exceptions at each location.</p></div><Link href="/inventory" className="text-link">Open inventory →</Link></div>
          <div className="table-wrap"><table><thead><tr><th>Warehouse</th><th>Items</th><th>Low stock</th><th>Quality hold</th></tr></thead><tbody>{warehouseRows.map((warehouse) => <tr key={warehouse.name}><td><div className="item-name">{warehouse.name}</div></td><td>{warehouse.skuCount}</td><td>{warehouse.low || "—"}</td><td>{warehouse.holds || "—"}</td></tr>)}</tbody></table></div>
        </section>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Inventory exceptions</h2><p className="section-note">Low stock and held items from the shared inventory register.</p></div></div><InventoryWatchTable items={items}/></section>
      </div>
      <div>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Adjustment review</h2><p className="section-note">Warehouse changes need your approval before stock updates.</p></div><span className={`status ${pendingAdjustments.length ? "pending" : "available"}`}>{pendingAdjustments.length} pending</span></div>
          {pendingAdjustments.length ? <div className="adjustment-review-list">{pendingAdjustments.map((adjustment) => <article className="adjustment-review-row" key={adjustment.id}><div className="adjustment-review-heading"><strong>{adjustment.id} · {adjustment.direction === "Decrease" ? "−" : "+"}{adjustment.quantity.toLocaleString()}</strong><span>{adjustment.warehouse}</span></div><div className="item-name">{adjustment.itemName} <span className="item-sub inline">({adjustment.itemCode})</span></div><div className="adjustment-reason"><strong>{adjustment.reason}</strong><p>{adjustment.notes}</p><small>Requested by {adjustment.requestedBy} · {new Date(adjustment.requestedAt).toLocaleString()}</small></div><div className="review-actions"><button className="button-primary button-small" type="button" onClick={() => reviewAdjustment(adjustment.id, "Approved")}>Approve and post</button><button className="button-secondary button-return button-small" type="button" onClick={() => reviewAdjustment(adjustment.id, "Returned", "Please check the count and add supporting detail.")}>Return for correction</button></div></article>)}</div> : <p className="empty-row">No adjustments are waiting for review.</p>}
        </section>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Admin work</h2><p className="section-note">Controls for the full inventory operation.</p></div></div>
          <div className="quick-links"><Link href="/inventory" className="quick-link"><span className="quick-symbol">＋</span><span><strong>Maintain item register</strong><small>Add and review stock items</small></span><span className="quick-arrow">→</span></Link><Link href="/inventory" className="quick-link"><span className="quick-symbol">↕</span><span><strong>Review stock exceptions</strong><small>{lowStock + held} items need attention</small></span><span className="quick-arrow">→</span></Link><Link href="/inventory" className="quick-link"><span className="quick-symbol">▦</span><span><strong>View all warehouses</strong><small>Compare inventory by location</small></span><span className="quick-arrow">→</span></Link></div>
        </section>
        <ActivityPanel/>
      </div>
    </div>
  </>;
}
