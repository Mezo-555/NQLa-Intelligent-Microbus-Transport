from datetime import UTC, datetime, timedelta

from geoalchemy2 import Geography
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.driver import AvailabilityStatus, DriverLocation, DriverProfile


def find_nearby_available_drivers(
    db: Session,
    latitude: float,
    longitude: float,
    radius_meters: int,
    settings: Settings,
) -> list[tuple[DriverProfile, DriverLocation]]:
    latest_location_id = (
        select(DriverLocation.id)
        .where(DriverLocation.driver_id == DriverProfile.id)
        .order_by(DriverLocation.recorded_at.desc())
        .limit(1)
        .correlate(DriverProfile)
        .scalar_subquery()
    )
    search_point = func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326).cast(
        Geography(srid=4326)
    )
    cutoff = datetime.now(UTC) - timedelta(
        seconds=settings.driver_location_max_age_seconds
    )
    rows = db.execute(
        select(DriverProfile, DriverLocation)
        .join(DriverLocation, DriverLocation.id == latest_location_id)
        .where(
            DriverProfile.availability == AvailabilityStatus.AVAILABLE,
            DriverLocation.recorded_at >= cutoff,
            func.ST_DWithin(DriverLocation.point, search_point, radius_meters),
        )
    ).all()
    return [(profile, location) for profile, location in rows]
