"""Seed the NorthStar demo workspace with its initial inventory records.

Run from ``backend/`` with ``uv run python -m app.seed_demo_data``. The seed is
additive and safe to rerun: existing workspace data is never overwritten.
"""

from datetime import datetime
from decimal import Decimal
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy import select

from app.db.session import SessionLocal
from app.core.demo_workspace import DEMO_WORKSPACE_ID
from app.features.inventory.models import (
    InventoryAdjustment,
    InventoryMovement,
    Product,
    User,
    Warehouse,
    WarehouseAssignment,
    WarehouseStock,
    Workspace,
    WorkspaceMembership,
)


def stable_id(key: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"northstar-demo:{key}")


WORKSPACE_ID = DEMO_WORKSPACE_ID

DEMO_USERS = [
    ("grace-okafor", "Grace Okafor", "OPERATIONS_MANAGER", None),
    ("tunde-bello", "Tunde Bello", "PROCUREMENT_OFFICER", None),
    ("amaka-nwosu", "Amaka Nwosu", "WAREHOUSE_LEAD", "LAG-MAIN"),
    ("chidi-okoye", "Chidi Okoye", "WAREHOUSE_LEAD", "IKE-01"),
    ("muna-bello", "Muna Bello", "WAREHOUSE_LEAD", "IKE-02"),
    ("david-mensah", "David Mensah", "QUALITY_MANAGER", None),
    ("sarah-adeyemi", "Sarah Adeyemi", "FINANCE_APPROVER", None),
    ("michael-cole", "Michael Cole", "MANAGING_DIRECTOR", None),
    ("inventory-admin", "Inventory Admin", "INVENTORY_ADMIN", None),
]

DEMO_WAREHOUSES = [
    ("LAG-MAIN", "Lagos Main Warehouse"),
    ("IKE-01", "Ikeja Warehouse 1"),
    ("IKE-02", "Ikeja Warehouse 2"),
]

DEMO_ITEMS = [
    ("RM-001", "Refined Sunflower Oil", "Raw material", "L", "LAG-MAIN", 1240, 500, False),
    ("RM-004", "Cocoa Powder", "Raw material", "kg", "LAG-MAIN", 185, 250, False),
    ("PK-012", "500ml PET Bottle", "Packaging", "pcs", "IKE-01", 8200, 3000, False),
    ("RM-009", "Whole Milk Powder", "Raw material", "kg", "LAG-MAIN", 0, 120, True),
    ("FG-021", "Cocoa Oat Drink 12-pack", "Finished goods", "ctn", "IKE-02", 460, 200, False),
    ("PK-008", "Printed Carton — 12 pack", "Packaging", "pcs", "IKE-01", 1480, 1800, False),
]

# id, SKU, warehouse code, movement type, reason, signed quantity, balance,
# reference, demo user key, timestamp
DEMO_MOVEMENTS = [
    ("MOV-001", "RM-001", "LAG-MAIN", "IN", "OPENING_STOCK", 1300, 1300, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:00:00+01:00"),
    ("MOV-002", "RM-001", "LAG-MAIN", "OUT", "PRODUCTION_USE", -60, 1240, "ISS-2026-0318", "amaka-nwosu", "2026-10-03T09:15:00+01:00"),
    ("MOV-003", "RM-004", "LAG-MAIN", "IN", "OPENING_STOCK", 225, 225, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:05:00+01:00"),
    ("MOV-004", "RM-004", "LAG-MAIN", "IN", "SUPPLIER_RECEIPT", 18, 243, "PO-2026-0132", "amaka-nwosu", "2026-10-02T11:20:00+01:00"),
    ("MOV-005", "RM-004", "LAG-MAIN", "OUT", "PRODUCTION_USE", -58, 185, "ISS-2026-0321", "amaka-nwosu", "2026-10-03T13:40:00+01:00"),
    ("MOV-006", "PK-012", "IKE-01", "IN", "OPENING_STOCK", 7000, 7000, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:10:00+01:00"),
    ("MOV-007", "PK-012", "IKE-01", "IN", "SUPPLIER_RECEIPT", 1500, 8500, "PO-2026-0135", "chidi-okoye", "2026-10-02T14:10:00+01:00"),
    ("MOV-008", "PK-012", "IKE-01", "OUT", "PRODUCTION_USE", -300, 8200, "ISS-2026-0320", "chidi-okoye", "2026-10-03T15:25:00+01:00"),
    ("MOV-009", "RM-009", "LAG-MAIN", "IN", "OPENING_STOCK", 80, 80, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:15:00+01:00"),
    ("MOV-010", "RM-009", "LAG-MAIN", "OUT", "PRODUCTION_USE", -80, 0, "ISS-2026-0316", "amaka-nwosu", "2026-10-02T16:05:00+01:00"),
    ("MOV-011", "FG-021", "IKE-02", "IN", "OPENING_STOCK", 500, 500, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:20:00+01:00"),
    ("MOV-012", "FG-021", "IKE-02", "OUT", "CUSTOMER_DISPATCH", -40, 460, "DSP-2026-0207", "muna-bello", "2026-10-03T10:50:00+01:00"),
    ("MOV-013", "PK-008", "IKE-01", "IN", "OPENING_STOCK", 2000, 2000, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:25:00+01:00"),
    ("MOV-014", "PK-008", "IKE-01", "OUT", "PRODUCTION_USE", -520, 1480, "ISS-2026-0319", "chidi-okoye", "2026-10-03T12:30:00+01:00"),
]


def seed_demo_data() -> None:
    with SessionLocal.begin() as session:
        workspace = session.get(Workspace, WORKSPACE_ID)
        if workspace is None:
            session.add(Workspace(id=WORKSPACE_ID, name="NorthStar Foods"))
            session.flush()

        users: dict[str, User] = {}
        memberships: dict[str, WorkspaceMembership] = {}
        for demo_key, display_name, role_code, _warehouse_code in DEMO_USERS:
            user = session.scalar(select(User).where(User.demo_key == demo_key))
            if user is None:
                user = User(
                    id=stable_id(f"user:{demo_key}"),
                    demo_key=demo_key,
                    display_name=display_name,
                )
                session.add(user)
                session.flush()
            users[demo_key] = user

            membership = session.scalar(
                select(WorkspaceMembership).where(
                    WorkspaceMembership.workspace_id == WORKSPACE_ID,
                    WorkspaceMembership.user_id == user.id,
                )
            )
            if membership is None:
                membership = WorkspaceMembership(
                    id=stable_id(f"membership:{demo_key}"),
                    workspace_id=WORKSPACE_ID,
                    user_id=user.id,
                    role_code=role_code,
                )
                session.add(membership)
                session.flush()
            memberships[demo_key] = membership

        warehouses: dict[str, Warehouse] = {}
        for code, name in DEMO_WAREHOUSES:
            warehouse = session.scalar(
                select(Warehouse).where(
                    Warehouse.workspace_id == WORKSPACE_ID,
                    Warehouse.code == code,
                )
            )
            if warehouse is None:
                warehouse = Warehouse(
                    id=stable_id(f"warehouse:{code}"),
                    workspace_id=WORKSPACE_ID,
                    code=code,
                    name=name,
                )
                session.add(warehouse)
                session.flush()
            warehouses[code] = warehouse

        for demo_key, _display_name, role_code, warehouse_code in DEMO_USERS:
            if role_code != "WAREHOUSE_LEAD" or warehouse_code is None:
                continue
            assignment = session.get(
                WarehouseAssignment,
                (memberships[demo_key].id, warehouses[warehouse_code].id),
            )
            if assignment is None:
                session.add(
                    WarehouseAssignment(
                        workspace_id=WORKSPACE_ID,
                        membership_id=memberships[demo_key].id,
                        warehouse_id=warehouses[warehouse_code].id,
                    )
                )

        products: dict[str, Product] = {}
        stocks: dict[tuple[str, str], WarehouseStock] = {}
        for sku, name, category, unit, warehouse_code, on_hand, reorder_level, quality_hold in DEMO_ITEMS:
            product = session.scalar(
                select(Product).where(
                    Product.workspace_id == WORKSPACE_ID,
                    Product.sku == sku,
                )
            )
            if product is None:
                product = Product(
                    id=stable_id(f"product:{sku}"),
                    workspace_id=WORKSPACE_ID,
                    sku=sku,
                    name=name,
                    category=category,
                    base_unit=unit,
                )
                session.add(product)
                session.flush()
            products[sku] = product

            stock = session.scalar(
                select(WarehouseStock).where(
                    WarehouseStock.workspace_id == WORKSPACE_ID,
                    WarehouseStock.warehouse_id == warehouses[warehouse_code].id,
                    WarehouseStock.product_id == product.id,
                )
            )
            if stock is None:
                stock = WarehouseStock(
                    id=stable_id(f"stock:{sku}:{warehouse_code}"),
                    workspace_id=WORKSPACE_ID,
                    warehouse_id=warehouses[warehouse_code].id,
                    product_id=product.id,
                    on_hand_quantity=Decimal(str(on_hand)),
                    reorder_level=Decimal(str(reorder_level)),
                    is_quality_hold=quality_hold,
                )
                session.add(stock)
                session.flush()
            stocks[(sku, warehouse_code)] = stock

        for (
            source_id,
            sku,
            warehouse_code,
            movement_type,
            reason_code,
            quantity_delta,
            balance_after,
            reference_code,
            demo_key,
            occurred_at,
        ) in DEMO_MOVEMENTS:
            movement_id = stable_id(f"movement:{source_id}")
            if session.get(InventoryMovement, movement_id) is not None:
                continue
            stock = stocks[(sku, warehouse_code)]
            session.add(
                InventoryMovement(
                    id=movement_id,
                    workspace_id=WORKSPACE_ID,
                    warehouse_id=stock.warehouse_id,
                    product_id=stock.product_id,
                    movement_type=movement_type,
                    reason_code=reason_code,
                    quantity_delta=Decimal(str(quantity_delta)),
                    balance_after=Decimal(str(balance_after)),
                    reference_code=reference_code,
                    recorded_by_membership_id=memberships[demo_key].id,
                    recorded_at=datetime.fromisoformat(occurred_at),
                )
            )

        adjustment_id = stable_id("adjustment:ADJ-2026-0012")
        if session.get(InventoryAdjustment, adjustment_id) is None:
            stock = stocks[("RM-004", "LAG-MAIN")]
            session.add(
                InventoryAdjustment(
                    id=adjustment_id,
                    reference_code="ADJ-2026-0012",
                    workspace_id=WORKSPACE_ID,
                    warehouse_id=stock.warehouse_id,
                    product_id=stock.product_id,
                    direction="DECREASE",
                    quantity=Decimal("12"),
                    reason_code="COUNT_VARIANCE",
                    notes="Physical count was 12 kg below the system balance after the weekly count.",
                    status="PENDING_REVIEW",
                    requested_by_membership_id=memberships["amaka-nwosu"].id,
                    created_at=datetime.fromisoformat("2026-10-04T08:52:00+01:00"),
                )
            )

    print("Seeded NorthStar Foods demo inventory (existing records left unchanged).")


if __name__ == "__main__":
    seed_demo_data()
