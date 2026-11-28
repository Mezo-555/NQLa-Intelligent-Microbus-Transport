"""Create the initial PostGIS-enabled NQLa backend schema."""

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography, Geometry
from sqlalchemy.dialects import postgresql

revision = "0001_backend_foundation"
down_revision = None
branch_labels = None
depends_on = None

user_role = postgresql.ENUM("CLIENT", "DRIVER", "ADMIN", name="user_role", create_type=False)
availability_status = postgresql.ENUM(
    "OFFLINE", "AVAILABLE", "BUSY", name="availability_status", create_type=False
)
ride_status = postgresql.ENUM(
    "REQUESTED", "MATCHED", "CANCELLED", "COMPLETED", name="ride_status", create_type=False
)
match_status = postgresql.ENUM(
    "OFFERED", "ACCEPTED", "REJECTED", "WITHDRAWN", name="match_status", create_type=False
)
transit_data_source = postgresql.ENUM(
    "SYNTHETIC", "GTFS", "MANUAL", name="transit_data_source", create_type=False
)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE TYPE user_role AS ENUM ('CLIENT', 'DRIVER', 'ADMIN')")
    op.execute("CREATE TYPE availability_status AS ENUM ('OFFLINE', 'AVAILABLE', 'BUSY')")
    op.execute(
        "CREATE TYPE ride_status AS ENUM ('REQUESTED', 'MATCHED', 'CANCELLED', 'COMPLETED')"
    )
    op.execute("CREATE TYPE match_status AS ENUM ('OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')")
    op.execute(
        "CREATE TYPE transit_data_source AS ENUM ('SYNTHETIC', 'GTFS', 'MANUAL')"
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "driver_profiles",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("availability", availability_status, server_default="OFFLINE", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_driver_profiles_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_driver_profiles"),
        sa.UniqueConstraint("user_id", name="uq_driver_profiles_user_id"),
    )
    op.create_index("ix_driver_profiles_availability", "driver_profiles", ["availability"])

    op.create_table(
        "driver_locations",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("driver_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("point", Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_driver_locations_latitude_range"),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_driver_locations_longitude_range"),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["driver_profiles.id"],
            name="fk_driver_locations_driver_id_driver_profiles",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_driver_locations"),
    )
    op.create_index(
        "ix_driver_locations_driver_recorded_at",
        "driver_locations",
        ["driver_id", "recorded_at"],
    )
    op.create_index(
        "ix_driver_locations_point_gist",
        "driver_locations",
        ["point"],
        postgresql_using="gist",
    )

    op.create_table(
        "transit_routes",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("source_id", sa.String(length=128), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("data_source", transit_data_source, nullable=False),
        sa.Column("geometry", Geometry(geometry_type="LINESTRING", srid=4326, spatial_index=False)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_transit_routes"),
    )
    op.create_index(
        "ix_transit_routes_geometry_gist",
        "transit_routes",
        ["geometry"],
        postgresql_using="gist",
    )

    op.create_table(
        "transit_stops",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("source_id", sa.String(length=128), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("point", Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("data_source", transit_data_source, nullable=False),
        sa.CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_transit_stops_latitude_range"),
        sa.CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_transit_stops_longitude_range"),
        sa.PrimaryKeyConstraint("id", name="pk_transit_stops"),
    )
    op.create_index("ix_transit_stops_name", "transit_stops", ["name"])
    op.create_index(
        "ix_transit_stops_point_gist",
        "transit_stops",
        ["point"],
        postgresql_using="gist",
    )

    op.create_table(
        "transit_route_stops",
        sa.Column("route_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("stop_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("stop_sequence", sa.Integer(), nullable=False),
        sa.Column("estimated_travel_minutes_from_previous", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(
            ["route_id"],
            ["transit_routes.id"],
            name="fk_transit_route_stops_route_id_transit_routes",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["stop_id"],
            ["transit_stops.id"],
            name="fk_transit_route_stops_stop_id_transit_stops",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("route_id", "stop_id", "stop_sequence", name="pk_transit_route_stops"),
        sa.UniqueConstraint("route_id", "stop_sequence", name="uq_route_stop_sequence"),
        sa.UniqueConstraint("route_id", "stop_id", name="uq_route_stop_pair"),
    )

    op.create_table(
        "ride_requests",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("passenger_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("pickup_latitude", sa.Float(), nullable=False),
        sa.Column("pickup_longitude", sa.Float(), nullable=False),
        sa.Column("dropoff_latitude", sa.Float(), nullable=False),
        sa.Column("dropoff_longitude", sa.Float(), nullable=False),
        sa.Column("pickup_point", Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("dropoff_point", Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("status", ride_status, server_default="REQUESTED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("pickup_latitude BETWEEN -90 AND 90", name="ck_ride_requests_pickup_latitude_range"),
        sa.CheckConstraint("pickup_longitude BETWEEN -180 AND 180", name="ck_ride_requests_pickup_longitude_range"),
        sa.CheckConstraint("dropoff_latitude BETWEEN -90 AND 90", name="ck_ride_requests_dropoff_latitude_range"),
        sa.CheckConstraint("dropoff_longitude BETWEEN -180 AND 180", name="ck_ride_requests_dropoff_longitude_range"),
        sa.ForeignKeyConstraint(
            ["passenger_id"], ["users.id"], name="fk_ride_requests_passenger_id_users", ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ride_requests"),
    )
    op.create_index("ix_ride_requests_passenger_id", "ride_requests", ["passenger_id"])
    op.create_index(
        "ix_ride_requests_pickup_point_gist",
        "ride_requests",
        ["pickup_point"],
        postgresql_using="gist",
    )
    op.create_index(
        "ix_ride_requests_dropoff_point_gist",
        "ride_requests",
        ["dropoff_point"],
        postgresql_using="gist",
    )

    op.create_table(
        "ride_matches",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("ride_request_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("driver_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("pickup_distance_meters", sa.Float(), nullable=False),
        sa.Column("estimated_pickup_minutes", sa.Float(), nullable=False),
        sa.Column("route_compatibility_score", sa.Float(), nullable=False),
        sa.Column("explanation", sa.JSON(), nullable=False),
        sa.Column("data_source", sa.String(length=24), nullable=False),
        sa.Column("status", match_status, server_default="OFFERED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rank > 0", name="ck_ride_matches_rank_positive"),
        sa.CheckConstraint("score BETWEEN 0 AND 1", name="ck_ride_matches_score_range"),
        sa.CheckConstraint(
            "route_compatibility_score BETWEEN 0 AND 1",
            name="ck_ride_matches_route_compatibility_score_range",
        ),
        sa.CheckConstraint(
            "pickup_distance_meters >= 0",
            name="ck_ride_matches_pickup_distance_nonnegative",
        ),
        sa.CheckConstraint(
            "estimated_pickup_minutes >= 0",
            name="ck_ride_matches_pickup_eta_nonnegative",
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["driver_profiles.id"],
            name="fk_ride_matches_driver_id_driver_profiles",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ride_request_id"],
            ["ride_requests.id"],
            name="fk_ride_matches_ride_request_id_ride_requests",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ride_matches"),
        sa.UniqueConstraint("ride_request_id", "driver_id", name="uq_ride_matches_request_driver"),
    )


def downgrade() -> None:
    op.drop_table("ride_matches")
    op.drop_index("ix_ride_requests_dropoff_point_gist", table_name="ride_requests")
    op.drop_index("ix_ride_requests_pickup_point_gist", table_name="ride_requests")
    op.drop_index("ix_ride_requests_passenger_id", table_name="ride_requests")
    op.drop_table("ride_requests")
    op.drop_table("transit_route_stops")
    op.drop_index("ix_transit_stops_point_gist", table_name="transit_stops")
    op.drop_index("ix_transit_stops_name", table_name="transit_stops")
    op.drop_table("transit_stops")
    op.drop_index("ix_transit_routes_geometry_gist", table_name="transit_routes")
    op.drop_table("transit_routes")
    op.drop_index("ix_driver_locations_point_gist", table_name="driver_locations")
    op.drop_index("ix_driver_locations_driver_recorded_at", table_name="driver_locations")
    op.drop_table("driver_locations")
    op.drop_index("ix_driver_profiles_availability", table_name="driver_profiles")
    op.drop_table("driver_profiles")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    for enum_name in (
        "transit_data_source",
        "match_status",
        "ride_status",
        "availability_status",
        "user_role",
    ):
        op.execute(f"DROP TYPE {enum_name}")
