from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, drivers, health, rides, routing
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "NQLa REST API foundation. Route-planning and route-compatibility results are "
        "explicitly marked as synthetic until verified transit data is integrated."
    ),
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.cors_origin_list != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(drivers.router, prefix=settings.api_v1_prefix)
app.include_router(routing.router, prefix=settings.api_v1_prefix)
app.include_router(rides.router, prefix=settings.api_v1_prefix)
