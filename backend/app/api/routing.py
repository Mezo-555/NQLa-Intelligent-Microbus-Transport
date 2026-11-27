from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.routing import JourneySearchRequest, JourneySearchResponse
from app.services.routing import RoutePlanner, SyntheticTransitNetwork

router = APIRouter(prefix="/routes", tags=["route planning"])
settings = get_settings()
planner = (
    RoutePlanner(SyntheticTransitNetwork())
    if settings.environment in {"development", "test"}
    else None
)


@router.post("/search", response_model=JourneySearchResponse)
def search_journeys(payload: JourneySearchRequest) -> JourneySearchResponse:
    if planner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Transit network provider is not configured for this environment",
        )
    try:
        journeys = planner.search(
            payload.origin_stop_id,
            payload.destination_stop_id,
            max_transfers=payload.max_transfers,
            limit=payload.limit,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    return JourneySearchResponse(data_source=planner.provider.source, journeys=journeys)
