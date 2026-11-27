import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.driver import DriverProfile
    from app.models.user import User


class RideStatus(str, enum.Enum):
    REQUESTED = "requested"
    MATCHED = "matched"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class MatchStatus(str, enum.Enum):
    OFFERED = "offered"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class RideRequest(Base):
    __tablename__ = "ride_requests"
    __table_args__ = (
        CheckConstraint("pickup_latitude BETWEEN -90 AND 90", name="pickup_latitude_range"),
        CheckConstraint("pickup_longitude BETWEEN -180 AND 180", name="pickup_longitude_range"),
        CheckConstraint("dropoff_latitude BETWEEN -90 AND 90", name="dropoff_latitude_range"),
        CheckConstraint("dropoff_longitude BETWEEN -180 AND 180", name="dropoff_longitude_range"),
        Index("ix_ride_requests_pickup_point_gist", "pickup_point", postgresql_using="gist"),
        Index("ix_ride_requests_dropoff_point_gist", "dropoff_point", postgresql_using="gist"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    passenger_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    pickup_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    dropoff_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    dropoff_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_point: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False
    )
    dropoff_point: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False
    )
    status: Mapped[RideStatus] = mapped_column(
        Enum(RideStatus, name="ride_status"), default=RideStatus.REQUESTED, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    passenger: Mapped["User"] = relationship(back_populates="ride_requests")
    matches: Mapped[list["RideMatch"]] = relationship(
        back_populates="ride_request", cascade="all, delete-orphan"
    )


class RideMatch(Base):
    __tablename__ = "ride_matches"
    __table_args__ = (
        UniqueConstraint("ride_request_id", "driver_id", name="uq_ride_matches_request_driver"),
        CheckConstraint("rank > 0", name="rank_positive"),
        CheckConstraint("score BETWEEN 0 AND 1", name="score_range"),
        CheckConstraint(
            "route_compatibility_score BETWEEN 0 AND 1",
            name="route_compatibility_score_range",
        ),
        CheckConstraint("pickup_distance_meters >= 0", name="pickup_distance_nonnegative"),
        CheckConstraint("estimated_pickup_minutes >= 0", name="pickup_eta_nonnegative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_request_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("ride_requests.id", ondelete="CASCADE"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("driver_profiles.id", ondelete="CASCADE"), nullable=False
    )
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_distance_meters: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_pickup_minutes: Mapped[float] = mapped_column(Float, nullable=False)
    route_compatibility_score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    data_source: Mapped[str] = mapped_column(String(24), default="mock", nullable=False)
    status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus, name="match_status"), default=MatchStatus.OFFERED, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ride_request: Mapped[RideRequest] = relationship(back_populates="matches")
    driver: Mapped["DriverProfile"] = relationship(back_populates="ride_matches")
