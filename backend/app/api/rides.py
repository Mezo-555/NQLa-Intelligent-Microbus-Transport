from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DatabaseSession, require_roles
from app.core.config import get_settings
from app.models.driver import AvailabilityStatus, DriverProfile
from app.models.ride import MatchStatus, RideMatch, RideRequest, RideStatus
from app.models.user import User, UserRole
from app.schemas.ride import (
    MatchDecision,
    MatchDecisionRead,
    RideMatchesRead,
    RideRequestCreate,
    RideRequestRead,
)
from app.services.driver_search import find_nearby_available_drivers
from app.services.geospatial import point_wkt
from app.services.matching import DriverCandidate, RideMatcher

router = APIRouter(prefix="/rides", tags=["ride matching"])


def _ride_request(db: DatabaseSession, ride_id: UUID, user: User, lock: bool = False) -> RideRequest:
    statement = select(RideRequest).where(RideRequest.id == ride_id)
    if lock:
        statement = statement.with_for_update()
    ride = db.scalar(statement)
    if ride is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride request not found")
    if ride.passenger_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ride request")
    return ride


@router.post("", response_model=RideRequestRead, status_code=status.HTTP_201_CREATED)
def create_ride_request(
    payload: RideRequestCreate,
    user: Annotated[User, Depends(require_roles(UserRole.CLIENT))],
    db: DatabaseSession,
) -> RideRequest:
    ride = RideRequest(
        passenger_id=user.id,
        pickup_latitude=payload.pickup_latitude,
        pickup_longitude=payload.pickup_longitude,
        dropoff_latitude=payload.dropoff_latitude,
        dropoff_longitude=payload.dropoff_longitude,
        pickup_point=point_wkt(payload.pickup_latitude, payload.pickup_longitude),
        dropoff_point=point_wkt(payload.dropoff_latitude, payload.dropoff_longitude),
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride


@router.post("/{ride_id}/matches", response_model=RideMatchesRead)
def get_matches(
    ride_id: UUID,
    user: CurrentUser,
    db: DatabaseSession,
) -> RideMatchesRead:
    ride = _ride_request(db, ride_id, user)
    settings = get_settings()
    if settings.environment not in {"development", "test"}:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ride matching requires a configured route-compatibility provider",
        )
    existing = db.scalars(
        select(RideMatch).where(RideMatch.ride_request_id == ride.id).order_by(RideMatch.rank)
    ).all()
    if existing:
        return RideMatchesRead(ride_request_id=ride.id, candidates=existing)
    if ride.status != RideStatus.REQUESTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ride is no longer requestable")

    nearby = find_nearby_available_drivers(
        db,
        ride.pickup_latitude,
        ride.pickup_longitude,
        settings.matching_radius_meters,
        settings,
    )
    candidates = [
        DriverCandidate(
            driver_id=profile.id,
            latitude=location.latitude,
            longitude=location.longitude,
            availability=profile.availability.value,
            last_seen_at=location.recorded_at,
        )
        for profile, location in nearby
    ]
    ranked = RideMatcher(settings).rank(
        candidates,
        (ride.pickup_latitude, ride.pickup_longitude),
        (ride.dropoff_latitude, ride.dropoff_longitude),
    )
    matches = [
        RideMatch(
            ride_request_id=ride.id,
            driver_id=candidate.driver_id,
            rank=candidate.rank,
            score=candidate.score,
            pickup_distance_meters=candidate.pickup_distance_meters,
            estimated_pickup_minutes=candidate.estimated_pickup_minutes,
            route_compatibility_score=candidate.route_compatibility_score,
            explanation=list(candidate.explanation),
            data_source=candidate.data_source,
        )
        for candidate in ranked
    ]
    db.add_all(matches)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Matches were already generated") from error
    for match in matches:
        db.refresh(match)
    return RideMatchesRead(ride_request_id=ride.id, candidates=matches)


@router.get("/{ride_id}", response_model=RideRequestRead)
def get_ride_request(ride_id: UUID, user: CurrentUser, db: DatabaseSession) -> RideRequest:
    return _ride_request(db, ride_id, user)


@router.post(
    "/{ride_id}/matches/{match_id}/decision",
    response_model=MatchDecisionRead,
)
def respond_to_match(
    ride_id: UUID,
    match_id: UUID,
    payload: MatchDecision,
    user: Annotated[User, Depends(require_roles(UserRole.DRIVER))],
    db: DatabaseSession,
) -> MatchDecisionRead:
    profile = db.scalar(
        select(DriverProfile).where(DriverProfile.user_id == user.id).with_for_update()
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    ride = db.scalar(select(RideRequest).where(RideRequest.id == ride_id).with_for_update())
    if ride is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride request not found")
    match = db.scalar(
        select(RideMatch).where(
            RideMatch.id == match_id,
            RideMatch.ride_request_id == ride.id,
            RideMatch.driver_id == profile.id,
        )
    )
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match offer not found")
    if match.status != MatchStatus.OFFERED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Match offer was already answered")
    if payload.accept:
        if ride.status != RideStatus.REQUESTED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ride is no longer available")
        if profile.availability != AvailabilityStatus.AVAILABLE:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver is no longer available")
        match.status = MatchStatus.ACCEPTED
        ride.status = RideStatus.MATCHED
        profile.availability = AvailabilityStatus.BUSY
        db.execute(
            update(RideMatch)
            .where(
                RideMatch.ride_request_id == ride.id,
                RideMatch.id != match.id,
                RideMatch.status == MatchStatus.OFFERED,
            )
            .values(status=MatchStatus.WITHDRAWN)
            .execution_options(synchronize_session=False)
        )
    else:
        match.status = MatchStatus.REJECTED
    db.commit()
    return MatchDecisionRead(match_id=match.id, match_status=match.status, ride_status=ride.status)
