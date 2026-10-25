"""Read-side inventory queries and response shaping."""

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.demo_workspace import DEMO_WORKSPACE_ID
from app.features.inventory.constants import (
    ADJUSTMENT_REASON_LABELS,
    MOVEMENT_LABELS,
    STATUS_LABELS,
)
from app.features.inventory.models import (
    InventoryAdjustment,
    InventoryMovement,
    Product,
    User,
    Warehouse,
    WarehouseStock,
    Workspace,
    WorkspaceMembership,
)


def _status(stock: WarehouseStock) -> str:
    if stock.is_quality_hold:
        return "Quality hold"
    if stock.on_hand_quantity < stock.reorder_level:
        return "Low stock"
    return "Healthy"


def get_inventory_bootstrap(session: Session) -> dict[str, list[dict[str, object]]]:
    workspace = session.get(Workspace, DEMO_WORKSPACE_ID)
    if workspace is None:
        return {"warehouses": [], "items": [], "movements": [], "adjustments": []}

    warehouses = session.scalars(
        select(Warehouse)
        .where(Warehouse.workspace_id == DEMO_WORKSPACE_ID, Warehouse.is_active.is_(True))
        .order_by(Warehouse.name)
    ).all()
    warehouse_by_id = {warehouse.id: warehouse for warehouse in warehouses}

    stock_rows = session.execute(
        select(WarehouseStock, Product)
        .join(
            Product,
            and_(
                Product.id == WarehouseStock.product_id,
                Product.workspace_id == WarehouseStock.workspace_id,
            ),
        )
        .where(WarehouseStock.workspace_id == DEMO_WORKSPACE_ID)
        .order_by(Product.name, WarehouseStock.warehouse_id)
    ).all()
    movement_stock_pairs = set(
        session.execute(
            select(InventoryMovement.warehouse_id, InventoryMovement.product_id).where(
                InventoryMovement.workspace_id == DEMO_WORKSPACE_ID
            )
        ).all()
    )
    items = [
        {
            "code": product.sku,
            "name": product.name,
            "category": product.category,
            "onHand": float(stock.on_hand_quantity),
            "unit": product.base_unit,
            "reorderAt": float(stock.reorder_level),
            "warehouse": warehouse_by_id[stock.warehouse_id].name,
            "status": _status(stock),
            "canSetOpeningStock": stock.on_hand_quantity == 0
            and (stock.warehouse_id, product.id) not in movement_stock_pairs,
        }
        for stock, product in stock_rows
        if stock.warehouse_id in warehouse_by_id
    ]

    memberships = session.scalars(
        select(WorkspaceMembership).where(WorkspaceMembership.workspace_id == DEMO_WORKSPACE_ID)
    ).all()
    users = session.scalars(select(User)).all()
    user_by_id = {user.id: user for user in users}
    actor_name_by_membership = {
        membership.id: user_by_id[membership.user_id].display_name
        for membership in memberships
        if membership.user_id in user_by_id
    }
    demo_key_by_membership = {
        membership.id: user_by_id[membership.user_id].demo_key
        for membership in memberships
        if membership.user_id in user_by_id
    }
    product_by_id = {product.id: product for product in session.scalars(select(Product)).all()}

    movement_rows = session.scalars(
        select(InventoryMovement)
        .where(InventoryMovement.workspace_id == DEMO_WORKSPACE_ID)
        .order_by(InventoryMovement.recorded_at.desc(), InventoryMovement.id.desc())
    ).all()
    movements = [
        {
            "id": f"MOV-{movement.id.hex[:10].upper()}",
            "itemCode": product_by_id[movement.product_id].sku,
            "itemName": product_by_id[movement.product_id].name,
            "warehouse": warehouse_by_id[movement.warehouse_id].name,
            "type": movement.movement_type,
            "reason": MOVEMENT_LABELS[movement.reason_code],
            "quantity": float(movement.quantity_delta),
            "balanceAfter": float(movement.balance_after),
            "reference": movement.reference_code,
            "performedBy": actor_name_by_membership.get(movement.recorded_by_membership_id, "Unknown user"),
            "occurredAt": movement.recorded_at.isoformat(),
        }
        for movement in movement_rows
        if movement.product_id in product_by_id and movement.warehouse_id in warehouse_by_id
    ]

    adjustment_rows = session.scalars(
        select(InventoryAdjustment)
        .where(InventoryAdjustment.workspace_id == DEMO_WORKSPACE_ID)
        .order_by(InventoryAdjustment.created_at.desc(), InventoryAdjustment.id.desc())
    ).all()
    adjustments = [
        {
            "id": adjustment.reference_code,
            "itemCode": product_by_id[adjustment.product_id].sku,
            "itemName": product_by_id[adjustment.product_id].name,
            "warehouse": warehouse_by_id[adjustment.warehouse_id].name,
            "direction": adjustment.direction.title(),
            "quantity": float(adjustment.quantity),
            "reason": ADJUSTMENT_REASON_LABELS[adjustment.reason_code],
            "notes": adjustment.notes,
            "requestedById": demo_key_by_membership.get(adjustment.requested_by_membership_id, ""),
            "requestedBy": actor_name_by_membership.get(adjustment.requested_by_membership_id, "Unknown user"),
            "requestedAt": adjustment.created_at.isoformat(),
            "status": STATUS_LABELS[adjustment.status],
            "reviewedBy": actor_name_by_membership.get(adjustment.reviewed_by_membership_id),
            "reviewedAt": adjustment.reviewed_at.isoformat() if adjustment.reviewed_at else None,
            "reviewNote": adjustment.review_note,
        }
        for adjustment in adjustment_rows
        if adjustment.product_id in product_by_id and adjustment.warehouse_id in warehouse_by_id
    ]

    return {
        "warehouses": [
            {"id": str(warehouse.id), "code": warehouse.code, "name": warehouse.name}
            for warehouse in warehouses
        ],
        "items": items,
        "movements": movements,
        "adjustments": adjustments,
    }


