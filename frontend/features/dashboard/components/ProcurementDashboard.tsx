import Link from "next/link";
import type { DashboardProps } from "./DashboardPrimitives";
import { demoApprovalRequests, demoPurchaseOrders } from "@/features/procurement/data/demo-data";
import {
  InventoryWatchTable,
  MetricCards,
  PageHeading,
  statusClass,
} from "./DashboardPrimitives";

export function ProcurementDashboard({ employee, items }: DashboardProps) {
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
