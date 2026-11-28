import math
import os
from typing import Dict, List, Tuple
import networkx as nx
import pandas as pd


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def assign_spatial_zone(lat: float, lon: float, grid_step_deg: float = 0.012) -> str:
    """
    Maps raw coordinates to an Alexandria spatial grid zone (~1.1 km x 1.3 km cells)
    so stop-level events aggregate cleanly for Module 5 demand forecasting (FR-5.1).
    """
    lat_idx = int(math.floor((lat - 31.10) / grid_step_deg))
    lon_idx = int(math.floor((lon - 29.85) / grid_step_deg))
    return f"ALEX_Z_{lat_idx:02d}_{lon_idx:02d}"


class AlexandriaNetworkLoader:
    """
    Loads Alexandria microbus corridors into a directed NetworkX graph.
    Supports DigitalTransport4Africa (DT4A) GTFS files with an offline multi-corridor fallback.
    """

    def __init__(self, gtfs_dir: str = "data/gtfs"):
        self.gtfs_dir = gtfs_dir

    def load(self) -> Tuple[nx.DiGraph, Dict[str, List[str]]]:
        """Returns (directed_transit_graph, route_id -> ordered_stop_ids)."""
        required_files = ["stops.txt", "routes.txt", "trips.txt", "stop_times.txt"]
        has_gtfs = all(
            os.path.exists(os.path.join(self.gtfs_dir, f)) for f in required_files
        )

        if has_gtfs:
            print(f"[NetworkLoader] Loading real DT4A GTFS dataset from {self.gtfs_dir}...")
            return self._load_from_gtfs()

        print("[NetworkLoader] GTFS files not found. Loading built-in 3-corridor Alexandria network...")
        return self._load_builtin_alexandria_corridors()

    def _load_from_gtfs(self) -> Tuple[nx.DiGraph, Dict[str, List[str]]]:
        stops_df = pd.read_csv(os.path.join(self.gtfs_dir, "stops.txt"))
        trips_df = pd.read_csv(os.path.join(self.gtfs_dir, "trips.txt"))
        stop_times_df = pd.read_csv(os.path.join(self.gtfs_dir, "stop_times.txt"))

        g = nx.DiGraph()
        route_sequences: Dict[str, List[str]] = {}

        # Add stop nodes
        for _, row in stops_df.iterrows():
            stop_id = str(row["stop_id"])
            lat, lon = float(row["stop_lat"]), float(row["stop_lon"])
            zone_id = assign_spatial_zone(lat, lon)
            g.add_node(
                stop_id,
                name=str(row.get("stop_name", stop_id)),
                lat=lat,
                lon=lon,
                zone_id=zone_id,
                base_lambda=8.0,
            )

        # Pick one canonical trip per route_id to extract stop sequences
        canonical_trips = trips_df.drop_duplicates(subset=["route_id"])
        for _, trip_row in canonical_trips.iterrows():
            route_id = str(trip_row["route_id"])
            trip_id = trip_row["trip_id"]

            seq_df = stop_times_df[stop_times_df["trip_id"] == trip_id].sort_values(
                by="stop_sequence"
            )
            ordered_stops = [str(s) for s in seq_df["stop_id"].tolist() if str(s) in g.nodes]
            if len(ordered_stops) < 2:
                continue

            route_sequences[route_id] = ordered_stops
            for i in range(len(ordered_stops) - 1):
                u, v = ordered_stops[i], ordered_stops[i + 1]
                u_n, v_n = g.nodes[u], g.nodes[v]
                dist_m = max(50.0, haversine_meters(u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"]))
                g.add_edge(
                    u,
                    v,
                    distance_m=dist_m,
                    speed_limit_kmh=50.0,
                    route_ids=list(set(g.edges[u, v]["route_ids"] + [route_id]))
                    if g.has_edge(u, v)
                    else [route_id],
                )

        # Boost base passenger arrival rates at multi-route transfer hubs
        for node_id in g.nodes:
            degree = g.in_degree(node_id) + g.out_degree(node_id)
            g.nodes[node_id]["base_lambda"] = round(6.0 + (degree * 2.5), 1)

        return g, route_sequences

    def _load_builtin_alexandria_corridors(self) -> Tuple[nx.DiGraph, Dict[str, List[str]]]:
        """
        Realistic 3-corridor Alexandria microbus network with transfer hubs
        (Mahatet El Raml, El Shatby, Sidi Gaber, Victoria, El Mandara).
        """
        stops_catalog = [
            # Corridor 1: Corniche Line (Raml <-> Mandara)
            ("ST_RAML", "Mahatet El Raml", 31.2014, 29.9006, 14.0),
            ("ST_SHATBY", "El Shatby (University)", 31.2116, 29.9142, 16.0),
            ("ST_CAMP_CHEZAR", "Camp Chezar", 31.2178, 29.9241, 8.0),
            ("ST_SIDI_GABER_C", "Sidi Gaber (Corniche)", 31.2265, 29.9360, 12.0),
            ("ST_STANLEY", "Stanley", 31.2346, 29.9488, 7.0),
            ("ST_SAN_STEFANO", "San Stefano", 31.2469, 29.9675, 11.0),
            ("ST_SIDI_BISHR_C", "Sidi Bishr (Corniche)", 31.2638, 29.9912, 13.0),
            ("ST_MANDARA", "El Mandara", 31.2785, 30.0118, 14.0),
            # Corridor 2: Abu Qir Inland Line (Raml <-> Sidi Gaber Station <-> Victoria <-> Mandara)
            ("ST_BAB_SHARQ", "Bab Sharq", 31.2035, 29.9155, 9.0),
            ("ST_SIDI_GABER_ST", "Sidi Gaber (Train Station)", 31.2192, 29.9418, 18.0),
            ("ST_ROUSHDY", "Roushdy", 31.2315, 29.9545, 9.0),
            ("ST_BAKOUS", "Bakous", 31.2398, 29.9702, 12.0),
            ("ST_VICTORIA", "Victoria Hub", 31.2495, 29.9855, 17.0),
            ("ST_ASAFRA_IN", "El Asafra (Gamal Abdel Nasser)", 31.2680, 30.0045, 12.0),
            # Corridor 3: Cross-Connector (El Shatby <-> Sidi Gaber Station <-> Victoria)
            ("ST_IBRAHIMIA", "El Ibrahimia", 31.2150, 29.9285, 11.0),
        ]

        corridors = {
            "ROUTE_CORNICHE_01": (
                [
                    "ST_RAML",
                    "ST_SHATBY",
                    "ST_CAMP_CHEZAR",
                    "ST_SIDI_GABER_C",
                    "ST_STANLEY",
                    "ST_SAN_STEFANO",
                    "ST_SIDI_BISHR_C",
                    "ST_MANDARA",
                ],
                55.0,
            ),
            "ROUTE_ABUQIR_02": (
                [
                    "ST_RAML",
                    "ST_BAB_SHARQ",
                    "ST_SIDI_GABER_ST",
                    "ST_ROUSHDY",
                    "ST_BAKOUS",
                    "ST_VICTORIA",
                    "ST_ASAFRA_IN",
                    "ST_MANDARA",
                ],
                45.0,
            ),
            "ROUTE_CROSS_03": (
                [
                    "ST_SHATBY",
                    "ST_IBRAHIMIA",
                    "ST_SIDI_GABER_ST",
                    "ST_SIDI_GABER_C",
                    "ST_SAN_STEFANO",
                    "ST_VICTORIA",
                ],
                40.0,
            ),
        }

        g = nx.DiGraph()
        for stop_id, name, lat, lon, base_lambda in stops_catalog:
            g.add_node(
                stop_id,
                name=name,
                lat=lat,
                lon=lon,
                zone_id=assign_spatial_zone(lat, lon),
                base_lambda=base_lambda,
            )

        route_sequences: Dict[str, List[str]] = {}
        for route_id, (stop_list, speed_limit) in corridors.items():
            # Bidirectional microbus route: forward + reverse
            route_sequences[f"{route_id}_FWD"] = stop_list
            route_sequences[f"{route_id}_REV"] = list(reversed(stop_list))

            for seq in (stop_list, list(reversed(stop_list))):
                for i in range(len(seq) - 1):
                    u, v = seq[i], seq[i + 1]
                    u_n, v_n = g.nodes[u], g.nodes[v]
                    dist_m = haversine_meters(u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"])
                    if g.has_edge(u, v):
                        g.edges[u, v]["route_ids"].append(route_id)
                    else:
                        g.add_edge(
                            u,
                            v,
                            distance_m=round(dist_m, 1),
                            speed_limit_kmh=speed_limit,
                            route_ids=[route_id],
                        )

        return g, route_sequences


if __name__ == "__main__":
    loader = AlexandriaNetworkLoader()
    graph, routes = loader.load()
    zones = {data["zone_id"] for _, data in graph.nodes(data=True)}
    print(f"Loaded {graph.number_of_nodes()} stops across {len(zones)} spatial zones.")
    print(f"Loaded {graph.number_of_edges()} directed road segments across {len(routes)} directional routes.")
    for r_id, seq in routes.items():
        print(f"  - {r_id}: {len(seq)} stops ({seq[0]} -> {seq[-1]})")