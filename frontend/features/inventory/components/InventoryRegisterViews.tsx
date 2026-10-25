import type {
  InventoryItem,
  InventoryMovement,
  InventoryStatus,
  Warehouse,
} from "@/features/inventory/types/inventory.types";

export type InventoryView = "items" | "movements" | "warehouses";

type WarehouseRow = Warehouse & {
  itemCount: number;
  lowStockCount: number;
  qualityHoldCount: number;
  leadNames: string[];
};

type InventoryRegisterViewsProps = {
  activeView: InventoryView;
  setActiveView: (view: InventoryView) => void;
  search: string;
  setSearch: (search: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  isAdmin: boolean;
  isWarehouseLead: boolean;
  visibleItems: InventoryItem[];
  filteredItems: InventoryItem[];
  companyTotals: Map<string, number>;
  visibleMovements: InventoryMovement[];
  movementWarehouse: string;
  setMovementWarehouse: (warehouse: string) => void;
  warehouses: Warehouse[];
  inventoryItems: InventoryItem[];
  warehouseRows: WarehouseRow[];
};

function statusClass(status: InventoryStatus) {
  if (status === "Low stock") return "low";
  if (status === "Quality hold") return "held";
  return "available";
}

export function InventoryRegisterViews({
  activeView,
  setActiveView,
  search,
  setSearch,
  filter,
  setFilter,
  isAdmin,
  isWarehouseLead,
  visibleItems,
  filteredItems,
  companyTotals,
  visibleMovements,
  movementWarehouse,
  setMovementWarehouse,
  warehouses,
  inventoryItems,
  warehouseRows,
}: InventoryRegisterViewsProps) {
  return (
    <>
      <div className="inventory-tabs" aria-label="Inventory views">
        <button
          className={`inventory-tab ${activeView === "items" ? "active" : ""}`}
          type="button"
          aria-pressed={activeView === "items"}
          onClick={() => setActiveView("items")}
        >
          Item register <span>{visibleItems.length}</span>
        </button>
        <button
          className={`inventory-tab ${activeView === "movements" ? "active" : ""}`}
          type="button"
          aria-pressed={activeView === "movements"}
          onClick={() => setActiveView("movements")}
        >
          Stock movements <span>{visibleMovements.length}</span>
        </button>
        <button
          className={`inventory-tab ${activeView === "warehouses" ? "active" : ""}`}
          type="button"
          aria-pressed={activeView === "warehouses"}
          onClick={() => setActiveView("warehouses")}
        >
          Warehouses <span>{warehouseRows.length}</span>
        </button>
      </div>
      {activeView === "items" ? (
        <>
          <div className="toolbar">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by item, code, or warehouse"
                aria-label="Search inventory"
              />
            </label>
            <select
              className="filter-select"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter inventory by status"
            >
              <option>All items</option>
              <option>Healthy</option>
              <option>Low stock</option>
              <option>Quality hold</option>
            </select>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>At warehouse</th>
                  {isAdmin && <th>Company total</th>}
                  <th>Reorder at</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length ? (
                  filteredItems.map((item) => (
                    <tr key={`${item.code}-${item.warehouse}`}>
                      <td>
                        <div className="item-name">{item.name}</div>
                        <div className="item-sub">{item.code}</div>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        {item.onHand.toLocaleString()} {item.unit}
                      </td>
                      {isAdmin && (
                        <td>
                          <strong>
                            {companyTotals
                              .get(item.code.toUpperCase())
                              ?.toLocaleString() ?? 0}{" "}
                            {item.unit}
                          </strong>
                        </td>
                      )}
                      <td>
                        {item.reorderAt.toLocaleString()} {item.unit}
                      </td>
                      <td>{item.warehouse}</td>
                      <td>
                        <span
                          className={`status ${statusClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="empty-row">
                      No items match that search. Try another name or status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
    </>
  ) : activeView === "movements" ? (
    <>
      <div className="toolbar movement-toolbar">
        <p className="section-note">
          Incoming and outgoing stock, plus approved adjustments. Pending
          requests do not appear until approved.
        </p>
        {!isWarehouseLead && (
          <label className="movement-filter">
            Warehouse
            <select
              className="filter-select"
              value={movementWarehouse}
              onChange={(event) =>
                setMovementWarehouse(event.target.value)
              }
            >
              <option>All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Movement</th>
              <th>Reason</th>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Change</th>
              <th>Balance after</th>
              <th>Reference</th>
              <th>Recorded by</th>
            </tr>
          </thead>
          <tbody>
            {visibleMovements.length ? (
              visibleMovements.map((movement) => {
                const item = inventoryItems.find(
                  (record) =>
                    record.code === movement.itemCode &&
                    record.warehouse === movement.warehouse,
                );
                return (
                  <tr key={movement.id}>
                    <td>
                      <div
                        className={`movement-type ${movement.type.toLowerCase()}`}
                      >
                        {movement.type}
                      </div>
                      <div className="item-sub">
                        {new Date(movement.occurredAt).toLocaleString()}
                      </div>
                    </td>
                    <td>{movement.reason}</td>
                    <td>
                      <div className="item-name">{movement.itemName}</div>
                      <div className="item-sub">{movement.itemCode}</div>
                    </td>
                    <td>{movement.warehouse}</td>
                    <td
                      className={
                        movement.quantity < 0
                          ? "movement-negative"
                          : "movement-positive"
                      }
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity.toLocaleString()} {item?.unit}
                    </td>
                    <td>
                      {movement.balanceAfter.toLocaleString()}{" "}
                      {item?.unit}
                    </td>
                    <td>{movement.reference ?? "—"}</td>
                    <td>{movement.performedBy}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="empty-row">
                  No stock movements for this warehouse yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <>
      <div className="toolbar warehouse-toolbar">
        <p className="section-note">
          Warehouse locations, stock coverage, and assigned Warehouse
          Leads.
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Code</th>
              <th>Item records</th>
              <th>Low stock</th>
              <th>Quality hold</th>
              <th>Warehouse lead</th>
            </tr>
          </thead>
          <tbody>
            {warehouseRows.length ? (
              warehouseRows.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td>
                    <div className="item-name">{warehouse.name}</div>
                  </td>
                  <td>{warehouse.code}</td>
                  <td>{warehouse.itemCount}</td>
                  <td>{warehouse.lowStockCount || "—"}</td>
                  <td>{warehouse.qualityHoldCount || "—"}</td>
                  <td>
                    {warehouse.leadNames.length ? (
                      warehouse.leadNames.join(", ")
                    ) : (
                      <span className="item-sub">
                        Not assigned · Inventory Admin coverage
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-row">
                  No warehouses are set up yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )}
    </>
  );
}
