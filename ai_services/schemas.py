from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class VehicleState(str, Enum):
    IDLE = "IDLE"
    EN_ROUTE = "EN_ROUTE"
    BOARDING = "BOARDING"
    FULL = "FULL"


class SafetyTier(str, Enum):
    PLATINUM = "PLATINUM_SAFE_DRIVER"  # >= 90
    GOLD = "GOLD_SAFE_DRIVER"          # 80 - 89.9
    STANDARD = "STANDARD"              # 70 - 79.9
    COACHING = "NEEDS_COACHING"        # < 70


class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)


class GPSPing(BaseModel):
    """Smartphone-only GPS telemetry stream (BR-08)."""
    driver_id: str
    route_id: str
    timestamp: int  # Unix epoch seconds
    location: Coordinates
    speed_kmh: float = Field(..., ge=0.0)
    bearing_degrees: float = Field(..., ge=0.0, lt=360.0)
    state: VehicleState
    occupancy: int = Field(..., ge=0, le=14)
    is_reckless_ground_truth: Optional[bool] = None  # Offline validation only


class WaitingHereSignal(BaseModel):
    """Passenger 'waiting here' demand signal without seat reservation (UR-P04)."""
    signal_id: str
    passenger_id: str
    stop_id: str
    zone_id: str
    target_route_id: Optional[str] = None
    created_at: int
    expires_at: int  # Default TTL = 900s (15 mins)
    status: str = "ACTIVE"  # ACTIVE | BOARDED | EXPIRED


class QRBoardingEvent(BaseModel):
    """Triggered when a passenger scans the in-vehicle QR code upon boarding."""
    event_id: str
    passenger_id: str
    driver_id: str
    route_id: str
    stop_id: str
    zone_id: str
    boarded_at: int
    wait_duration_seconds: int = Field(..., ge=0)


class ZoneDemandRecord(BaseModel):
    """Aggregated spatiotemporal bin used to train Module 5A (BR-03, FR-5.1)."""
    timestamp_bin: int  # Start of 15-min or 60-min window
    hour_of_day: int
    day_of_week: int
    is_weekend: bool
    zone_id: str
    zone_name: str
    waiting_signals_count: int
    verified_boardings_count: int
    expired_unmet_count: int
    avg_wait_seconds: float
    active_vehicles_count: int


class SafetyScoreResponse(BaseModel):
    """Explainable, EWMA-stabilized driver safety output (BR-05, AIQ-04, NFR-11)."""
    driver_id: str
    trip_score: float = Field(..., ge=0.0, le=100.0)
    ewma_safety_score: float = Field(..., ge=0.0, le=100.0)
    reward_tier: SafetyTier
    total_distance_km: float
    harsh_braking_count: int
    rapid_accel_count: int
    speeding_count: int
    sharp_swerve_count: int
    flags: List[str]
    coaching_explanation: str  # Required by NFR-11 (Explainability)