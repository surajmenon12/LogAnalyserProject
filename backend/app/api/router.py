from fastapi import APIRouter

from app.api.analysis import router as analysis_router
from app.api.health import router as health_router
from app.api.zendesk import router as zendesk_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, tags=["health"])
api_router.include_router(analysis_router, tags=["analysis"])
api_router.include_router(zendesk_router, tags=["zendesk"])
