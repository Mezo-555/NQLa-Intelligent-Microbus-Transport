from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.ride import MatchStatus, RideStatus


class RideRequestCreate(BaseModel):
    pickup_latitude: float = Field(ge=-90, le=90)
    pickup_longitude: float = Field(ge=-180, le=180)
    dropoff_latitude: float = Field(ge=-90, le=90)
    dropoff_longitude: float = Field(ge=-180, le=180)


class RideRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pickup_latitude: float
    pickup_longitude: float
    dropoff_latitude: float
    dropoff_longitude: float
    status: RideStatus
    created_at: datetime


class MatchCandidateRead(BaseModel):
    driver_id: UUID
    rank: int
    score: float
    pickup_distance_meters: float
    estimated_pickup_minutes: float
    route_compatibility_score: float
    availability: str
    explanation: list[str]
    data_source: str


class RideMatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    driver_id: UUID
    rank: int
    score: float
    pickup_distance_meters: float
    estimated_pickup_minutes: float
    route_compatibility_score: float
    explanation: list[str]
    data_source: str
    status: MatchStatus


class RideMatchesRead(BaseModel):
    ride_request_id: UUID
    candidates: list[RideMatchRead]
    route_compatibility_source: str = "synthetic_mock"
    eta_is_approximate: bool = True


class MatchDecision(BaseModel):
    accept: bool


class MatchDecisionRead(BaseModel):
    match_id: UUID
    match_status: MatchStatus
    ride_status: RideStatus
