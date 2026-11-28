from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.driver import AvailabilityStatus


class DriverLocationUpdate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class DriverLocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    latitude: float
    longitude: float
    recorded_at: datetime
    is_stale: bool


class AvailabilityUpdate(BaseModel):
    status: AvailabilityStatus


class DriverStatusRead(BaseModel):
    availability: AvailabilityStatus
    location: DriverLocationRead | None


class NearbyDriverRead(BaseModel):
    driver_id: UUID
    latitude: float
    longitude: float
    distance_meters: float
    availability: AvailabilityStatus
    last_seen_at: datetime


class DriverRideOfferRead(BaseModel):
    match_id: UUID
    ride_request_id: UUID
    rank: int
    score: float
    pickup_latitude: float
    pickup_longitude: float
    dropoff_latitude: float
    dropoff_longitude: float
    pickup_distance_meters: float
    estimated_pickup_minutes: float
    route_compatibility_score: float
    explanation: list[str]
    data_source: str
    created_at: datetime
