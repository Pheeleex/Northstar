"""Request payloads for the inventory API."""

from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


AdjustmentDirection = Literal["Increase", "Decrease"]
AdjustmentReason = Literal[
    "Count variance",
    "Damage or spoilage",
    "Receiving correction",
    "Expiry",
    "Other",
]


class DemoActorPayload(BaseModel):
    actor_id: str = Field(min_length=1, max_length=80)


class WarehouseCreate(DemoActorPayload):
    code: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9-]+$")
    name: str = Field(min_length=1, max_length=160)


class InventoryItemCreate(DemoActorPayload):
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=80)
    unit: str = Field(min_length=1, max_length=16)
    warehouse_id: UUID
    on_hand: Decimal = Field(ge=0, max_digits=18, decimal_places=3)
    reorder_at: Decimal = Field(ge=0, max_digits=18, decimal_places=3)


class InventoryAdjustmentCreate(DemoActorPayload):
    item_code: str = Field(min_length=1, max_length=64)
    warehouse_id: UUID
    direction: AdjustmentDirection
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=3)
    reason: AdjustmentReason
    notes: str = Field(min_length=8, max_length=4000)


class InventoryAdjustmentReview(BaseModel):
    decision: Literal["Approved", "Returned"]
    reviewer_id: str = Field(min_length=1, max_length=80)
    note: str | None = Field(default=None, max_length=4000)
