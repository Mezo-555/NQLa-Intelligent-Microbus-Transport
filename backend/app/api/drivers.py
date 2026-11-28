from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import Geography
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DatabaseSession, require_roles
from app.core.config import get_settings
from app.models.driver import AvailabilityStatus, DriverLocation, DriverProfile
from app.models.ride import MatchStatus, RideMatch, RideRequest
from app.models.user import User, UserRole
from app.schemas.driver import (
    AvailabilityUpdate,
    DriverLocationRead,
    DriverLocationUpdate,
    DriverRideOfferRead,
    DriverStatusRead,
    NearbyDriverRead,
)
from app.services.geospatial import point_wkt

router = APIRouter(prefix="/drivers", tags=["drivers"])


def _driver_profile(db: DatabaseSession, user_id) -> DriverProfile:
    profile = db.scalar(select(DriverProfile).where(DriverProfile.user_id == user_id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")
    return profile


def _location_read(location: DriverLocation | None) -> DriverLocationRead | None:
    if location is None:
        return None
    recorded_at = location.recorded_at
    if recorded_at.tzinfo is None:
        recorded_at = recorded_at.replace(tzinfo=UTC)
    stale = datetime.now(UTC) - recorded_at > timedelta(
        seconds=get_settings().driver_location_max_age_seconds
    )
    return DriverLocationRead(
        latitude=location.latitude,
        longitude=location.longitude,
        recorded_at=recorded_at,
        is_stale=stale,
    )


@router.post("/me/location", response_model=DriverLocationRead, status_code=status.HTTP_201_CREATED)
def update_location(
    payload: DriverLocationUpdate,
    user: CurrentUser,
    db: DatabaseSession,
) -> DriverLocationRead:
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver role required")
    profile = _driver_profile(db, user.id)
    location = DriverLocation(
        driver_id=profile.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        point=point_wkt(payload.latitude, payload.longitude),
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return _location_read(location)


@router.put("/me/availability", response_model=DriverStatusRead)
def set_availability(
    payload: AvailabilityUpdate,
    user: CurrentUser,
    db: DatabaseSession,
) -> DriverStatusRead:
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver role required")
    profile = _driver_profile(db, user.id)
    profile.availability = payload.status
    db.commit()
    db.refresh(profile)
    latest = db.scalar(
        select(DriverLocation)
        .where(DriverLocation.driver_id == profile.id)
        .order_by(DriverLocation.recorded_at.desc())
        .limit(1)
    )
    return DriverStatusRead(availability=profile.availability, location=_location_read(latest))


@router.get("/me/status", response_model=DriverStatusRead)
def get_driver_status(user: CurrentUser, db: DatabaseSession) -> DriverStatusRead:
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver role required")
    profile = _driver_profile(db, user.id)
    latest = db.scalar(
        select(DriverLocation)
        .where(DriverLocation.driver_id == profile.id)
        .order_by(DriverLocation.recorded_at.desc())
        .limit(1)
    )
    return DriverStatusRead(availability=profile.availability, location=_location_read(latest))


@router.get("/me/matches", response_model=list[DriverRideOfferRead])
def get_driver_match_offers(
    user: CurrentUser,
    db: DatabaseSession,
    limit: int = Query(default=50, ge=1, le=100),
) -> list[DriverRideOfferRead]:
    if user.role != UserRole.DRIVER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver role required")
    profile = _driver_profile(db, user.id)
    rows = db.execute(
        select(RideMatch, RideRequest)
        .join(RideRequest, RideRequest.id == RideMatch.ride_request_id)
        .where(RideMatch.driver_id == profile.id, RideMatch.status == MatchStatus.OFFERED)
        .order_by(RideMatch.created_at.desc())
        .limit(limit)
    ).all()
    return [
        DriverRideOfferRead(
            match_id=match.id,
            ride_request_id=ride.id,
            rank=match.rank,
            score=match.score,
            pickup_latitude=ride.pickup_latitude,
            pickup_longitude=ride.pickup_longitude,
            dropoff_latitude=ride.dropoff_latitude,
            dropoff_longitude=ride.dropoff_longitude,
            pickup_distance_meters=match.pickup_distance_meters,
            estimated_pickup_minutes=match.estimated_pickup_minutes,
            route_compatibility_score=match.route_compatibility_score,
            explanation=match.explanation,
            data_source=match.data_source,
            created_at=match.created_at,
        )
        for match, ride in rows
    ]


@router.get("/nearby", response_model=list[NearbyDriverRead])
def nearby_drivers(
    latitude: float,
    longitude: float,
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
    db: DatabaseSession,
    radius_meters: int = 2000,
) -> list[NearbyDriverRead]:
    settings = get_settings()
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid coordinates")
    if not 0 < radius_meters <= settings.matching_radius_meters:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid search radius")

    latest_location_id = (
        select(DriverLocation.id)
        .where(DriverLocation.driver_id == DriverProfile.id)
        .order_by(DriverLocation.recorded_at.desc())
        .limit(1)
        .correlate(DriverProfile)
        .scalar_subquery()
    )
    db_point = func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326).cast(
        Geography(srid=4326)
    )
    cutoff = datetime.now(UTC) - timedelta(
        seconds=settings.driver_location_max_age_seconds
    )
    distance_expression = func.ST_Distance(DriverLocation.point, db_point)
    rows = db.execute(
        select(DriverProfile, DriverLocation, distance_expression)
        .join(DriverLocation, DriverLocation.id == latest_location_id)
        .where(
            DriverProfile.availability == AvailabilityStatus.AVAILABLE,
            DriverLocation.recorded_at >= cutoff,
            func.ST_DWithin(DriverLocation.point, db_point, radius_meters),
        )
        .order_by(distance_expression)
    ).all()
    return [
        NearbyDriverRead(
            driver_id=profile.id,
            latitude=location.latitude,
            longitude=location.longitude,
            distance_meters=distance,
            availability=profile.availability,
            last_seen_at=location.recorded_at,
        )
        for profile, location, distance in rows
    ]
