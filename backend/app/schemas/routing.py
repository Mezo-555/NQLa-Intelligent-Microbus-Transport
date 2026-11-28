from pydantic import BaseModel, ConfigDict, Field


class JourneySearchRequest(BaseModel):
    origin_stop_id: str = Field(min_length=1, max_length=128)
    destination_stop_id: str = Field(min_length=1, max_length=128)
    max_transfers: int = Field(default=2, ge=0, le=5)
    limit: int = Field(default=3, ge=1, le=10)


class StopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stop_id: str
    name: str


class RouteSegmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    route_id: str
    route_name: str
    from_stop: StopRead
    to_stop: StopRead
    stop_ids: list[str]
    travel_minutes: float


class JourneyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    segments: list[RouteSegmentRead]
    transfer_count: int
    travel_minutes: float
    estimated_total_minutes: float
    walking_distance_meters: float


class JourneySearchResponse(BaseModel):
    data_source: str
    is_estimate: bool = True
    journeys: list[JourneyRead]
