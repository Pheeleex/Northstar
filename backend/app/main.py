from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler

settings = get_settings()

app = FastAPI(
    title="NorthStar API",
    version="0.1.0",
    description="Inventory and operations API for NorthStar.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.include_router(api_router, prefix="/api/v1")
