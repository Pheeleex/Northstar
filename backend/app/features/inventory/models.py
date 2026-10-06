from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.db.base import Base


class Workspace(Base):
    __tablename__ = "workspaces"
    __table_args__ = (
        CheckConstraint(
            "status IN ('ACTIVE', 'SUSPENDED')", name="status_is_valid"
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    demo_key: Mapped[str | None] = mapped_column(String(80), unique=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))


class WorkspaceMembership(Base):
    __tablename__ = "workspace_memberships"
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_memberships_workspace_user"),
        UniqueConstraint("workspace_id", "id", name="uq_memberships_workspace_id"),
        CheckConstraint(
            "role_code IN ('OPERATIONS_MANAGER', 'PROCUREMENT_OFFICER', "
            "'WAREHOUSE_LEAD', 'QUALITY_MANAGER', 'FINANCE_APPROVER', "
            "'MANAGING_DIRECTOR', 'INVENTORY_ADMIN')",
            name="role_code_is_valid",
        ),
        CheckConstraint("status IN ('ACTIVE', 'DISABLED')", name="status_is_valid"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    workspace_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("workspaces.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    role_code: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Warehouse(Base):
    __tablename__ = "warehouses"
    __table_args__ = (
        UniqueConstraint("workspace_id", "code", name="uq_warehouses_workspace_code"),
        UniqueConstraint("workspace_id", "name", name="uq_warehouses_workspace_name"),
        UniqueConstraint("workspace_id", "id", name="uq_warehouses_workspace_id"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    workspace_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("workspaces.id", ondelete="RESTRICT"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class WarehouseAssignment(Base):
    __tablename__ = "warehouse_assignments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["workspace_id", "membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_warehouse_assignments_membership_workspace",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["workspace_id", "warehouse_id"],
            ["warehouses.workspace_id", "warehouses.id"],
            name="fk_warehouse_assignments_warehouse_workspace",
            ondelete="CASCADE",
        ),
    )

    workspace_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    membership_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    warehouse_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("workspace_id", "sku", name="uq_products_workspace_sku"),
        UniqueConstraint("workspace_id", "id", name="uq_products_workspace_id"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    workspace_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("workspaces.id", ondelete="RESTRICT"), nullable=False
    )
    sku: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    base_unit: Mapped[str] = mapped_column(String(16), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class WarehouseStock(Base):
    __tablename__ = "warehouse_stock"
    __table_args__ = (
        ForeignKeyConstraint(
            ["workspace_id", "warehouse_id"],
            ["warehouses.workspace_id", "warehouses.id"],
            name="fk_warehouse_stock_warehouse_workspace",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["workspace_id", "product_id"],
            ["products.workspace_id", "products.id"],
            name="fk_warehouse_stock_product_workspace",
            ondelete="RESTRICT",
        ),
        UniqueConstraint("warehouse_id", "product_id", name="uq_warehouse_stock_warehouse_product"),
        UniqueConstraint(
            "workspace_id", "warehouse_id", "product_id", name="uq_warehouse_stock_workspace_location_product"
        ),
        CheckConstraint("on_hand_quantity >= 0", name="on_hand_is_nonnegative"),
        CheckConstraint("reorder_level >= 0", name="reorder_level_is_nonnegative"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    workspace_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    warehouse_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    product_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    on_hand_quantity: Mapped[Decimal] = mapped_column(
        Numeric(18, 3), nullable=False, server_default="0"
    )
    reorder_level: Mapped[Decimal] = mapped_column(
        Numeric(18, 3), nullable=False, server_default="0"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class InventoryAdjustment(Base):
    __tablename__ = "inventory_adjustments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["workspace_id", "warehouse_id", "product_id"],
            ["warehouse_stock.workspace_id", "warehouse_stock.warehouse_id", "warehouse_stock.product_id"],
            name="fk_inventory_adjustments_stock_scope",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["workspace_id", "requested_by_membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_inventory_adjustments_requester_workspace",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["workspace_id", "reviewed_by_membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_inventory_adjustments_reviewer_workspace",
            ondelete="RESTRICT",
        ),
        UniqueConstraint(
            "workspace_id", "warehouse_id", "product_id", "id", name="uq_inventory_adjustments_stock_scope_id"
        ),
        CheckConstraint("direction IN ('INCREASE', 'DECREASE')", name="direction_is_valid"),
        CheckConstraint("quantity > 0", name="quantity_is_positive"),
        CheckConstraint(
            "reason_code IN ('COUNT_VARIANCE', 'DAMAGE_OR_SPOILAGE', "
            "'RECEIVING_CORRECTION', 'EXPIRY', 'OTHER')",
            name="reason_code_is_valid",
        ),
        CheckConstraint("length(trim(notes)) > 0", name="notes_are_required"),
        CheckConstraint(
            "status IN ('PENDING_REVIEW', 'APPROVED', 'RETURNED')", name="status_is_valid"
        ),
        CheckConstraint(
            "(status = 'PENDING_REVIEW' AND reviewed_by_membership_id IS NULL AND reviewed_at IS NULL) "
            "OR (status IN ('APPROVED', 'RETURNED') AND reviewed_by_membership_id IS NOT NULL AND reviewed_at IS NOT NULL)",
            name="review_fields_match_status",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    workspace_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    warehouse_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    product_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    reason_code: Mapped[str] = mapped_column(String(32), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="PENDING_REVIEW"
    )
    requested_by_membership_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    reviewed_by_membership_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True))
    review_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = (
        ForeignKeyConstraint(
            ["workspace_id", "warehouse_id", "product_id"],
            ["warehouse_stock.workspace_id", "warehouse_stock.warehouse_id", "warehouse_stock.product_id"],
            name="fk_inventory_movements_stock_scope",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["workspace_id", "recorded_by_membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_inventory_movements_recorder_workspace",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["workspace_id", "warehouse_id", "product_id", "adjustment_id"],
            [
                "inventory_adjustments.workspace_id",
                "inventory_adjustments.warehouse_id",
                "inventory_adjustments.product_id",
                "inventory_adjustments.id",
            ],
            name="fk_inventory_movements_adjustment_scope",
            ondelete="RESTRICT",
        ),
        UniqueConstraint("adjustment_id", name="uq_inventory_movements_adjustment_id"),
        CheckConstraint(
            "movement_type IN ('IN', 'OUT', 'ADJUSTMENT')", name="movement_type_is_valid"
        ),
        CheckConstraint(
            "reason_code IN ('OPENING_STOCK', 'SUPPLIER_RECEIPT', 'CUSTOMER_RETURN', "
            "'TRANSFER', 'PRODUCTION_USE', 'CUSTOMER_DISPATCH', 'WRITE_OFF', "
            "'COUNT_VARIANCE', 'DAMAGE_OR_SPOILAGE', 'RECEIVING_CORRECTION', 'EXPIRY', 'OTHER')",
            name="reason_code_is_valid",
        ),
        CheckConstraint(
            "(movement_type = 'IN' AND quantity_delta > 0) "
            "OR (movement_type = 'OUT' AND quantity_delta < 0) "
            "OR (movement_type = 'ADJUSTMENT' AND quantity_delta <> 0)",
            name="quantity_delta_matches_movement_type",
        ),
        CheckConstraint(
            "(movement_type = 'IN' AND reason_code IN "
            "('OPENING_STOCK', 'SUPPLIER_RECEIPT', 'CUSTOMER_RETURN', 'TRANSFER')) "
            "OR (movement_type = 'OUT' AND reason_code IN "
            "('TRANSFER', 'PRODUCTION_USE', 'CUSTOMER_DISPATCH', 'WRITE_OFF')) "
            "OR (movement_type = 'ADJUSTMENT' AND reason_code IN "
            "('COUNT_VARIANCE', 'DAMAGE_OR_SPOILAGE', 'RECEIVING_CORRECTION', 'EXPIRY', 'OTHER'))",
            name="reason_matches_movement_type",
        ),
        CheckConstraint(
            "(movement_type = 'ADJUSTMENT' AND adjustment_id IS NOT NULL) "
            "OR (movement_type <> 'ADJUSTMENT' AND adjustment_id IS NULL)",
            name="adjustment_link_matches_movement_type",
        ),
        CheckConstraint("balance_after >= 0", name="balance_after_is_nonnegative"),
        Index("ix_inventory_movements_workspace_warehouse_recorded", "workspace_id", "warehouse_id", "recorded_at"),
        Index("ix_inventory_movements_workspace_product_recorded", "workspace_id", "product_id", "recorded_at"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )
    workspace_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    warehouse_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    product_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(16), nullable=False)
    reason_code: Mapped[str] = mapped_column(String(32), nullable=False)
    quantity_delta: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    reference_code: Mapped[str | None] = mapped_column(String(80))
    adjustment_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True))
    recorded_by_membership_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
