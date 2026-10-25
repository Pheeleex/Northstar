"""Allow one explicit opening-stock entry per item and warehouse.

Revision ID: 0003_opening_stock_unique
Revises: 0002_inventory_seed_fields
Create Date: 2026-10-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003_opening_stock_unique"
down_revision: str | None = "0002_inventory_seed_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_inventory_movements_one_opening_stock",
        "inventory_movements",
        ["workspace_id", "warehouse_id", "product_id"],
        unique=True,
        postgresql_where=sa.text("reason_code = 'OPENING_STOCK'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_inventory_movements_one_opening_stock",
        table_name="inventory_movements",
    )
