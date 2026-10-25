import Link from "next/link";
import type { DashboardProps } from "./DashboardPrimitives";
import { demoApprovalRequests } from "@/features/procurement/data/demo-data";
import { MetricCards, PageHeading, statusClass } from "./DashboardPrimitives";

export function FinanceDashboard({ employee }: DashboardProps) {
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
