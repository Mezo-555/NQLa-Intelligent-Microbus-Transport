import pytest
from app.api import routing
from app.core.security import create_access_token, hash_password, verify_password
from app.main import app
from app.models.user import UserRole
from app.schemas.auth import RegisterRequest
from app.schemas.ride import RideRequestCreate
from fastapi import HTTPException
from fastapi.testclient import TestClient

client = TestClient(app)


def test_password_hashing_and_jwt_round_trip() -> None:
    from uuid import uuid4

    from app.core.security import decode_access_token

    user_id = uuid4()
    hashed = hash_password("a-safe-test-password")

    assert hashed != "a-safe-test-password"
    assert verify_password("a-safe-test-password", hashed)
    assert not verify_password("incorrect-password", hashed)
    assert decode_access_token(create_access_token(user_id)) == user_id


def test_admin_self_registration_is_rejected() -> None:
    try:
        RegisterRequest(email="admin@example.com", password="valid-password", role=UserRole.ADMIN)
    except ValueError as error:
        assert "cannot be self-registered" in str(error)
    else:
        raise AssertionError("Admin registration should be rejected")


def test_health_endpoint_and_synthetic_route_api() -> None:
    health_response = client.get("/health")
    journey_response = client.post(
        "/api/v1/routes/search",
        json={
            "origin_stop_id": "mock_north",
            "destination_stop_id": "mock_east",
            "max_transfers": 1,
        },
    )

    assert health_response.status_code == 200
    assert health_response.json()["transit_data_source"] == "synthetic_mock"
    assert journey_response.status_code == 200
    assert journey_response.json()["data_source"] == "synthetic_mock"
    assert journey_response.json()["is_estimate"] is True
    assert any(
        journey["transfer_count"] == 1
        for journey in journey_response.json()["journeys"]
    )


def test_invalid_route_and_coordinate_requests_are_rejected() -> None:
    invalid_route = client.post(
        "/api/v1/routes/search",
        json={"origin_stop_id": "unknown", "destination_stop_id": "mock_south"},
    )
    invalid_ride = client.post(
        "/api/v1/rides",
        json={
            "pickup_latitude": 91,
            "pickup_longitude": 0,
            "dropoff_latitude": 0,
            "dropoff_longitude": 0,
        },
    )

    assert invalid_route.status_code == 422
    assert invalid_ride.status_code == 401
    try:
        RideRequestCreate(
            pickup_latitude=91,
            pickup_longitude=0,
            dropoff_latitude=0,
            dropoff_longitude=0,
        )
    except ValueError:
        pass
    else:
        raise AssertionError("Out-of-range coordinates should be rejected")


def test_protected_driver_endpoint_requires_bearer_token() -> None:
    status_response = client.get("/api/v1/drivers/me/status")
    offers_response = client.get("/api/v1/drivers/me/matches")

    assert status_response.status_code == 401
    assert offers_response.status_code == 401


def test_synthetic_route_search_is_disabled_without_a_development_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(routing, "planner", None)

    with pytest.raises(HTTPException) as error:
        routing.search_journeys(
            routing.JourneySearchRequest(
                origin_stop_id="mock_north",
                destination_stop_id="mock_south",
            )
        )

    assert error.value.status_code == 503
