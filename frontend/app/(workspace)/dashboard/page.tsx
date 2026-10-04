"use client";

import Link from "next/link";
import { recentActivity } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";

const stages = [
  { name: "Procurement", detail: "4 orders in progress" },
  { name: "Receiving", detail: "2 deliveries expected" },
  { name: "Quality", detail: "3 inspections pending" },
  { name: "Inventory", detail: "2 items need attention" },
  { name: "Distribution", detail: "6 shipments moving" },
];

function statusClass(status: string) {
  if (status === "Low stock") return "low";
  if (status === "Quality hold") return "held";
  return "healthy";
}

export default function DashboardPage() {
  const { activeEmployee, inventoryItems } = useDemoStore();
  const lowStockCount = inventoryItems.filter((item) => item.status === "Low stock").length;
  const holdCount = inventoryItems.filter((item) => item.status === "Quality hold").length;

  return <>
    <div className="page-heading">
      <div><div className="eyebrow">Operations overview</div><h1>Welcome, {activeEmployee.firstName}</h1><p className="subtitle">Here’s the current picture across your operations.</p></div>
      <span className="date-label">NorthStar Foods · Lagos, Nigeria</span>
    </div>

    <section className="metric-grid" aria-label="Operations summary">
      <article className="metric-card"><div className="metric-label">Inventory items</div><div className="metric-value">{inventoryItems.length}</div><div className="metric-foot">in the demo register</div></article>
      <article className="metric-card"><div className="metric-label">Purchase orders</div><div className="metric-value">18</div><div className="metric-foot"><span className="metric-trend">14 open</span> · 4 awaiting receipt</div></article>
      <article className="metric-card"><div className="metric-label">Pending inspections</div><div className="metric-value">3</div><div className="metric-foot"><span className="metric-trend warning">Needs review</span> from recent receipts</div></article>
      <article className="metric-card"><div className="metric-label">Stock to review</div><div className="metric-value">{lowStockCount + holdCount}</div><div className="metric-foot"><span className="metric-trend warning">{lowStockCount} low</span> · {holdCount} on quality hold</div></article>
    </section>

    <div className="dashboard-grid">
      <div>
        <section className="panel">
          <div className="section-head"><div><h2 className="section-title">Your supply chain</h2><p className="section-note">Follow work from purchase to delivery.</p></div><Link href="/procurement" className="text-link">Open workflows →</Link></div>
          <div className="workflow-list">{stages.map((stage, index) => <div className="workflow-step" key={stage.name}><span className="workflow-number">{index + 1}</span><div className="workflow-name">{stage.name}</div><div className="workflow-count">{stage.detail}</div></div>)}</div>
        </section>

        <section className="panel">
          <div className="section-head"><div><h2 className="section-title">Inventory to watch</h2><p className="section-note">Items below their reorder point or under review.</p></div><Link href="/inventory" className="text-link">View inventory →</Link></div>
          <div className="table-wrap"><table><thead><tr><th>Item</th><th>On hand</th><th>Reorder at</th><th>Status</th></tr></thead><tbody>
            {inventoryItems.filter((item) => item.status !== "Healthy").map((item) => <tr key={item.code}><td><div className="item-name">{item.name}</div><div className="item-sub">{item.code} · {item.warehouse}</div></td><td>{item.onHand.toLocaleString()} {item.unit}</td><td>{item.reorderAt.toLocaleString()} {item.unit}</td><td><span className={`status ${statusClass(item.status)}`}>{item.status}</span></td></tr>)}
          </tbody></table></div>
        </section>

        <section className="panel">
          <div className="section-head"><div><h2 className="section-title">Recent activity</h2><p className="section-note">Updates from your team.</p></div><Link href="/inventory" className="text-link">View records →</Link></div>
          <div className="activity-list">{recentActivity.map((activity) => <div className="activity-row" key={`${activity.actor}-${activity.action}`}><span className="activity-icon">{activity.mark}</span><div className="activity-copy"><strong>{activity.actor}</strong> {activity.action}</div><span className="activity-time">{activity.time}</span></div>)}</div>
        </section>
      </div>

      <div>
        <section className="panel">
          <div className="section-head"><div><h2 className="section-title">Needs your attention</h2><p className="section-note">A few things to keep operations moving.</p></div></div>
          <div className="alert-list">
            <div className="alert-row"><span className="alert-dot"/><div><div className="alert-title">{lowStockCount} {lowStockCount === 1 ? "item is" : "items are"} below reorder level</div><div className="alert-desc">Check the inventory register for items that may need replenishment.</div></div></div>
            <div className="alert-row red"><span className="alert-dot"/><div><div className="alert-title">{holdCount} {holdCount === 1 ? "item is" : "items are"} on quality hold</div><div className="alert-desc">Review held items before making them available.</div></div></div>
            <div className="alert-row"><span className="alert-dot"/><div><div className="alert-title">3 inspections are waiting</div><div className="alert-desc">Recent deliveries are pending a quality decision.</div></div></div>
          </div>
        </section>
        <section className="panel">
          <div className="section-head"><div><h2 className="section-title">Quick links</h2><p className="section-note">Common places to go.</p></div></div>
          <div className="quick-links"><Link href="/inventory" className="quick-link"><span className="quick-symbol">▦</span><span><strong>Check stock levels</strong><small>Browse items and warehouses</small></span><span className="quick-arrow">→</span></Link><Link href="/procurement" className="quick-link"><span className="quick-symbol">＋</span><span><strong>Review purchase orders</strong><small>Follow incoming supply</small></span><span className="quick-arrow">→</span></Link><Link href="/quality" className="quick-link"><span className="quick-symbol">✓</span><span><strong>Open quality queue</strong><small>Review pending inspections</small></span><span className="quick-arrow">→</span></Link></div>
        </section>
        <div className="demo-notice"><span>ⓘ</span><p><strong>Demo workspace</strong><br/>Demo changes are saved in this browser only. They are not sent to a backend.</p></div>
      </div>
    </div>
  </>;
}
