"""Add fields needed for seeded inventory and adjustment references.

Revision ID: 0002_inventory_seed_fields
Revises: 0001_inventory_foundation
Create Date: 2026-10-07
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002_inventory_seed_fields"
down_revision: str | None = "0001_inventory_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "warehouse_stock",
        sa.Column("is_quality_hold", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "inventory_adjustments",
        sa.Column("reference_code", sa.String(length=32), nullable=True),
    )
    op.execute(
        "UPDATE inventory_adjustments "
        "SET reference_code = 'ADJ-' || upper(substr(replace(id::text, '-', ''), 1, 12)) "
        "WHERE reference_code IS NULL"
    )
    op.alter_column("inventory_adjustments", "reference_code", nullable=False)
    op.create_unique_constraint(
        "uq_inventory_adjustments_workspace_reference",
        "inventory_adjustments",
        ["workspace_id", "reference_code"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_inventory_adjustments_workspace_reference",
        "inventory_adjustments",
        type_="unique",
    )
    op.drop_column("inventory_adjustments", "reference_code")
    op.drop_column("warehouse_stock", "is_quality_hold")
