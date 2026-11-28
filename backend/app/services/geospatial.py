import math

from geoalchemy2.elements import WKTElement

EARTH_RADIUS_METERS = 6_371_008.8


def validate_coordinates(latitude: float, longitude: float) -> None:
    if not -90 <= latitude <= 90:
        raise ValueError("latitude must be between -90 and 90")
    if not -180 <= longitude <= 180:
        raise ValueError("longitude must be between -180 and 180")


def point_wkt(latitude: float, longitude: float) -> WKTElement:
    validate_coordinates(latitude, longitude)
    return WKTElement(f"POINT({longitude} {latitude})", srid=4326)


def distance_meters(
    latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float
) -> float:
    validate_coordinates(latitude_a, longitude_a)
    validate_coordinates(latitude_b, longitude_b)
    lat_a, lat_b = math.radians(latitude_a), math.radians(latitude_b)
    delta_lat = lat_b - lat_a
    delta_lon = math.radians(longitude_b - longitude_a)
    haversine = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat_a) * math.cos(lat_b) * math.sin(delta_lon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_METERS * math.asin(math.sqrt(min(1.0, haversine)))
