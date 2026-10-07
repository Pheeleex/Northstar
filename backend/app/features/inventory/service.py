"""Inventory queries and transaction boundaries."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

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


class InventoryServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


MOVEMENT_LABELS = {
    "OPENING_STOCK": "Opening stock",
    "SUPPLIER_RECEIPT": "Supplier receipt",
    "CUSTOMER_RETURN": "Customer return",
    "TRANSFER": "Transfer",
    "PRODUCTION_USE": "Production use",
    "CUSTOMER_DISPATCH": "Customer dispatch",
    "WRITE_OFF": "Write-off",
    "COUNT_VARIANCE": "Count variance",
    "DAMAGE_OR_SPOILAGE": "Damage or spoilage",
    "RECEIVING_CORRECTION": "Receiving correction",
    "EXPIRY": "Expiry",
    "OTHER": "Other",
}
ADJUSTMENT_REASON_CODES = {
    "Count variance": "COUNT_VARIANCE",
    "Damage or spoilage": "DAMAGE_OR_SPOILAGE",
    "Receiving correction": "RECEIVING_CORRECTION",
    "Expiry": "EXPIRY",
    "Other": "OTHER",
}
ADJUSTMENT_REASON_LABELS = {value: key for key, value in ADJUSTMENT_REASON_CODES.items()}
STATUS_LABELS = {
    "PENDING_REVIEW": "Pending review",
    "APPROVED": "Approved",
    "RETURNED": "Returned",
}


def _actor(session: Session, demo_key: str, allowed_roles: set[str] | None = None) -> tuple[User, WorkspaceMembership]:
    user = session.scalar(select(User).where(User.demo_key == demo_key, User.is_active.is_(True)))
    if user is None:
        raise InventoryServiceError(404, "Demo user was not found.")
    membership = session.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == DEMO_WORKSPACE_ID,
            WorkspaceMembership.user_id == user.id,
            WorkspaceMembership.status == "ACTIVE",
        )
    )
    if membership is None:
        raise InventoryServiceError(404, "Demo user is not a member of this workspace.")
    if allowed_roles and membership.role_code not in allowed_roles:
        raise InventoryServiceError(403, "This demo role cannot perform that inventory action.")
    return user, membership


def _warehouse(session: Session, warehouse_id: UUID) -> Warehouse:
    warehouse = session.scalar(
        select(Warehouse).where(
            Warehouse.id == warehouse_id,
            Warehouse.workspace_id == DEMO_WORKSPACE_ID,
            Warehouse.is_active.is_(True),
        )
    )
    if warehouse is None:
        raise InventoryServiceError(404, "Warehouse was not found.")
    return warehouse


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


def create_warehouse(session: Session, *, actor_id: str, code: str, name: str) -> None:
    _actor(session, actor_id, {"INVENTORY_ADMIN"})
    warehouse = Warehouse(
        workspace_id=DEMO_WORKSPACE_ID,
        code=code.strip().upper(),
        name=name.strip(),
    )
    session.add(warehouse)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise InventoryServiceError(409, "A warehouse with that name or code already exists.") from error


def create_inventory_item(
    session: Session,
    *,
    actor_id: str,
    code: str,
    name: str,
    category: str,
    unit: str,
    warehouse_id: UUID,
    on_hand: Decimal,
    reorder_at: Decimal,
) -> None:
    _actor(session, actor_id, {"INVENTORY_ADMIN"})
    warehouse = _warehouse(session, warehouse_id)
    sku = code.strip().upper()
    product = session.scalar(
        select(Product).where(Product.workspace_id == DEMO_WORKSPACE_ID, Product.sku == sku)
    )
    if product is not None and (
        product.name.casefold() != name.strip().casefold()
        or product.category != category.strip()
        or product.base_unit.casefold() != unit.strip().casefold()
    ):
        raise InventoryServiceError(409, "This item code already exists with different product details.")
    if product is None:
        product = Product(
            workspace_id=DEMO_WORKSPACE_ID,
            sku=sku,
            name=name.strip(),
            category=category.strip(),
            base_unit=unit.strip(),
        )
        session.add(product)
        session.flush()

    existing_stock = session.scalar(
        select(WarehouseStock).where(
            WarehouseStock.workspace_id == DEMO_WORKSPACE_ID,
            WarehouseStock.warehouse_id == warehouse.id,
            WarehouseStock.product_id == product.id,
        )
    )
    if existing_stock is not None:
        raise InventoryServiceError(409, f"{sku} already has a stock record in {warehouse.name}.")

    stock = WarehouseStock(
        workspace_id=DEMO_WORKSPACE_ID,
        warehouse_id=warehouse.id,
        product_id=product.id,
        on_hand_quantity=on_hand,
        reorder_level=reorder_at,
    )
    session.add(stock)
    session.flush()
    if on_hand > 0:
        membership = _actor(session, actor_id)[1]
        session.add(
            InventoryMovement(
                workspace_id=DEMO_WORKSPACE_ID,
                warehouse_id=warehouse.id,
                product_id=product.id,
                movement_type="IN",
                reason_code="OPENING_STOCK",
                quantity_delta=on_hand,
                balance_after=on_hand,
                reference_code=f"OPEN-{sku}",
                recorded_by_membership_id=membership.id,
            )
        )
    session.commit()


def create_adjustment(
    session: Session,
    *,
    actor_id: str,
    item_code: str,
    warehouse_id: UUID,
    direction: str,
    quantity: Decimal,
    reason: str,
    notes: str,
) -> None:
    _, membership = _actor(session, actor_id, {"WAREHOUSE_LEAD", "INVENTORY_ADMIN"})
    warehouse = _warehouse(session, warehouse_id)
    if membership.role_code == "WAREHOUSE_LEAD":
        assignment = session.scalar(
            select(WarehouseAssignment).where(
                WarehouseAssignment.membership_id == membership.id,
                WarehouseAssignment.warehouse_id == warehouse.id,
            )
        )
        if assignment is None:
            raise InventoryServiceError(403, "Warehouse Leads can only adjust stock at assigned warehouses.")

    product = session.scalar(
        select(Product).where(
            Product.workspace_id == DEMO_WORKSPACE_ID,
            Product.sku == item_code.strip().upper(),
        )
    )
    if product is None:
        raise InventoryServiceError(404, "Inventory item was not found.")
    stock = session.scalar(
        select(WarehouseStock).where(
            WarehouseStock.workspace_id == DEMO_WORKSPACE_ID,
            WarehouseStock.warehouse_id == warehouse.id,
            WarehouseStock.product_id == product.id,
        )
    )
    if stock is None:
        raise InventoryServiceError(404, "This item has no stock record at the selected warehouse.")
    if direction == "Decrease" and quantity > stock.on_hand_quantity:
        raise InventoryServiceError(422, f"Only {stock.on_hand_quantity} {product.base_unit} is on hand.")

    adjustment = InventoryAdjustment(
        reference_code=f"ADJ-{uuid4().hex[:10].upper()}",
        workspace_id=DEMO_WORKSPACE_ID,
        warehouse_id=warehouse.id,
        product_id=product.id,
        direction=direction.upper(),
        quantity=quantity,
        reason_code=ADJUSTMENT_REASON_CODES[reason],
        notes=notes.strip(),
        status="PENDING_REVIEW",
        requested_by_membership_id=membership.id,
    )
    session.add(adjustment)
    session.commit()


def review_adjustment(
    session: Session,
    *,
    reference_code: str,
    reviewer_id: str,
    decision: str,
    note: str | None,
) -> None:
    _, reviewer = _actor(session, reviewer_id, {"INVENTORY_ADMIN"})
    adjustment = session.scalar(
        select(InventoryAdjustment)
        .where(
            InventoryAdjustment.workspace_id == DEMO_WORKSPACE_ID,
            InventoryAdjustment.reference_code == reference_code,
        )
        .with_for_update()
    )
    if adjustment is None:
        raise InventoryServiceError(404, "Adjustment request was not found.")
    if adjustment.status != "PENDING_REVIEW":
        raise InventoryServiceError(409, "This adjustment has already been reviewed.")

    reviewed_at = datetime.now(timezone.utc)
    if decision == "Approved":
        stock = session.scalar(
            select(WarehouseStock)
            .where(
                WarehouseStock.workspace_id == DEMO_WORKSPACE_ID,
                WarehouseStock.warehouse_id == adjustment.warehouse_id,
                WarehouseStock.product_id == adjustment.product_id,
            )
            .with_for_update()
        )
        if stock is None:
            raise InventoryServiceError(409, "The stock record for this adjustment no longer exists.")
        delta = adjustment.quantity if adjustment.direction == "INCREASE" else -adjustment.quantity
        next_balance = stock.on_hand_quantity + delta
        if next_balance < 0:
            raise InventoryServiceError(422, "This adjustment would make the stock balance negative.")
        stock.on_hand_quantity = next_balance
        session.add(
            InventoryMovement(
                workspace_id=DEMO_WORKSPACE_ID,
                warehouse_id=adjustment.warehouse_id,
                product_id=adjustment.product_id,
                movement_type="ADJUSTMENT",
                reason_code=adjustment.reason_code,
                quantity_delta=delta,
                balance_after=next_balance,
                reference_code=adjustment.reference_code,
                adjustment_id=adjustment.id,
                recorded_by_membership_id=reviewer.id,
                recorded_at=reviewed_at,
            )
        )

    adjustment.status = decision.upper()
    adjustment.reviewed_by_membership_id = reviewer.id
    adjustment.review_note = note.strip() if note else None
    adjustment.reviewed_at = reviewed_at
    session.commit()
