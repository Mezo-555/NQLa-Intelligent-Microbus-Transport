from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import DatabaseSession
from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health", summary="Check API health")
def health() -> dict[str, str]:
    environment = get_settings().environment
    data_source = "synthetic_mock" if environment in {"development", "test"} else "unconfigured"
    return {"status": "ok", "transit_data_source": data_source}


@router.get("/health/db", summary="Check PostgreSQL and PostGIS health")
def database_health(db: DatabaseSession) -> dict[str, str]:
    try:
        postgis_version = db.execute(text("SELECT PostGIS_Version()")).scalar_one()
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PostgreSQL/PostGIS is unavailable",
        ) from error
    return {"status": "ok", "postgis_version": postgis_version}
