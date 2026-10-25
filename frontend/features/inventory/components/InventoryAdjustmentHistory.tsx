import type { InventoryAdjustment } from "@/features/inventory/types/inventory.types";

function statusClass(status: InventoryAdjustment["status"]) {
  if (status === "Returned") return "held";
  if (status === "Pending review") return "pending";
  return "available";
}

export function InventoryAdjustmentHistory({
  isAdmin,
  adjustments,
}: {
  isAdmin: boolean;
  adjustments: InventoryAdjustment[];
}) {
  return (
    <section className="panel adjustment-history">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            {isAdmin ? "Adjustment history" : "Your adjustment requests"}
          </h2>
          <p className="section-note">
            Each request includes a reason and stays out of stock balances until approved.
          </p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request</th>
              <th>Item and location</th>
              <th>Change</th>
              <th>Reason</th>
              <th>Requested by</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.length ? (
              adjustments.map((adjustment) => (
                <tr key={adjustment.id}>
                  <td>
                    <div className="item-name">{adjustment.id}</div>
                    <div className="item-sub">
                      {new Date(adjustment.requestedAt).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="item-name">{adjustment.itemName}</div>
                    <div className="item-sub">
                      {adjustment.itemCode} · {adjustment.warehouse}
                    </div>
                  </td>
                  <td>
                    {adjustment.direction === "Decrease" ? "−" : "+"}
                    {adjustment.quantity.toLocaleString()}
                  </td>
                  <td>
                    <div className="item-name">{adjustment.reason}</div>
                    <div className="item-sub">{adjustment.notes}</div>
                  </td>
                  <td>{adjustment.requestedBy}</td>
                  <td>
                    <span className={`status ${statusClass(adjustment.status)}`}>
                      {adjustment.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-row">
                  No adjustment requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
