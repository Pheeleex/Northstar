import Link from "next/link";
import type { DashboardProps } from "./DashboardPrimitives";
import { demoWarehouseTasks } from "@/features/warehouse/data/demo-data";
import {
  InventoryWatchTable,
  MetricCards,
  PageHeading,
  statusClass,
} from "./DashboardPrimitives";

export function WarehouseLeadDashboard({ employee, items, adjustments }: DashboardProps) {
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
