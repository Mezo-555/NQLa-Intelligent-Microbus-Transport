import os
from datetime import UTC, datetime

import pytest
from app.db.base import Base
from app.models.driver import AvailabilityStatus, DriverLocation, DriverProfile
from app.models.user import User, UserRole
from app.services.geospatial import point_wkt
from geoalchemy2 import Geography
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

pytestmark = pytest.mark.integration


@pytest.fixture
def postgres_engine():
    if os.getenv("RUN_POSTGIS_INTEGRATION") != "1":
        pytest.skip("Set RUN_POSTGIS_INTEGRATION=1 for PostGIS integration tests")
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        pytest.skip("Set DATABASE_URL to run PostGIS integration tests")

    engine = create_engine(database_url, pool_pre_ping=True)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT PostGIS_Version()"))
    except OperationalError:
        pytest.skip("PostgreSQL/PostGIS integration database is unavailable")

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


def test_postgis_extension_and_spatial_nearby_query(postgres_engine) -> None:
    with postgres_engine.connect() as connection:
        version = connection.execute(text("SELECT PostGIS_Version()")).scalar_one()
        assert version

    with Session(postgres_engine) as session:
        user = User(
            email="integration-driver@example.com",
            hashed_password="not-a-real-password",
            role=UserRole.DRIVER,
        )
        profile = DriverProfile(user=user, availability=AvailabilityStatus.AVAILABLE)
        session.add(profile)
        session.flush()

        old_time = datetime(2026, 1, 1, tzinfo=UTC)
        new_time = datetime(2026, 1, 1, 0, 1, tzinfo=UTC)
        session.add_all(
            [
                DriverLocation(
                    driver_id=profile.id,
                    latitude=31.2501,
                    longitude=29.9687,
                    point=point_wkt(31.2501, 29.9687),
                    recorded_at=old_time,
                ),
                DriverLocation(
                    driver_id=profile.id,
                    latitude=31.2001,
                    longitude=29.9187,
                    point=point_wkt(31.2001, 29.9187),
                    recorded_at=new_time,
                ),
            ]
        )
        session.commit()

        latest_location_id = (
            select(DriverLocation.id)
            .where(DriverLocation.driver_id == profile.id)
            .order_by(DriverLocation.recorded_at.desc())
            .limit(1)
            .scalar_subquery()
        )
        search_point = (
            func.ST_SetSRID(func.ST_MakePoint(29.9187, 31.2001), 4326)
            .cast(Geography(srid=4326))
        )
        distance = func.ST_Distance(DriverLocation.point, search_point)
        row = session.execute(
            select(DriverLocation, distance)
            .where(
                DriverLocation.id == latest_location_id,
                func.ST_DWithin(DriverLocation.point, search_point, 500),
            )
        ).one()

        location, meters = row
        assert location.latitude == pytest.approx(31.2001)
        assert meters < 500


def test_database_constraints_reject_out_of_range_coordinates(postgres_engine) -> None:
    with Session(postgres_engine) as session:
        user = User(
            email="constraint-client@example.com",
            hashed_password="not-a-real-password",
            role=UserRole.CLIENT,
        )
        session.add(user)
        session.flush()

        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO ride_requests "
                    "(id, passenger_id, pickup_latitude, pickup_longitude, "
                    "dropoff_latitude, dropoff_longitude, pickup_point, dropoff_point, status) "
                    "VALUES (gen_random_uuid(), :passenger_id, 91, 0, 31, 29, "
                    "ST_SetSRID(ST_MakePoint(29, 91), 4326), "
                    "ST_SetSRID(ST_MakePoint(29, 31), 4326), 'REQUESTED')"
                ),
                {"passenger_id": str(user.id)},
            )
            session.commit()
        session.rollback()
