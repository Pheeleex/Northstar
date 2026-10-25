"""Inventory write operations and transaction boundaries."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.demo_workspace import DEMO_WORKSPACE_ID
from app.features.inventory.constants import ADJUSTMENT_REASON_CODES
from app.features.inventory.models import (
    InventoryAdjustment,
    InventoryMovement,
    Product,
    User,
    Warehouse,
    WarehouseAssignment,
    WarehouseStock,
    WorkspaceMembership,
)


class InventoryServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


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


def _opening_stock_reference(sku: str, warehouse_code: str) -> str:
    return f"OPEN-{sku[:32]}-{warehouse_code[:12]}"


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
    opening_stock: Decimal,
    reorder_at: Decimal,
) -> None:
    _, membership = _actor(session, actor_id, {"INVENTORY_ADMIN"})
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
        on_hand_quantity=opening_stock,
        reorder_level=reorder_at,
    )
    session.add(stock)
    session.flush()
    if opening_stock > 0:
        session.add(
            InventoryMovement(
                workspace_id=DEMO_WORKSPACE_ID,
                warehouse_id=warehouse.id,
                product_id=product.id,
                movement_type="IN",
                reason_code="OPENING_STOCK",
                quantity_delta=opening_stock,
                balance_after=opening_stock,
                reference_code=_opening_stock_reference(product.sku, warehouse.code),
                recorded_by_membership_id=membership.id,
                recorded_at=datetime.now(timezone.utc),
            )
        )
    session.commit()


def set_opening_stock(
    session: Session,
    *,
    actor_id: str,
    item_code: str,
    warehouse_id: UUID,
    quantity: Decimal,
    reference_code: str | None,
) -> None:
    _, membership = _actor(session, actor_id, {"INVENTORY_ADMIN"})
    warehouse = _warehouse(session, warehouse_id)
    product = session.scalar(
        select(Product).where(
            Product.workspace_id == DEMO_WORKSPACE_ID,
            Product.sku == item_code.strip().upper(),
        )
    )
    if product is None:
        raise InventoryServiceError(404, "Inventory item was not found.")
    stock = session.scalar(
        select(WarehouseStock)
        .where(
            WarehouseStock.workspace_id == DEMO_WORKSPACE_ID,
            WarehouseStock.warehouse_id == warehouse.id,
            WarehouseStock.product_id == product.id,
        )
        .with_for_update()
    )
    if stock is None:
        raise InventoryServiceError(404, "This item has no stock record at the selected warehouse.")
    if stock.on_hand_quantity != 0:
        raise InventoryServiceError(409, "Opening stock can only be set before stock changes begin.")
    has_movements = session.scalar(
        select(InventoryMovement.id)
        .where(
            InventoryMovement.workspace_id == DEMO_WORKSPACE_ID,
            InventoryMovement.warehouse_id == warehouse.id,
            InventoryMovement.product_id == product.id,
        )
        .limit(1)
    )
    if has_movements is not None:
        raise InventoryServiceError(409, "Opening stock has already been recorded for this item and warehouse.")

    recorded_at = datetime.now(timezone.utc)
    stock.on_hand_quantity = quantity
    session.add(
        InventoryMovement(
            workspace_id=DEMO_WORKSPACE_ID,
            warehouse_id=warehouse.id,
            product_id=product.id,
            movement_type="IN",
            reason_code="OPENING_STOCK",
            quantity_delta=quantity,
            balance_after=quantity,
            reference_code=reference_code.strip() if reference_code and reference_code.strip() else _opening_stock_reference(product.sku, warehouse.code),
            recorded_by_membership_id=membership.id,
            recorded_at=recorded_at,
        )
    )
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise InventoryServiceError(409, "Opening stock was already set for this item and warehouse.") from error


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
