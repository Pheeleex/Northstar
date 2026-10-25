import type {
  AdjustmentStatus,
  InventoryAdjustment,
  InventoryItem,
  Warehouse,
} from "@/features/inventory/types/inventory.types";
import type { DemoEmployee } from "@/features/workspace/data/demo-users";
import { recentActivity } from "@/features/dashboard/data/demo-data";

export type DashboardProps = {
  employee: DemoEmployee;
  warehouses: Warehouse[];
  items: InventoryItem[];
  adjustments: InventoryAdjustment[];
  reviewAdjustment: (id: string, decision: Extract<AdjustmentStatus, "Approved" | "Returned">, note?: string) => Promise<boolean>;
};

export function PageHeading({ eyebrow, title, subtitle, side }: { eyebrow: string; title: string; subtitle: string; side?: string }) {
  return <div className="page-heading">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>
    {side && <span className="date-label">{side}</span>}
  </div>;
}

export function MetricCards({ metrics }: { metrics: { label: string; value: string | number; note: string; tone?: "warning" }[] }) {
  return <section className="metric-grid" aria-label="Dashboard summary">
    {metrics.map((metric) => <article className="metric-card" key={metric.label}><div className="metric-label">{metric.label}</div><div className="metric-value">{metric.value}</div><div className="metric-foot"><span className={`metric-trend ${metric.tone === "warning" ? "warning" : ""}`}>{metric.note}</span></div></article>)}
  </section>;
}

export function statusClass(status: string) {
  if (/quality hold|damaged|returned|blocked/i.test(status)) return "held";
  if (/low|overdue|late|high value/i.test(status)) return "low";
  if (/pending|awaiting|expected/i.test(status)) return "pending";
  return "available";
}

export function InventoryWatchTable({ items, onlyExceptions = true }: { items: InventoryItem[]; onlyExceptions?: boolean }) {
  const watchItems = onlyExceptions ? items.filter((item) => item.status !== "Healthy") : items;
  return <div className="table-wrap"><table><thead><tr><th>Item</th><th>On hand</th><th>Reorder at</th><th>Status</th></tr></thead><tbody>
    {watchItems.length ? watchItems.map((item) => <tr key={`${item.code}-${item.warehouse}`}><td><div className="item-name">{item.name}</div><div className="item-sub">{item.code} · {item.warehouse}</div></td><td>{item.onHand.toLocaleString()} {item.unit}</td><td>{item.reorderAt.toLocaleString()} {item.unit}</td><td><span className={`status ${statusClass(item.status)}`}>{item.status}</span></td></tr>) : <tr><td colSpan={4} className="empty-row">No items need attention.</td></tr>}
  </tbody></table></div>;
}

export function ActivityPanel() {
  return <section className="panel"><div className="section-head"><div><h2 className="section-title">Recent activity</h2><p className="section-note">Updates from across the team.</p></div></div>
    <div className="activity-list">{recentActivity.map((activity) => <div className="activity-row" key={`${activity.actor}-${activity.action}`}><span className="activity-icon">{activity.mark}</span><div className="activity-copy"><strong>{activity.actor}</strong> {activity.action}</div><span className="activity-time">{activity.time}</span></div>)}</div>
  </section>;
}
