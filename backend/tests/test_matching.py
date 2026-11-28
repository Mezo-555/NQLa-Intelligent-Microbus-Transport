from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from app.core.config import Settings
from app.services.matching import (
    CompatibilityResult,
    DriverCandidate,
    RideMatcher,
    RouteCompatibilityProvider,
)

NOW = datetime(2026, 1, 1, tzinfo=UTC)


def driver(
    *,
    latitude: float = 0,
    longitude: float = 0,
    availability: str = "available",
    last_seen_at: datetime = NOW,
) -> DriverCandidate:
    return DriverCandidate(
        driver_id=uuid4(),
        latitude=latitude,
        longitude=longitude,
        availability=availability,
        last_seen_at=last_seen_at,
    )


def test_closer_driver_ranks_first_and_eta_is_approximate() -> None:
    near, far = driver(latitude=0.001), driver(latitude=0.01)
    matcher = RideMatcher(Settings(_env_file=None))

    results = matcher.rank([far, near], (0, 0), (0.02, 0), now=NOW)

    assert [candidate.driver_id for candidate in results] == [near.driver_id, far.driver_id]
    assert results[0].rank == 1
    assert results[0].pickup_distance_meters < results[1].pickup_distance_meters
    assert results[0].estimated_pickup_minutes > 0
    assert "Approximate pickup ETA" in results[0].explanation[1]
    assert results[0].data_source == "synthetic_mock"


def test_busy_offline_stale_and_out_of_radius_drivers_are_excluded() -> None:
    candidates = [
        driver(availability="busy"),
        driver(availability="offline"),
        driver(last_seen_at=NOW - timedelta(seconds=Settings(_env_file=None).driver_location_max_age_seconds + 1)),
        driver(latitude=0, longitude=1),
    ]

    assert RideMatcher(Settings(_env_file=None)).rank(candidates, (0, 0), (1, 1), now=NOW) == []


class FixedCompatibilityProvider(RouteCompatibilityProvider):
    def __init__(self, scores: dict[str, float]) -> None:
        self.scores = scores

    def evaluate(self, candidate, pickup, dropoff) -> CompatibilityResult:
        score = self.scores[str(candidate.driver_id)]
        return CompatibilityResult(score, "test route compatibility score", "test_provider")


def test_route_compatibility_weight_changes_ranking() -> None:
    near = driver(latitude=0.001)
    farther = driver(latitude=0.01)
    provider = FixedCompatibilityProvider(
        {str(near.driver_id): 0, str(farther.driver_id): 1}
    )
    settings = Settings(
        _env_file=None,
        matching_weights_proximity=0.1,
        matching_weights_eta=0.1,
        matching_weights_route_compatibility=0.8,
    )

    results = RideMatcher(settings, provider).rank([near, farther], (0, 0), (0.1, 0), now=NOW)

    assert results[0].driver_id == farther.driver_id
    assert results[0].route_compatibility_score == 1
    assert results[0].data_source == "test_provider"


def test_eta_uses_configured_average_speed() -> None:
    candidate = driver(latitude=0, longitude=0.01)
    settings = Settings(_env_file=None, matching_average_speed_kmh=10)

    result = RideMatcher(settings).rank([candidate], (0, 0), (0.1, 0), now=NOW)[0]

    assert result.estimated_pickup_minutes == pytest.approx(6.67, abs=0.1)


def test_zero_weights_are_rejected() -> None:
    with pytest.raises(ValueError, match="matching weight"):
        RideMatcher(
            Settings(
                _env_file=None,
                matching_weights_proximity=0,
                matching_weights_eta=0,
                matching_weights_route_compatibility=0,
            )
        )
