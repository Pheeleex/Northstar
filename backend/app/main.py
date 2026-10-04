from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.errors import AppError, app_error_handler

app = FastAPI(
    title="NorthStar API",
    version="0.1.0",
    description="Inventory and operations API for NorthStar.",
)

app.add_exception_handler(AppError, app_error_handler)
app.include_router(api_router, prefix="/api/v1")
