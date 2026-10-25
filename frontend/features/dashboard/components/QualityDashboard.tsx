import Link from "next/link";
import type { DashboardProps } from "./DashboardPrimitives";
import { demoInspections } from "@/features/quality/data/demo-data";
import { MetricCards, PageHeading } from "./DashboardPrimitives";

export function QualityDashboard({ employee }: DashboardProps) {
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
