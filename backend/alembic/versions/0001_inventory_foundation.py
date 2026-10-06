"""Create workspace and inventory foundation tables.

Revision ID: 0001_inventory_foundation
Revises:
Create Date: 2026-10-04
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_inventory_foundation"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="ACTIVE", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('ACTIVE', 'SUSPENDED')", name="ck_workspaces_status_is_valid"),
        sa.PrimaryKeyConstraint("id", name="pk_workspaces"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("demo_key", sa.String(length=80), nullable=True),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("demo_key", name="uq_users_demo_key"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("base_unit", sa.String(length=16), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], name="fk_products_workspace_id_workspaces", ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name="pk_products"),
        sa.UniqueConstraint("workspace_id", "id", name="uq_products_workspace_id"),
        sa.UniqueConstraint("workspace_id", "sku", name="uq_products_workspace_sku"),
    )
    op.create_table(
        "workspace_memberships",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("role_code", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="ACTIVE", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "role_code IN ('OPERATIONS_MANAGER', 'PROCUREMENT_OFFICER', 'WAREHOUSE_LEAD', "
            "'QUALITY_MANAGER', 'FINANCE_APPROVER', 'MANAGING_DIRECTOR', 'INVENTORY_ADMIN')",
            name="ck_workspace_memberships_role_code_is_valid",
        ),
        sa.CheckConstraint("status IN ('ACTIVE', 'DISABLED')", name="ck_workspace_memberships_status_is_valid"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_workspace_memberships_user_id_users", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], name="fk_workspace_memberships_workspace_id_workspaces", ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name="pk_workspace_memberships"),
        sa.UniqueConstraint("workspace_id", "id", name="uq_memberships_workspace_id"),
        sa.UniqueConstraint("workspace_id", "user_id", name="uq_memberships_workspace_user"),
    )
    op.create_table(
        "warehouses",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], name="fk_warehouses_workspace_id_workspaces", ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name="pk_warehouses"),
        sa.UniqueConstraint("workspace_id", "code", name="uq_warehouses_workspace_code"),
        sa.UniqueConstraint("workspace_id", "id", name="uq_warehouses_workspace_id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_warehouses_workspace_name"),
    )
    op.create_table(
        "warehouse_assignments",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("membership_id", sa.Uuid(), nullable=False),
        sa.Column("warehouse_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id", "membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_warehouse_assignments_membership_workspace",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "warehouse_id"],
            ["warehouses.workspace_id", "warehouses.id"],
            name="fk_warehouse_assignments_warehouse_workspace",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("membership_id", "warehouse_id", name="pk_warehouse_assignments"),
    )
    op.create_table(
        "warehouse_stock",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("warehouse_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("on_hand_quantity", sa.Numeric(precision=18, scale=3), server_default="0", nullable=False),
        sa.Column("reorder_level", sa.Numeric(precision=18, scale=3), server_default="0", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("on_hand_quantity >= 0", name="ck_warehouse_stock_on_hand_is_nonnegative"),
        sa.CheckConstraint("reorder_level >= 0", name="ck_warehouse_stock_reorder_level_is_nonnegative"),
        sa.ForeignKeyConstraint(
            ["workspace_id", "product_id"], ["products.workspace_id", "products.id"],
            name="fk_warehouse_stock_product_workspace", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "warehouse_id"], ["warehouses.workspace_id", "warehouses.id"],
            name="fk_warehouse_stock_warehouse_workspace", ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_warehouse_stock"),
        sa.UniqueConstraint("warehouse_id", "product_id", name="uq_warehouse_stock_warehouse_product"),
        sa.UniqueConstraint(
            "workspace_id", "warehouse_id", "product_id",
            name="uq_warehouse_stock_workspace_location_product"
        ),
    )
    op.create_table(
        "inventory_adjustments",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("warehouse_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=18, scale=3), nullable=False),
        sa.Column("reason_code", sa.String(length=32), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="PENDING_REVIEW", nullable=False),
        sa.Column("requested_by_membership_id", sa.Uuid(), nullable=False),
        sa.Column("reviewed_by_membership_id", sa.Uuid(), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("direction IN ('INCREASE', 'DECREASE')", name="ck_inventory_adjustments_direction_is_valid"),
        sa.CheckConstraint("quantity > 0", name="ck_inventory_adjustments_quantity_is_positive"),
        sa.CheckConstraint(
            "reason_code IN ('COUNT_VARIANCE', 'DAMAGE_OR_SPOILAGE', 'RECEIVING_CORRECTION', 'EXPIRY', 'OTHER')",
            name="ck_inventory_adjustments_reason_code_is_valid",
        ),
        sa.CheckConstraint("length(trim(notes)) > 0", name="ck_inventory_adjustments_notes_are_required"),
        sa.CheckConstraint(
            "status IN ('PENDING_REVIEW', 'APPROVED', 'RETURNED')",
            name="ck_inventory_adjustments_status_is_valid",
        ),
        sa.CheckConstraint(
            "(status = 'PENDING_REVIEW' AND reviewed_by_membership_id IS NULL AND reviewed_at IS NULL) "
            "OR (status IN ('APPROVED', 'RETURNED') AND reviewed_by_membership_id IS NOT NULL AND reviewed_at IS NOT NULL)",
            name="ck_inventory_adjustments_review_fields_match_status",
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "requested_by_membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_inventory_adjustments_requester_workspace", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "reviewed_by_membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_inventory_adjustments_reviewer_workspace", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "warehouse_id", "product_id"],
            ["warehouse_stock.workspace_id", "warehouse_stock.warehouse_id", "warehouse_stock.product_id"],
            name="fk_inventory_adjustments_stock_scope", ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_inventory_adjustments"),
        sa.UniqueConstraint(
            "workspace_id", "warehouse_id", "product_id", "id",
            name="uq_inventory_adjustments_stock_scope_id"
        ),
    )
    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("warehouse_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("movement_type", sa.String(length=16), nullable=False),
        sa.Column("reason_code", sa.String(length=32), nullable=False),
        sa.Column("quantity_delta", sa.Numeric(precision=18, scale=3), nullable=False),
        sa.Column("balance_after", sa.Numeric(precision=18, scale=3), nullable=False),
        sa.Column("reference_code", sa.String(length=80), nullable=True),
        sa.Column("adjustment_id", sa.Uuid(), nullable=True),
        sa.Column("recorded_by_membership_id", sa.Uuid(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "movement_type IN ('IN', 'OUT', 'ADJUSTMENT')",
            name="ck_inventory_movements_movement_type_is_valid",
        ),
        sa.CheckConstraint(
            "reason_code IN ('OPENING_STOCK', 'SUPPLIER_RECEIPT', 'CUSTOMER_RETURN', 'TRANSFER', "
            "'PRODUCTION_USE', 'CUSTOMER_DISPATCH', 'WRITE_OFF', 'COUNT_VARIANCE', "
            "'DAMAGE_OR_SPOILAGE', 'RECEIVING_CORRECTION', 'EXPIRY', 'OTHER')",
            name="ck_inventory_movements_reason_code_is_valid",
        ),
        sa.CheckConstraint(
            "(movement_type = 'IN' AND quantity_delta > 0) "
            "OR (movement_type = 'OUT' AND quantity_delta < 0) "
            "OR (movement_type = 'ADJUSTMENT' AND quantity_delta <> 0)",
            name="ck_inventory_movements_quantity_delta_matches_movement_type",
        ),
        sa.CheckConstraint(
            "(movement_type = 'IN' AND reason_code IN ('OPENING_STOCK', 'SUPPLIER_RECEIPT', 'CUSTOMER_RETURN', 'TRANSFER')) "
            "OR (movement_type = 'OUT' AND reason_code IN ('TRANSFER', 'PRODUCTION_USE', 'CUSTOMER_DISPATCH', 'WRITE_OFF')) "
            "OR (movement_type = 'ADJUSTMENT' AND reason_code IN ('COUNT_VARIANCE', 'DAMAGE_OR_SPOILAGE', 'RECEIVING_CORRECTION', 'EXPIRY', 'OTHER'))",
            name="ck_inventory_movements_reason_matches_movement_type",
        ),
        sa.CheckConstraint(
            "(movement_type = 'ADJUSTMENT' AND adjustment_id IS NOT NULL) "
            "OR (movement_type <> 'ADJUSTMENT' AND adjustment_id IS NULL)",
            name="ck_inventory_movements_adjustment_link_matches_movement_type",
        ),
        sa.CheckConstraint("balance_after >= 0", name="ck_inventory_movements_balance_after_is_nonnegative"),
        sa.ForeignKeyConstraint(
            ["workspace_id", "recorded_by_membership_id"],
            ["workspace_memberships.workspace_id", "workspace_memberships.id"],
            name="fk_inventory_movements_recorder_workspace", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "warehouse_id", "product_id"],
            ["warehouse_stock.workspace_id", "warehouse_stock.warehouse_id", "warehouse_stock.product_id"],
            name="fk_inventory_movements_stock_scope", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id", "warehouse_id", "product_id", "adjustment_id"],
            [
                "inventory_adjustments.workspace_id",
                "inventory_adjustments.warehouse_id",
                "inventory_adjustments.product_id",
                "inventory_adjustments.id",
            ],
            name="fk_inventory_movements_adjustment_scope", ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_inventory_movements"),
        sa.UniqueConstraint("adjustment_id", name="uq_inventory_movements_adjustment_id"),
    )
    op.create_index(
        "ix_inventory_movements_workspace_warehouse_recorded",
        "inventory_movements",
        ["workspace_id", "warehouse_id", "recorded_at"],
    )
    op.create_index(
        "ix_inventory_movements_workspace_product_recorded",
        "inventory_movements",
        ["workspace_id", "product_id", "recorded_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_inventory_movements_workspace_product_recorded", table_name="inventory_movements")
    op.drop_index("ix_inventory_movements_workspace_warehouse_recorded", table_name="inventory_movements")
    op.drop_table("inventory_movements")
    op.drop_table("inventory_adjustments")
    op.drop_table("warehouse_stock")
    op.drop_table("warehouse_assignments")
    op.drop_table("warehouses")
    op.drop_table("workspace_memberships")
    op.drop_table("products")
    op.drop_table("users")
    op.drop_table("workspaces")
