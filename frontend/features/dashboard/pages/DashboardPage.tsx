"use client";

import Link from "next/link";
import { demoApprovalRequests, demoPurchaseOrders } from "@/features/procurement/data/demo-data";
import { demoInspections } from "@/features/quality/data/demo-data";
import { demoWarehouseTasks } from "@/features/warehouse/data/demo-data";
import { recentActivity } from "@/features/dashboard/data/demo-data";
import type { AdjustmentStatus, InventoryAdjustment, InventoryItem, Warehouse } from "@/features/inventory/types/inventory.types";
import type { DemoEmployee } from "@/features/workspace/data/demo-users";
import { useDemoStore } from "@/shared/stores/DemoStoreProvider";

type DashboardProps = {
  employee: DemoEmployee;
  warehouses: Warehouse[];
  items: InventoryItem[];
  adjustments: InventoryAdjustment[];
  reviewAdjustment: (id: string, decision: Extract<AdjustmentStatus, "Approved" | "Returned">, note?: string) => boolean;
};

function PageHeading({ eyebrow, title, subtitle, side }: { eyebrow: string; title: string; subtitle: string; side?: string }) {
  return <div className="page-heading">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>
    {side && <span className="date-label">{side}</span>}
  </div>;
}

function MetricCards({ metrics }: { metrics: { label: string; value: string | number; note: string; tone?: "warning" }[] }) {
  return <section className="metric-grid" aria-label="Dashboard summary">
    {metrics.map((metric) => <article className="metric-card" key={metric.label}><div className="metric-label">{metric.label}</div><div className="metric-value">{metric.value}</div><div className="metric-foot"><span className={`metric-trend ${metric.tone === "warning" ? "warning" : ""}`}>{metric.note}</span></div></article>)}
  </section>;
}

function statusClass(status: string) {
  if (/quality hold|damaged|returned|blocked/i.test(status)) return "held";
  if (/low|overdue|late|high value/i.test(status)) return "low";
  if (/pending|awaiting|expected/i.test(status)) return "pending";
  return "available";
}

function InventoryWatchTable({ items, onlyExceptions = true }: { items: InventoryItem[]; onlyExceptions?: boolean }) {
  const watchItems = onlyExceptions ? items.filter((item) => item.status !== "Healthy") : items;
  return <div className="table-wrap"><table><thead><tr><th>Item</th><th>On hand</th><th>Reorder at</th><th>Status</th></tr></thead><tbody>
    {watchItems.length ? watchItems.map((item) => <tr key={`${item.code}-${item.warehouse}`}><td><div className="item-name">{item.name}</div><div className="item-sub">{item.code} · {item.warehouse}</div></td><td>{item.onHand.toLocaleString()} {item.unit}</td><td>{item.reorderAt.toLocaleString()} {item.unit}</td><td><span className={`status ${statusClass(item.status)}`}>{item.status}</span></td></tr>) : <tr><td colSpan={4} className="empty-row">No items need attention.</td></tr>}
  </tbody></table></div>;
}

function ActivityPanel() {
  return <section className="panel"><div className="section-head"><div><h2 className="section-title">Recent activity</h2><p className="section-note">Updates from across the team.</p></div></div>
    <div className="activity-list">{recentActivity.map((activity) => <div className="activity-row" key={`${activity.actor}-${activity.action}`}><span className="activity-icon">{activity.mark}</span><div className="activity-copy"><strong>{activity.actor}</strong> {activity.action}</div><span className="activity-time">{activity.time}</span></div>)}</div>
  </section>;
}

function InventoryAdminDashboard({ employee, warehouses, items, adjustments, reviewAdjustment }: DashboardProps) {
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

function WarehouseLeadDashboard({ employee, items, adjustments }: DashboardProps) {
  const warehouse = employee.warehouse ?? "Lagos Main Warehouse";
  const localItems = items.filter((item) => item.warehouse === warehouse);
  const localTasks = demoWarehouseTasks.filter((task) => task.warehouse === warehouse);
  const myAdjustments = adjustments.filter((adjustment) => adjustment.warehouse === warehouse && adjustment.requestedById === employee.id);
  const due = localTasks.filter((task) => task.status === "Expected" || task.status === "Queued").length;
  const ready = localTasks.filter((task) => task.status === "Ready").length;

  return <>
    <PageHeading eyebrow="Warehouse operations" title="Today on the floor" subtitle="Your receiving, transfer, dispatch, and stock work in one place." side={warehouse}/>
    <MetricCards metrics={[
      { label: "Work items today", value: localTasks.length, note: "Assigned to this warehouse" },
      { label: "Expected deliveries", value: localTasks.filter((task) => task.kind === "Receive delivery").length, note: "Check receiving plan" },
      { label: "Ready to put away", value: ready, note: "Released by Quality" },
      { label: "Adjustments awaiting review", value: myAdjustments.filter((adjustment) => adjustment.status === "Pending review").length, note: "Submitted to Inventory Admin", tone: myAdjustments.some((adjustment) => adjustment.status === "Pending review") ? "warning" : undefined },
    ]}/>
    <div className="dashboard-grid">
      <div>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Today’s work queue</h2><p className="section-note">Tasks for {warehouse}.</p></div><span className="status pending">{due} due today</span></div>
          <div className="task-list">{localTasks.map((task) => <article className="task-row" key={task.id}><span className="task-mark">{task.kind === "Receive delivery" ? "↓" : task.kind === "Prepare transfer" ? "⇄" : task.kind === "Prepare dispatch" ? "↗" : "✓"}</span><div className="task-copy"><div className="task-title">{task.kind}<span className={`status ${statusClass(task.status)}`}>{task.status}</span></div><p>{task.detail}</p><small>{task.id} · {task.time}</small></div></article>)}</div>
        </section>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Stock at this warehouse</h2><p className="section-note">{localItems.length} item records · {warehouse}</p></div><Link href="/inventory" className="text-link">View register →</Link></div><InventoryWatchTable items={localItems} onlyExceptions={false}/></section>
      </div>
      <div>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Quick actions</h2><p className="section-note">Common warehouse tasks.</p></div></div>
          <div className="quick-links"><Link href="/procurement" className="quick-link"><span className="quick-symbol">↓</span><span><strong>Record a delivery</strong><small>Match goods to a purchase order</small></span><span className="quick-arrow">→</span></Link><Link href="/transfers" className="quick-link"><span className="quick-symbol">⇄</span><span><strong>Manage a transfer</strong><small>Dispatch or receive stock</small></span><span className="quick-arrow">→</span></Link><Link href="/inventory" className="quick-link"><span className="quick-symbol">±</span><span><strong>Request a stock adjustment</strong><small>Reason required · Admin review</small></span><span className="quick-arrow">→</span></Link></div>
        </section>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Your adjustment requests</h2><p className="section-note">Every adjustment needs a reason and Admin review.</p></div><Link href="/inventory" className="text-link">Request adjustment →</Link></div>
          <div className="task-list">{myAdjustments.length ? myAdjustments.map((adjustment) => <article className="task-row" key={adjustment.id}><span className="task-mark">±</span><div className="task-copy"><div className="task-title">{adjustment.itemName}<span className={`status ${statusClass(adjustment.status)}`}>{adjustment.status}</span></div><p>{adjustment.id} · {adjustment.direction === "Decrease" ? "−" : "+"}{adjustment.quantity} · {adjustment.reason}</p><small>{adjustment.notes}{adjustment.reviewNote ? ` · ${adjustment.reviewNote}` : ""}</small></div></article>) : <p className="empty-row">No adjustment requests yet.</p>}</div>
        </section>
        <section className="panel"><div className="section-head"><div><h2 className="section-title">Stock attention</h2><p className="section-note">Local items that may block today’s work.</p></div></div><InventoryWatchTable items={localItems}/></section>
      </div>
    </div>
  </>;
}

function ProcurementDashboard({ employee, items }: DashboardProps) {
  const lowStock = items.filter((item) => item.status === "Low stock");
  const overdue = demoPurchaseOrders.filter((order) => order.status === "Overdue").length;
  return <>
    <PageHeading eyebrow="Procurement" title={`Welcome, ${employee.firstName}`} subtitle="Purchase requests, supplier commitments, and incoming deliveries."/>
    <MetricCards metrics={[
      { label: "Open purchase orders", value: 14, note: "4 awaiting delivery" },
      { label: "Requests in approval", value: demoApprovalRequests.length, note: "Waiting for approvers", tone: "warning" },
      { label: "Overdue deliveries", value: overdue, note: "Follow up with suppliers", tone: overdue ? "warning" : undefined },
      { label: "Stock signals", value: lowStock.length, note: "Items below reorder level", tone: lowStock.length ? "warning" : undefined },
    ]}/>
    <div className="dashboard-grid">
      <div><section className="panel"><div className="section-head"><div><h2 className="section-title">Incoming purchase orders</h2><p className="section-note">Keep expected and late supply visible.</p></div><Link href="/procurement" className="text-link">Open procurement →</Link></div>
        <div className="table-wrap"><table><thead><tr><th>Purchase order</th><th>Supplier</th><th>Delivery</th><th>Status</th></tr></thead><tbody>{demoPurchaseOrders.map((order) => <tr key={order.id}><td><div className="item-name">{order.id}</div><div className="item-sub">{order.summary}</div></td><td>{order.supplier}</td><td>{order.due}</td><td><span className={`status ${statusClass(order.status)}`}>{order.status}</span></td></tr>)}</tbody></table></div>
      </section><section className="panel"><div className="section-head"><div><h2 className="section-title">Items to consider</h2><p className="section-note">Inventory signals to support purchasing decisions.</p></div></div><InventoryWatchTable items={lowStock}/></section></div>
      <div><section className="panel"><div className="section-head"><div><h2 className="section-title">Approval progress</h2><p className="section-note">Requests currently with approvers.</p></div></div><div className="task-list">{demoApprovalRequests.map((request) => <article className="task-row" key={request.id}><span className="task-mark">↗</span><div className="task-copy"><div className="task-title">{request.title}<span className={`status ${statusClass(request.priority)}`}>{request.priority}</span></div><p>{request.id} · {request.supplier}</p><small>Requested by {request.requester} · {request.age}</small></div></article>)}</div></section>
      <div className="demo-notice"><span>ⓘ</span><p><strong>Shared stock context</strong><br/>These reorder signals use the same inventory records shown to Inventory Admin and Warehouse Lead.</p></div></div>
    </div>
  </>;
}

function FinanceDashboard({ employee }: DashboardProps) {
  const highValue = demoApprovalRequests.filter((request) => request.priority === "High value").length;
  const currency = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  return <>
    <PageHeading eyebrow="Procurement approvals" title={`Welcome, ${employee.firstName}`} subtitle="Review purchase requests by value, context, and approval priority."/>
    <MetricCards metrics={[
      { label: "Waiting for review", value: demoApprovalRequests.length, note: "In your approval queue", tone: "warning" },
      { label: "High-value requests", value: highValue, note: "Prioritized for review", tone: "warning" },
      { label: "Total pending value", value: currency.format(demoApprovalRequests.reduce((sum, request) => sum + request.amount, 0)), note: "Across listed requests" },
      { label: "Purchase orders", value: 14, note: "Visible for context" },
    ]}/>
    <div className="dashboard-grid">
      <section className="panel"><div className="section-head"><div><h2 className="section-title">Approval inbox</h2><p className="section-note">Request details and value are visible before opening the full record.</p></div><Link href="/procurement" className="text-link">Open approvals →</Link></div>
        <div className="approval-list">{demoApprovalRequests.map((request) => <article className="approval-row" key={request.id}><div className="approval-main"><div className="approval-heading"><strong>{request.title}</strong><span className={`status ${statusClass(request.priority)}`}>{request.priority}</span></div><div className="item-sub">{request.id} · {request.supplier}</div><div className="approval-meta">Requested by {request.requester} · {request.age}</div></div><strong className="approval-amount">{currency.format(request.amount)}</strong></article>)}</div>
        <div className="demo-notice"><span>ⓘ</span><p><strong>Approval controls are not connected yet.</strong><br/>This view is a demo queue; decisions will be wired to the shared procurement workflow.</p></div>
      </section>
      <section className="panel"><div className="section-head"><div><h2 className="section-title">What to check</h2><p className="section-note">A consistent review checklist for each request.</p></div></div>
        <div className="review-checklist"><div><span>1</span><p><strong>Supplier and terms</strong><small>Confirm the supplier and requested payment terms.</small></p></div><div><span>2</span><p><strong>Quantity and price</strong><small>Compare the requested amount with the order details.</small></p></div><div><span>3</span><p><strong>Operational context</strong><small>Check the linked low-stock or replenishment reason.</small></p></div></div>
      </section>
    </div>
  </>;
}

function QualityDashboard({ employee }: DashboardProps) {
  return <>
    <PageHeading eyebrow="Quality control" title={`Welcome, ${employee.firstName}`} subtitle="Protect product quality and keep lot decisions traceable."/>
    <MetricCards metrics={[
      { label: "Awaiting inspection", value: demoInspections.length, note: "Received stock to review", tone: "warning" },
      { label: "On quality hold", value: 1, note: "Unavailable for use", tone: "warning" },
      { label: "Released today", value: 4, note: "Moved to available stock" },
      { label: "Inspection locations", value: new Set(demoInspections.map((inspection) => inspection.warehouse)).size, note: "Across warehouses" },
    ]}/>
    <section className="panel"><div className="section-head"><div><h2 className="section-title">Inspection queue</h2><p className="section-note">Pending decisions for received lots.</p></div><Link href="/quality" className="text-link">Open quality →</Link></div>
      <div className="table-wrap"><table><thead><tr><th>Item and lot</th><th>Received</th><th>Warehouse</th><th>Status</th></tr></thead><tbody>{demoInspections.map((inspection) => <tr key={inspection.id}><td><div className="item-name">{inspection.item}</div><div className="item-sub">{inspection.id} · {inspection.lot}</div></td><td>{inspection.received}</td><td>{inspection.warehouse}</td><td><span className="status pending">{inspection.status}</span></td></tr>)}</tbody></table></div>
    </section>
  </>;
}

function OperationsDashboard({ employee, items }: DashboardProps) {
  const lowStock = items.filter((item) => item.status === "Low stock").length;
  const held = items.filter((item) => item.status === "Quality hold").length;
  const stages = [
    { name: "Procurement", detail: "4 orders in progress" },
    { name: "Receiving", detail: "2 deliveries expected" },
    { name: "Quality", detail: `${demoInspections.length} inspections pending` },
    { name: "Inventory", detail: `${lowStock + held} items need attention` },
    { name: "Distribution", detail: "6 shipments moving" },
  ];
  return <>
    <PageHeading eyebrow={employee.role === "Managing Director" ? "Executive overview" : "Operations overview"} title={`Welcome, ${employee.firstName}`} subtitle="A cross-functional view of work that needs attention." side="NorthStar Foods · Lagos, Nigeria"/>
    <MetricCards metrics={[
      { label: "Inventory records", value: items.length, note: "Across the demo workspace" },
      { label: "Open purchase orders", value: 14, note: "4 awaiting receipt" },
      { label: "Pending inspections", value: demoInspections.length, note: "Recently received lots", tone: "warning" },
      { label: "Stock exceptions", value: lowStock + held, note: `${lowStock} low · ${held} on hold`, tone: lowStock + held ? "warning" : undefined },
    ]}/>
    <div className="dashboard-grid"><div>
      <section className="panel"><div className="section-head"><div><h2 className="section-title">Supply chain progress</h2><p className="section-note">Follow work from purchase through delivery.</p></div></div><div className="workflow-list">{stages.map((stage, index) => <div className="workflow-step" key={stage.name}><span className="workflow-number">{index + 1}</span><div className="workflow-name">{stage.name}</div><div className="workflow-count">{stage.detail}</div></div>)}</div></section>
      <section className="panel"><div className="section-head"><div><h2 className="section-title">Inventory to watch</h2><p className="section-note">Shared inventory records below reorder level or under review.</p></div></div><InventoryWatchTable items={items}/></section>
    </div><div>
      <section className="panel"><div className="section-head"><div><h2 className="section-title">Needs attention</h2><p className="section-note">Current operational exceptions.</p></div></div><div className="alert-list"><div className="alert-row"><span className="alert-dot"/><div><div className="alert-title">{lowStock} items below reorder level</div><div className="alert-desc">Procurement can review these shared stock signals.</div></div></div><div className="alert-row red"><span className="alert-dot"/><div><div className="alert-title">{held} item on quality hold</div><div className="alert-desc">Held stock is not available to warehouse operations.</div></div></div><div className="alert-row"><span className="alert-dot"/><div><div className="alert-title">{demoApprovalRequests.length} purchase requests awaiting approval</div><div className="alert-desc">Finance Approver can review the procurement queue.</div></div></div></div></section>
      <ActivityPanel/>
    </div></div>
  </>;
}

export default function DashboardPage() {
  const { activeEmployee, warehouses, inventoryItems, inventoryAdjustments, reviewInventoryAdjustment } = useDemoStore();
  const props: DashboardProps = {
    employee: activeEmployee,
    warehouses,
    items: inventoryItems,
    adjustments: inventoryAdjustments,
    reviewAdjustment: (id, decision, note) => reviewInventoryAdjustment(id, decision, activeEmployee.displayName ?? `${activeEmployee.firstName} ${activeEmployee.lastName}`, note),
  };
  switch (activeEmployee.role) {
    case "Inventory Admin": return <InventoryAdminDashboard {...props}/>;
    case "Warehouse Lead": return <WarehouseLeadDashboard {...props}/>;
    case "Procurement Officer": return <ProcurementDashboard {...props}/>;
    case "Finance Approver": return <FinanceDashboard {...props}/>;
    case "Quality Manager": return <QualityDashboard {...props}/>;
    default: return <OperationsDashboard {...props}/>;
  }
}
