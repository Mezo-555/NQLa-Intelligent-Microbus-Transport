import pytest
from app.services.routing import (
    Connection,
    NetworkStop,
    RoutePlanner,
    SyntheticTransitNetwork,
)


@pytest.fixture
def planner() -> RoutePlanner:
    return RoutePlanner(SyntheticTransitNetwork(), transfer_wait_minutes=5)


def test_direct_journey_has_no_transfer(planner: RoutePlanner) -> None:
    journeys = planner.search("mock_north", "mock_south")

    direct = next(journey for journey in journeys if journey.transfer_count == 0)
    assert len(direct.segments) == 1
    assert direct.segments[0].route_name == "Mock Line C"
    assert direct.travel_minutes == 24
    assert direct.estimated_total_minutes == 24


def test_transfer_journey_returns_ordered_segments_and_wait(planner: RoutePlanner) -> None:
    journeys = planner.search("mock_north", "mock_east", max_transfers=1)
    transfer = next(journey for journey in journeys if journey.transfer_count == 1)

    assert [segment.route_name for segment in transfer.segments] == ["Mock Line A", "Mock Line B"]
    assert transfer.segments[0].to_stop.stop_id == "mock_center"
    assert transfer.segments[1].from_stop.stop_id == "mock_center"
    assert transfer.travel_minutes == 17
    assert transfer.estimated_total_minutes == 22


def test_transfer_limit_and_unreachable_destination(planner: RoutePlanner) -> None:
    assert planner.search("mock_north", "mock_east", max_transfers=0) == []
    assert planner.search("mock_north", "mock_isolated") == []


def test_journey_can_include_two_transfers(planner: RoutePlanner) -> None:
    class ThreeLegNetwork:
        source = "synthetic_mock"

        def __init__(self) -> None:
            self.stops = {
                stop_id: NetworkStop(stop_id, stop_id) for stop_id in ("a", "b", "c", "d")
            }
            self.connections = {
                "a": (Connection("a", "b", "line_a", "Line A", 3),),
                "b": (Connection("b", "c", "line_b", "Line B", 4),),
                "c": (Connection("c", "d", "line_c", "Line C", 5),),
                "d": (),
            }

        def get_stop(self, stop_id):
            return self.stops.get(stop_id)

        def get_outgoing_connections(self, stop_id):
            return self.connections.get(stop_id, ())

    planner = RoutePlanner(ThreeLegNetwork())
    assert planner.search("a", "d", max_transfers=1) == []
    journey = planner.search("a", "d", max_transfers=2)[0]

    assert journey.transfer_count == 2
    assert [segment.route_name for segment in journey.segments] == [
        "Line A",
        "Line B",
        "Line C",
    ]


@pytest.mark.parametrize(
    ("origin", "destination"),
    [("missing", "mock_south"), ("mock_north", "mock_north")],
)
def test_invalid_stop_requests_are_rejected(
    planner: RoutePlanner, origin: str, destination: str
) -> None:
    with pytest.raises(ValueError):
        planner.search(origin, destination)


def test_cycles_are_not_returned_as_repeated_stops(planner: RoutePlanner) -> None:
    journeys = planner.search("mock_north", "mock_east", max_transfers=2, limit=10)

    for journey in journeys:
        visited = [journey.segments[0].from_stop.stop_id]
        for segment in journey.segments:
            visited.extend(segment.stop_ids[1:])
        assert len(visited) == len(set(visited))
