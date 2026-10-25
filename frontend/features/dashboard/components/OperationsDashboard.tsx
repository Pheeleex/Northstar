import type { DashboardProps } from "./DashboardPrimitives";
import { demoApprovalRequests } from "@/features/procurement/data/demo-data";
import { demoInspections } from "@/features/quality/data/demo-data";
import {
  ActivityPanel,
  InventoryWatchTable,
  MetricCards,
  PageHeading,
} from "./DashboardPrimitives";

export function OperationsDashboard({ employee, items }: DashboardProps) {
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
