"""Top-level API router that includes every route module."""

from fastapi import APIRouter

from app.api.routes import company, health, me, reference

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(company.router)
api_router.include_router(reference.router)
