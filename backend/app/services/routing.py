from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from heapq import heappop, heappush
from itertools import count
from typing import Protocol


@dataclass(frozen=True)
class NetworkStop:
    stop_id: str
    name: str


@dataclass(frozen=True)
class Connection:
    from_stop_id: str
    to_stop_id: str
    route_id: str
    route_name: str
    travel_minutes: float


@dataclass(frozen=True)
class RouteSegment:
    route_id: str
    route_name: str
    from_stop: NetworkStop
    to_stop: NetworkStop
    stop_ids: tuple[str, ...]
    travel_minutes: float


@dataclass(frozen=True)
class Journey:
    segments: tuple[RouteSegment, ...]
    transfer_count: int
    travel_minutes: float
    estimated_total_minutes: float
    walking_distance_meters: float = 0


class TransitNetworkProvider(Protocol):
    source: str

    def get_stop(self, stop_id: str) -> NetworkStop | None: ...

    def get_outgoing_connections(self, stop_id: str) -> Sequence[Connection]: ...


class SyntheticTransitNetwork:
    """Small generic test graph; it does not represent Alexandria services."""

    source = "synthetic_mock"

    def __init__(self) -> None:
        self._stops: Mapping[str, NetworkStop] = {
            stop_id: NetworkStop(stop_id, name)
            for stop_id, name in {
                "mock_north": "Mock North",
                "mock_center": "Mock Center",
                "mock_south": "Mock South",
                "mock_east": "Mock East",
                "mock_terminal": "Mock Terminal",
                "mock_isolated": "Mock Isolated",
            }.items()
        }
        self._connections: Mapping[str, tuple[Connection, ...]] = {
            "mock_north": (
                Connection("mock_north", "mock_center", "mock_line_a", "Mock Line A", 8),
                Connection("mock_north", "mock_south", "mock_line_c", "Mock Line C", 24),
            ),
            "mock_center": (
                Connection("mock_center", "mock_south", "mock_line_b", "Mock Line B", 7),
                Connection("mock_center", "mock_east", "mock_line_b", "Mock Line B", 9),
            ),
            "mock_east": (
                Connection("mock_east", "mock_south", "mock_line_b", "Mock Line B", 9),
                Connection("mock_east", "mock_north", "mock_line_a", "Mock Line A", 6),
            ),
            "mock_south": (
                Connection("mock_south", "mock_terminal", "mock_line_d", "Mock Line D", 5),
            ),
            "mock_terminal": (),
            "mock_isolated": (),
        }

    def get_stop(self, stop_id: str) -> NetworkStop | None:
        return self._stops.get(stop_id)

    def get_outgoing_connections(self, stop_id: str) -> Sequence[Connection]:
        return self._connections.get(stop_id, ())


class RoutePlanner:
    def __init__(self, provider: TransitNetworkProvider, transfer_wait_minutes: float = 5) -> None:
        if transfer_wait_minutes < 0:
            raise ValueError("transfer_wait_minutes must be non-negative")
        self.provider = provider
        self.transfer_wait_minutes = transfer_wait_minutes

    def search(
        self,
        origin_stop_id: str,
        destination_stop_id: str,
        max_transfers: int = 2,
        limit: int = 3,
    ) -> list[Journey]:
        if max_transfers < 0:
            raise ValueError("max_transfers must be non-negative")
        if limit < 1:
            raise ValueError("limit must be positive")
        if self.provider.get_stop(origin_stop_id) is None:
            raise ValueError(f"Unknown origin stop: {origin_stop_id}")
        if self.provider.get_stop(destination_stop_id) is None:
            raise ValueError(f"Unknown destination stop: {destination_stop_id}")
        if origin_stop_id == destination_stop_id:
            raise ValueError("Origin and destination must be different stops")

        queue = []
        sequence = count()
        heappush(queue, (0.0, next(sequence), origin_stop_id, (), frozenset({origin_stop_id}), None, 0))
        journeys: list[Journey] = []

        while queue and len(journeys) < limit:
            cost, _, stop_id, path, visited, previous_route_id, transfers = heappop(queue)
            if stop_id == destination_stop_id:
                journeys.append(self._build_journey(path))
                continue

            for connection in self.provider.get_outgoing_connections(stop_id):
                if connection.from_stop_id != stop_id:
                    raise ValueError("Network provider returned a connection from the wrong stop")
                if connection.travel_minutes <= 0:
                    raise ValueError("Connection travel time must be positive")
                if self.provider.get_stop(connection.to_stop_id) is None:
                    raise ValueError("Network provider returned a connection to an unknown stop")
                if connection.to_stop_id in visited:
                    continue

                is_transfer = previous_route_id is not None and previous_route_id != connection.route_id
                next_transfers = transfers + is_transfer
                if next_transfers > max_transfers:
                    continue
                next_cost = cost + connection.travel_minutes
                if is_transfer:
                    next_cost += self.transfer_wait_minutes
                heappush(
                    queue,
                    (
                        next_cost,
                        next(sequence),
                        connection.to_stop_id,
                        path + (connection,),
                        visited | {connection.to_stop_id},
                        connection.route_id,
                        int(next_transfers),
                    ),
                )
        return journeys

    def _build_journey(self, connections: tuple[Connection, ...]) -> Journey:
        segments: list[RouteSegment] = []
        segment_connections: list[Connection] = []
        for connection in connections:
            if segment_connections and segment_connections[-1].route_id != connection.route_id:
                segments.append(self._build_segment(segment_connections))
                segment_connections = []
            segment_connections.append(connection)
        if segment_connections:
            segments.append(self._build_segment(segment_connections))

        travel_minutes = sum(segment.travel_minutes for segment in segments)
        transfers = max(0, len(segments) - 1)
        return Journey(
            segments=tuple(segments),
            transfer_count=transfers,
            travel_minutes=travel_minutes,
            estimated_total_minutes=travel_minutes + transfers * self.transfer_wait_minutes,
        )

    def _build_segment(self, connections: list[Connection]) -> RouteSegment:
        first, last = connections[0], connections[-1]
        stop_ids = (first.from_stop_id,) + tuple(connection.to_stop_id for connection in connections)
        return RouteSegment(
            route_id=first.route_id,
            route_name=first.route_name,
            from_stop=self.provider.get_stop(first.from_stop_id),  # type: ignore[arg-type]
            to_stop=self.provider.get_stop(last.to_stop_id),  # type: ignore[arg-type]
            stop_ids=stop_ids,
            travel_minutes=sum(connection.travel_minutes for connection in connections),
        )
