import pytest
from app.services.geospatial import distance_meters, point_wkt, validate_coordinates


@pytest.mark.parametrize(
    ("latitude", "longitude"),
    [(90, 180), (-90, -180), (0, 0)],
)
def test_coordinate_boundaries_are_valid(latitude: float, longitude: float) -> None:
    validate_coordinates(latitude, longitude)
    point = point_wkt(latitude, longitude)
    assert point.srid == 4326


@pytest.mark.parametrize(("latitude", "longitude"), [(90.1, 0), (0, -180.1)])
def test_out_of_range_coordinates_are_rejected(latitude: float, longitude: float) -> None:
    with pytest.raises(ValueError):
        point_wkt(latitude, longitude)


def test_haversine_distance_is_symmetric_and_zero_for_same_point() -> None:
    distance = distance_meters(0, 0, 0, 1)

    assert distance == pytest.approx(111_195, abs=100)
    assert distance_meters(0, 0, 0, 0) == 0
    assert distance == pytest.approx(distance_meters(0, 1, 0, 0))
