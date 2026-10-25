"""Add the initial demo workspace and inventory records when missing."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.demo_seed_data import (
    DEMO_ITEMS,
    DEMO_MOVEMENTS,
    DEMO_USERS,
    DEMO_WAREHOUSES,
    WORKSPACE_ID,
    stable_id,
)
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


def seed_workspace_records(
    session: Session,
) -> tuple[dict[str, WorkspaceMembership], dict[str, Warehouse]]:
    if session.get(Workspace, WORKSPACE_ID) is None:
        session.add(Workspace(id=WORKSPACE_ID, name="NorthStar Foods"))
        session.flush()

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

    return memberships, warehouses


def seed_inventory_records(
    session: Session,
    memberships: dict[str, WorkspaceMembership],
    warehouses: dict[str, Warehouse],
) -> None:
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
