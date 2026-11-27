import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import (
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


class TransitDataSource(str, enum.Enum):
    SYNTHETIC = "synthetic"
    GTFS = "gtfs"
    MANUAL = "manual"


TRANSIT_DATA_SOURCE_ENUM = Enum(TransitDataSource, name="transit_data_source")


class Route(Base):
    __tablename__ = "transit_routes"
    __table_args__ = (
        Index(
            "ix_transit_routes_geometry_gist",
            "geometry",
            postgresql_using="gist",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    data_source: Mapped[TransitDataSource] = mapped_column(
        TRANSIT_DATA_SOURCE_ENUM, nullable=False
    )
    geometry: Mapped[object | None] = mapped_column(
        Geometry(geometry_type="LINESTRING", srid=4326, spatial_index=False), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    route_stops: Mapped[list["RouteStop"]] = relationship(
        back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.stop_sequence"
    )


class Stop(Base):
    __tablename__ = "transit_stops"
    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90", name="latitude_range"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="longitude_range"),
        Index(
            "ix_transit_stops_point_gist",
            "point",
            postgresql_using="gist",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    point: Mapped[object] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False
    )
    data_source: Mapped[TransitDataSource] = mapped_column(
        TRANSIT_DATA_SOURCE_ENUM, nullable=False
    )

    route_stops: Mapped[list["RouteStop"]] = relationship(back_populates="stop")


class RouteStop(Base):
    __tablename__ = "transit_route_stops"
    __table_args__ = (
        UniqueConstraint("route_id", "stop_sequence", name="uq_route_stop_sequence"),
        UniqueConstraint("route_id", "stop_id", name="uq_route_stop_pair"),
    )

    route_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("transit_routes.id", ondelete="CASCADE"), primary_key=True
    )
    stop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("transit_stops.id", ondelete="RESTRICT"), primary_key=True
    )
    stop_sequence: Mapped[int] = mapped_column(Integer, primary_key=True)
    estimated_travel_minutes_from_previous: Mapped[float | None] = mapped_column(Float, nullable=True)

    route: Mapped[Route] = relationship(back_populates="route_stops")
    stop: Mapped[Stop] = relationship(back_populates="route_stops")
