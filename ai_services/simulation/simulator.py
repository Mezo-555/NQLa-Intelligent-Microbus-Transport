import math
import random
import uuid
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Deque, Dict, List, Optional, Tuple
import numpy as np

from ai_services.simulation.network_loader import AlexandriaNetworkLoader, haversine_meters
from ai_services.schemas import (
    Coordinates,
    GPSPing,
    QRBoardingEvent,
    VehicleState,
    WaitingHereSignal,
    ZoneDemandRecord,
)


def compute_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0


@dataclass
class MicrobusAgent:
    driver_id: str
    route_id: str
    stop_sequence: List[str]
    seq_index: int
    is_reckless: bool
    capacity: int = 14
    occupancy: int = 0
    state: VehicleState = VehicleState.EN_ROUTE
    edge_progress_m: float = 0.0
    dwell_timer_s: int = 0
    current_speed_kmh: float = 35.0
    anomaly_cooldown_s: int = 0
    passenger_destinations: List[str] = field(default_factory=list)

    @property
    def current_stop(self) -> str:
        return self.stop_sequence[self.seq_index]

    @property
    def next_stop(self) -> str:
        next_idx = (self.seq_index + 1) % len(self.stop_sequence)
        return self.stop_sequence[next_idx]


class AlexandriaTrafficSimulator:
    """
    Discrete-event & agent-based microbus simulator for Alexandria.
    Models decaying 'waiting_here' signals, QR-code boardings, autonomous driver
    incentive response, and smartphone GPS telemetry with kinematic anomalies.
    """

    def __init__(
        self,
        num_buses: int = 18,
        reckless_ratio: float = 0.25,
        signal_ttl_seconds: int = 900,
        seed: int = 42,
    ):
        random.seed(seed)
        np.random.seed(seed)

        loader = AlexandriaNetworkLoader()
        self.graph, self.routes = loader.load()
        self.route_ids = list(self.routes.keys())
        self.signal_ttl_seconds = signal_ttl_seconds

        # Active FIFO queues of WaitingHereSignal per stop_id
        self.active_signals: Dict[str, Deque[WaitingHereSignal]] = defaultdict(deque)
        self.buses: List[MicrobusAgent] = self._init_fleet(num_buses, reckless_ratio)

    def _init_fleet(self, num_buses: int, reckless_ratio: float) -> List[MicrobusAgent]:
        fleet = []
        for idx in range(num_buses):
            route_id = self.route_ids[idx % len(self.route_ids)]
            seq = self.routes[route_id]
            start_idx = idx % max(1, len(seq) - 1)
            initial_occ = random.randint(2, 8)
            # Assign dummy onboard destinations further down the route
            possible_dests = seq[start_idx + 1 :] if start_idx + 1 < len(seq) else [seq[-1]]
            dests = [random.choice(possible_dests) for _ in range(initial_occ)]

            fleet.append(
                MicrobusAgent(
                    driver_id=f"DRV_{idx + 1:03d}",
                    route_id=route_id,
                    stop_sequence=seq,
                    seq_index=start_idx,
                    is_reckless=(random.random() < reckless_ratio),
                    occupancy=initial_occ,
                    passenger_destinations=dests,
                )
            )
        return fleet

    def _rush_hour_multiplier(self, hour: int, is_weekend: bool) -> float:
        """Models Alexandria diurnal commuting peaks and Friday/Saturday shifts."""
        if is_weekend:
            if 13 <= hour <= 22:
                return 1.6
            return 0.5
        if 7 <= hour <= 9:
            return 2.4  # Morning university & work rush
        if 14 <= hour <= 17:
            return 2.1  # Afternoon release peak
        if 20 <= hour <= 22:
            return 1.3
        return 0.55

    def _reverse_route_id(self, route_id: str) -> str:
        if route_id.endswith("_FWD"):
            return route_id[:-4] + "_REV"
        if route_id.endswith("_REV"):
            return route_id[:-4] + "_FWD"
        return route_id

    def _driver_accepts_incentive(
        self, bus: MicrobusAgent, target_zone: str, incentive_bonus: float
    ) -> bool:
        """
        Logistic utility choice model (inspired by i-Rebalance [4]):
        drivers weigh incentive reward against deadhead travel distance.
        """
        u_node = self.graph.nodes[bus.current_stop]
        # Find nearest stop in target_zone
        zone_stops = [
            n for n, d in self.graph.nodes(data=True) if d["zone_id"] == target_zone
        ]
        if not zone_stops:
            return False

        min_dist_km = min(
            haversine_meters(
                u_node["lat"], u_node["lon"],
                self.graph.nodes[s]["lat"], self.graph.nodes[s]["lon"]
            ) / 1000.0
            for s in zone_stops
        )
        utility = (0.12 * incentive_bonus) - (0.35 * min_dist_km) + np.random.normal(0, 0.3)
        prob_accept = 1.0 / (1.0 + math.exp(-utility))
        return random.random() < prob_accept

    def run(
        self,
        start_timestamp: int,
        duration_minutes: int = 180,
        dt_seconds: int = 5,
        active_incentives: Optional[Dict[str, float]] = None,
    ) -> Tuple[List[GPSPing], List[QRBoardingEvent], List[ZoneDemandRecord]]:
        """
        Runs the simulation for `duration_minutes`.
        `active_incentives`: optional map of {zone_id: bonus_value} for counterfactual testing.
        """
        gps_logs: List[GPSPing] = []
        boarding_logs: List[QRBoardingEvent] = []
        demand_records: List[ZoneDemandRecord] = []

        # Track 15-minute bucket stats per zone for Module 5A training
        bucket_seconds = 900
        zone_names = {}
        for _, data in self.graph.nodes(data=True):
            zone_names.setdefault(data["zone_id"], data["name"])

        bucket_stats = defaultdict(
            lambda: {
                "signals": 0,
                "boarded": 0,
                "expired": 0,
                "wait_times": [],
                "vehicle_ticks": 0,
            }
        )

        total_steps = (duration_minutes * 60) // dt_seconds

        for step in range(total_steps):
            ts = start_timestamp + step * dt_seconds
            current_bucket = (ts // bucket_seconds) * bucket_seconds
            hour = (ts // 3600) % 24
            day_of_week = (ts // 86400) % 7
            is_weekend = day_of_week in (4, 5)  # Friday=4, Saturday=5 (epoch Thu=0)

            # 1. Expire stale 'waiting_here' signals (TTL exceeded -> unmet demand)
            for stop_id, queue in self.active_signals.items():
                zone_id = self.graph.nodes[stop_id]["zone_id"]
                while queue and queue[0].expires_at <= ts:
                    expired_sig = queue.popleft()
                    expired_sig.status = "EXPIRED"
                    bucket_stats[(current_bucket, zone_id)]["expired"] += 1
                    bucket_stats[(current_bucket, zone_id)]["wait_times"].append(
                        float(self.signal_ttl_seconds)
                    )

            # 2. Generate new Poisson 'waiting_here' passenger signals every 60s
            if (step * dt_seconds) % 60 == 0:
                mult = self._rush_hour_multiplier(hour, is_weekend)
                for stop_id, node_data in self.graph.nodes(data=True):
                    lam_per_min = (node_data["base_lambda"] * mult) / 10.0
                    arrivals = int(np.random.poisson(lam_per_min))
                    zone_id = node_data["zone_id"]

                    for _ in range(arrivals):
                        sig = WaitingHereSignal(
                            signal_id=f"SIG_{uuid.uuid4().hex[:8]}",
                            passenger_id=f"PAX_{uuid.uuid4().hex[:6]}",
                            stop_id=stop_id,
                            zone_id=zone_id,
                            created_at=ts,
                            expires_at=ts + self.signal_ttl_seconds,
                        )
                        self.active_signals[stop_id].append(sig)
                        bucket_stats[(current_bucket, zone_id)]["signals"] += 1

            # 3. Step each microbus agent
            for bus in self.buses:
                u_stop = bus.current_stop
                v_stop = bus.next_stop
                u_data = self.graph.nodes[u_stop]
                v_data = self.graph.nodes[v_stop]
                bucket_stats[(current_bucket, u_data["zone_id"])]["vehicle_ticks"] += 1

                edge_data = self.graph.edges[u_stop, v_stop]
                edge_dist = edge_data["distance_m"]
                speed_limit = edge_data["speed_limit_kmh"]

                if bus.state == VehicleState.BOARDING:
                    bus.current_speed_kmh = 0.0
                    bus.dwell_timer_s -= dt_seconds
                    if bus.dwell_timer_s <= 0:
                        bus.state = (
                            VehicleState.FULL
                            if bus.occupancy >= bus.capacity
                            else VehicleState.EN_ROUTE
                        )
                else:
                    # Kinematic speed profile (sustained speeding bursts + hard braking)
                    if bus.is_reckless and bus.anomaly_cooldown_s <= 0 and random.random() < 0.03:
                        bus.current_speed_kmh = random.uniform(76.0, 88.0)
                        bus.anomaly_cooldown_s = 30  # Hold high speed for ~15s before braking
                    elif bus.is_reckless and bus.anomaly_cooldown_s > 15:
                        # Sustain speeding across multiple ticks
                        bus.current_speed_kmh = random.uniform(74.0, 86.0)
                    elif bus.is_reckless and 5 <= bus.anomaly_cooldown_s <= 15:
                        # Harsh braking & holding low speed for 10s (traffic/stop slowdown)
                        bus.current_speed_kmh = random.uniform(10.0, 16.0)
                    else:
                        target_v = speed_limit * random.uniform(0.65, 0.90)
                        bus.current_speed_kmh = max(
                            8.0, bus.current_speed_kmh + (target_v - bus.current_speed_kmh) * 0.4
                        )

                    if bus.anomaly_cooldown_s > 0:
                        bus.anomaly_cooldown_s -= dt_seconds

                    bus.edge_progress_m += (bus.current_speed_kmh / 3.6) * dt_seconds

                    # Reached next stop along route
                    if bus.edge_progress_m >= edge_dist:
                        bus.edge_progress_m = 0.0
                        bus.seq_index += 1

                        # Turn around at terminal stop
                        if bus.seq_index >= len(bus.stop_sequence) - 1:
                            rev_route = self._reverse_route_id(bus.route_id)
                            if rev_route in self.routes:
                                bus.route_id = rev_route
                                bus.stop_sequence = self.routes[rev_route]
                            bus.seq_index = 0

                        arrived_stop = bus.current_stop
                        arrived_zone = self.graph.nodes[arrived_stop]["zone_id"]

                        # Alight passengers whose destination was this stop (or terminal)
                        remaining_dests = [
                            d for d in bus.passenger_destinations if d != arrived_stop
                        ]
                        alighted = len(bus.passenger_destinations) - len(remaining_dests)
                        if bus.seq_index == 0:  # Terminal: everyone alights
                            alighted = bus.occupancy
                            remaining_dests = []
                        bus.passenger_destinations = remaining_dests
                        bus.occupancy = max(0, bus.occupancy - alighted)

                        # Board waiting passengers (QR scan verification)
                        free_seats = bus.capacity - bus.occupancy
                        stop_queue = self.active_signals[arrived_stop]
                        boarded_now = 0
                        remaining_stops = bus.stop_sequence[bus.seq_index + 1 :]

                        while free_seats > 0 and stop_queue and remaining_stops:
                            sig = stop_queue.popleft()
                            sig.status = "BOARDED"
                            wait_sec = max(0, ts - sig.created_at)

                            bus.occupancy += 1
                            free_seats -= 1
                            boarded_now += 1
                            bus.passenger_destinations.append(random.choice(remaining_stops))

                            boarding_logs.append(
                                QRBoardingEvent(
                                    event_id=f"QR_{uuid.uuid4().hex[:8]}",
                                    passenger_id=sig.passenger_id,
                                    driver_id=bus.driver_id,
                                    route_id=bus.route_id,
                                    stop_id=arrived_stop,
                                    zone_id=arrived_zone,
                                    boarded_at=ts,
                                    wait_duration_seconds=wait_sec,
                                )
                            )
                            bucket_stats[(current_bucket, arrived_zone)]["boarded"] += 1
                            bucket_stats[(current_bucket, arrived_zone)]["wait_times"].append(
                                float(wait_sec)
                            )

                        # Autonomous driver repositioning if empty at terminal and incentives exist
                        if (
                            active_incentives
                            and bus.occupancy <= 2
                            and bus.seq_index == 0
                        ):
                            best_zone, best_bonus = max(
                                active_incentives.items(), key=lambda kv: kv[1]
                            )
                            if best_bonus > 0 and self._driver_accepts_incentive(
                                bus, best_zone, best_bonus
                            ):
                                matching_routes = [
                                    r_id
                                    for r_id, seq in self.routes.items()
                                    if any(
                                        self.graph.nodes[s]["zone_id"] == best_zone
                                        for s in seq
                                    )
                                ]
                                if matching_routes:
                                    chosen_r = random.choice(matching_routes)
                                    bus.route_id = chosen_r
                                    bus.stop_sequence = self.routes[chosen_r]
                                    bus.seq_index = 0

                        if boarded_now > 0 or alighted > 0:
                            bus.state = VehicleState.BOARDING
                            bus.dwell_timer_s = random.choice([10, 15, 20])

                # Emit smartphone GPS ping with ~2.5m Gaussian positional noise
                u_n = self.graph.nodes[bus.current_stop]
                v_n = self.graph.nodes[bus.next_stop]
                seg_dist = self.graph.edges[bus.current_stop, bus.next_stop]["distance_m"]
                ratio = min(1.0, bus.edge_progress_m / max(1.0, seg_dist))

                lat = u_n["lat"] + (v_n["lat"] - u_n["lat"]) * ratio + np.random.normal(0, 0.000022)
                lon = u_n["lon"] + (v_n["lon"] - u_n["lon"]) * ratio + np.random.normal(0, 0.000022)
                bearing = compute_bearing(u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"])

                if bus.is_reckless and random.random() < 0.025:
                    bearing = (bearing + random.choice([-45.0, 45.0])) % 360.0

                gps_logs.append(
                    GPSPing(
                        driver_id=bus.driver_id,
                        route_id=bus.route_id,
                        timestamp=ts,
                        location=Coordinates(lat=round(lat, 6), lon=round(lon, 6)),
                        speed_kmh=round(bus.current_speed_kmh, 2),
                        bearing_degrees=round(bearing, 1),
                        state=bus.state,
                        occupancy=bus.occupancy,
                        is_reckless_ground_truth=bus.is_reckless,
                    )
                )

        # 4. Build aggregated 15-minute ZoneDemandRecord rows for Module 5A
        ticks_per_bucket = bucket_seconds // dt_seconds
        for (b_ts, z_id), stats in sorted(bucket_stats.items()):
            b_hour = (b_ts // 3600) % 24
            b_dow = (b_ts // 86400) % 7
            waits = stats["wait_times"]
            avg_wait = float(np.mean(waits)) if waits else 0.0
            avg_vehicles = round(stats["vehicle_ticks"] / max(1, ticks_per_bucket), 2)

            demand_records.append(
                ZoneDemandRecord(
                    timestamp_bin=b_ts,
                    hour_of_day=b_hour,
                    day_of_week=b_dow,
                    is_weekend=(b_dow in (4, 5)),
                    zone_id=z_id,
                    zone_name=zone_names.get(z_id, z_id),
                    waiting_signals_count=stats["signals"],
                    verified_boardings_count=stats["boarded"],
                    expired_unmet_count=stats["expired"],
                    avg_wait_seconds=round(avg_wait, 1),
                    active_vehicles_count=int(round(avg_vehicles)),
                )
            )

        return gps_logs, boarding_logs, demand_records