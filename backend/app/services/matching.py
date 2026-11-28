from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID

from app.core.config import Settings
from app.services.geospatial import distance_meters


@dataclass(frozen=True)
class DriverCandidate:
    driver_id: UUID
    latitude: float
    longitude: float
    availability: str
    last_seen_at: datetime


@dataclass(frozen=True)
class CompatibilityResult:
    score: float
    explanation: str
    data_source: str


class RouteCompatibilityProvider(Protocol):
    def evaluate(
        self, driver: DriverCandidate, pickup: tuple[float, float], dropoff: tuple[float, float]
    ) -> CompatibilityResult: ...


class MockRouteCompatibilityProvider:
    """Neutral placeholder until verified route assignments are available."""

    def evaluate(
        self, driver: DriverCandidate, pickup: tuple[float, float], dropoff: tuple[float, float]
    ) -> CompatibilityResult:
        return CompatibilityResult(
            score=0.5,
            explanation="Route compatibility is mocked; no production route data is loaded.",
            data_source="synthetic_mock",
        )


@dataclass(frozen=True)
class MatchCandidate:
    driver_id: UUID
    rank: int
    score: float
    pickup_distance_meters: float
    estimated_pickup_minutes: float
    route_compatibility_score: float
    availability: str
    explanation: tuple[str, ...]
    data_source: str


class RideMatcher:
    def __init__(
        self,
        settings: Settings,
        compatibility_provider: RouteCompatibilityProvider | None = None,
    ) -> None:
        self.settings = settings
        self.compatibility_provider = compatibility_provider or MockRouteCompatibilityProvider()
        self.weights = (
            settings.matching_weights_proximity,
            settings.matching_weights_eta,
            settings.matching_weights_route_compatibility,
        )
        if sum(self.weights) <= 0:
            raise ValueError("At least one matching weight must be greater than zero")

    def rank(
        self,
        drivers: list[DriverCandidate],
        pickup: tuple[float, float],
        dropoff: tuple[float, float],
        now: datetime | None = None,
    ) -> list[MatchCandidate]:
        now = now or datetime.now(UTC)
        candidates: list[tuple[float, float, DriverCandidate, float, float, float, tuple[str, ...], str]] = []
        radius = self.settings.matching_radius_meters
        max_eta_minutes = radius / (self.settings.matching_average_speed_kmh * 1000 / 60)
        total_weight = sum(self.weights)

        for driver in drivers:
            if driver.availability != "available":
                continue
            seen_at = driver.last_seen_at
            if seen_at.tzinfo is None:
                seen_at = seen_at.replace(tzinfo=UTC)
            age_seconds = (now - seen_at).total_seconds()
            if age_seconds < 0 or age_seconds > self.settings.driver_location_max_age_seconds:
                continue

            distance = distance_meters(pickup[0], pickup[1], driver.latitude, driver.longitude)
            if distance > radius:
                continue
            eta_minutes = distance / 1000 / self.settings.matching_average_speed_kmh * 60
            compatibility = self.compatibility_provider.evaluate(driver, pickup, dropoff)
            if not 0 <= compatibility.score <= 1:
                raise ValueError("Route compatibility score must be between 0 and 1")
            proximity_score = max(0.0, 1 - distance / radius)
            eta_score = max(0.0, 1 - eta_minutes / max_eta_minutes)
            score = (
                proximity_score * self.weights[0]
                + eta_score * self.weights[1]
                + compatibility.score * self.weights[2]
            ) / total_weight
            explanation = (
                f"Pickup is approximately {distance:.0f} m away.",
                f"Approximate pickup ETA is {eta_minutes:.1f} min at the configured average speed.",
                compatibility.explanation,
                "Location is recent and driver is available.",
            )
            candidates.append(
                (
                    score,
                    distance,
                    driver,
                    eta_minutes,
                    compatibility.score,
                    age_seconds,
                    explanation,
                    compatibility.data_source,
                )
            )

        candidates.sort(key=lambda candidate: (-candidate[0], candidate[1], str(candidate[2].driver_id)))
        return [
            MatchCandidate(
                driver_id=driver.driver_id,
                rank=rank,
                score=score,
                pickup_distance_meters=distance,
                estimated_pickup_minutes=eta,
                route_compatibility_score=compatibility_score,
                availability=driver.availability,
                explanation=explanation,
                data_source=data_source,
            )
            for rank, (
                score,
                distance,
                driver,
                eta,
                compatibility_score,
                _age_seconds,
                explanation,
                data_source,
            ) in enumerate(candidates, start=1)
        ]
