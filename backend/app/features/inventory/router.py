"""HTTP endpoints for the inventory feature."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.features.inventory.schemas import (
    InventoryAdjustmentCreate,
    InventoryAdjustmentReview,
    InventoryItemCreate,
    WarehouseCreate,
)
from app.features.inventory.service import (
    InventoryServiceError,
    create_adjustment,
    create_inventory_item,
    create_warehouse,
    get_inventory_bootstrap,
    review_adjustment,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/bootstrap")
def inventory_bootstrap(session: Session = Depends(get_db_session)):
    return get_inventory_bootstrap(session)


@router.post("/warehouses", status_code=201)
def add_warehouse(payload: WarehouseCreate, session: Session = Depends(get_db_session)):
    try:
        create_warehouse(session, actor_id=payload.actor_id, code=payload.code, name=payload.name)
        return {"ok": True}
    except InventoryServiceError as error:
        raise HTTPException(error.status_code, error.detail) from error


@router.post("/items", status_code=201)
def add_inventory_item(payload: InventoryItemCreate, session: Session = Depends(get_db_session)):
    try:
        create_inventory_item(
            session,
            actor_id=payload.actor_id,
            code=payload.code,
            name=payload.name,
            category=payload.category,
            unit=payload.unit,
            warehouse_id=payload.warehouse_id,
            on_hand=payload.on_hand,
            reorder_at=payload.reorder_at,
        )
        return {"ok": True}
    except InventoryServiceError as error:
        raise HTTPException(error.status_code, error.detail) from error


@router.post("/adjustments", status_code=201)
def add_adjustment(payload: InventoryAdjustmentCreate, session: Session = Depends(get_db_session)):
    try:
        create_adjustment(
            session,
            actor_id=payload.actor_id,
            item_code=payload.item_code,
            warehouse_id=payload.warehouse_id,
            direction=payload.direction,
            quantity=payload.quantity,
            reason=payload.reason,
            notes=payload.notes,
        )
        return {"ok": True}
    except InventoryServiceError as error:
        raise HTTPException(error.status_code, error.detail) from error


@router.post("/adjustments/{reference_code}/review")
def review_inventory_adjustment(
    reference_code: str,
    payload: InventoryAdjustmentReview,
    session: Session = Depends(get_db_session),
):
    try:
        review_adjustment(
            session,
            reference_code=reference_code,
            reviewer_id=payload.reviewer_id,
            decision=payload.decision,
            note=payload.note,
        )
        return {"ok": True}
    except InventoryServiceError as error:
        raise HTTPException(error.status_code, error.detail) from error
