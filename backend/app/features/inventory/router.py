"""HTTP endpoints for inventory. Endpoints will delegate to the feature service."""

from fastapi import APIRouter

router = APIRouter(prefix="/inventory", tags=["inventory"])
