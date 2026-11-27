from app import models
from app.db.base import Base
from app.models.driver import DriverLocation
from app.models.transit import Route, Stop
from geoalchemy2 import Geography, Geometry
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import configure_mappers
from sqlalchemy.schema import CreateIndex, CreateTable


def test_spatial_models_use_srid_4326_and_gist_indexes() -> None:
    driver_location_type = DriverLocation.__table__.c.point.type
    stop_type = Stop.__table__.c.point.type
    route_type = Route.__table__.c.geometry.type
    pickup_type = models.RideRequest.__table__.c.pickup_point.type
    dropoff_type = models.RideRequest.__table__.c.dropoff_point.type

    assert isinstance(driver_location_type, Geography)
    assert driver_location_type.srid == 4326
    assert isinstance(pickup_type, Geography)
    assert pickup_type.srid == 4326
    assert isinstance(dropoff_type, Geography)
    assert dropoff_type.srid == 4326
    assert isinstance(stop_type, Geometry)
    assert stop_type.srid == 4326
    assert isinstance(route_type, Geometry)
    assert route_type.srid == 4326

    index_sql = [
        str(CreateIndex(index).compile(dialect=postgresql.dialect()))
        for table in (
            DriverLocation.__table__,
            models.RideRequest.__table__,
            Stop.__table__,
            Route.__table__,
        )
        for index in table.indexes
    ]
    assert any("using gist" in statement.lower() for statement in index_sql)
    assert "driver_locations" in str(
        CreateTable(DriverLocation.__table__).compile(dialect=postgresql.dialect())
    )


def test_expected_future_transit_tables_are_registered() -> None:
    configure_mappers()
    assert models.User.__tablename__ == "users"
    assert {
        "transit_routes",
        "transit_stops",
        "transit_route_stops",
        "driver_locations",
        "ride_requests",
        "ride_matches",
    }.issubset(Base.metadata.tables)
