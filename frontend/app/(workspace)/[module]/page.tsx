import Link from "next/link";
import { notFound } from "next/navigation";

const modules: Record<string, { title: string; eyebrow: string; description: string; icon: string; next: string }> = {
  procurement: { title: "Procurement", eyebrow: "Buy with control", description: "Manage suppliers, purchase requests, approvals, and incoming orders in one place.", icon: "＋", next: "Purchase requests and orders" },
  quality: { title: "Quality", eyebrow: "Protect product quality", description: "Review received goods, record inspection decisions, and keep lot history easy to follow.", icon: "✓", next: "Inspection queue and lot decisions" },
  transfers: { title: "Transfers", eyebrow: "Move stock with confidence", description: "Track warehouse transfers from request and dispatch through receipt at the destination.", icon: "⇄", next: "Transfer register and receiving" },
  distribution: { title: "Distribution", eyebrow: "Ship to your customers", description: "Prepare shipments, allocate stock, and follow deliveries through to completion.", icon: "↗", next: "Shipment register and dispatch" },
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const content = modules[module];
  if (!content) notFound();

  return <>
    <div className="page-heading"><div><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p className="subtitle">{content.description}</p></div></div>
    <section className="coming-card"><span className="coming-icon" aria-hidden="true">{content.icon}</span><h2>We’ll build this workflow next</h2><p>This area is part of the NorthStar workspace. We’re building one clear step at a time, starting with the shared dashboard and inventory register. The screen will use the same simple structure as the rest of the app.</p><div className="coming-links"><Link href="/inventory" className="button-secondary">Go to inventory</Link><Link href="/dashboard" className="button-primary">Back to dashboard</Link></div></section>
    <section className="panel next-step-panel"><div className="section-head"><div><h2 className="section-title">Planned first screen</h2><p className="section-note">A focused starting point for this area.</p></div></div><div className="planned-step"><span className="workflow-number">1</span><div><strong>{content.next}</strong><p>We’ll make the main records easy to browse first, then add the actions that change their status.</p></div></div></section>
  </>;
}
