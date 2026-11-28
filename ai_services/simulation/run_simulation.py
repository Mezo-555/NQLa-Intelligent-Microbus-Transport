import os
from collections import defaultdict
import pandas as pd

from ai_services.safety_scoring.safety_scorer import DriverSafetyScorer
from ai_services.simulation.simulator import AlexandriaTrafficSimulator


def main():
    os.makedirs("data", exist_ok=True)

    # Simulate 7 full days (168 hours) at 5-second resolution so your teammate
    # has hourly + daily lag features (t-1, t-24h) for Demand Forecasting (BR-03)
    start_ts = 1763856000  # Reference start epoch
    sim = AlexandriaTrafficSimulator(num_buses=24, reckless_ratio=0.25, seed=42)

    print("Running 7-day Alexandria microbus simulation...")
    gps_pings, qr_boardings, zone_demands = sim.run(
        start_timestamp=start_ts,
        duration_minutes=7 * 24 * 60,
        dt_seconds=5,
    )

    # 1. Export datasets for Track 3 Demand Forecasting teammate
    demand_df = pd.DataFrame([d.model_dump() for d in zone_demands])
    boardings_df = pd.DataFrame([b.model_dump() for b in qr_boardings])

    demand_df.to_csv("data/simulated_zone_demand_7d.csv", index=False)
    boardings_df.to_csv("data/simulated_qr_boardings_7d.csv", index=False)
    print(f"Exported {len(demand_df):,} 15-min zone demand rows -> data/simulated_zone_demand_7d.csv")
    print(f"Exported {len(boardings_df):,} QR boarding events -> data/simulated_qr_boardings_7d.csv\n")

    # 2. Evaluate Driver Safety Scorer across sequential 1-hour windows to test EWMA stability
    scorer = DriverSafetyScorer(speed_limit_kmh=55.0)
    pings_by_driver = defaultdict(list)
    ground_truth = {}

    for ping in gps_pings:
        pings_by_driver[ping.driver_id].append(ping)
        ground_truth[ping.driver_id] = ping.is_reckless_ground_truth

    summary_rows = []
    for driver_id, d_pings in sorted(pings_by_driver.items()):
        # Split driver's 7-day telemetry into 4-hour shift chunks to simulate sequential trips
        chunk_size = (4 * 3600) // 5
        ewma_score = None
        last_report = None

        for i in range(0, len(d_pings), chunk_size):
            chunk = d_pings[i : i + chunk_size]
            last_report = scorer.score_trip(chunk, previous_ewma_score=ewma_score)
            ewma_score = last_report.ewma_safety_score

        if last_report:
            summary_rows.append(
                {
                    "Driver": driver_id,
                    "Ground Truth": "RECKLESS" if ground_truth[driver_id] else "NORMAL",
                    "Last Trip": last_report.trip_score,
                    "EWMA Score": last_report.ewma_safety_score,
                    "Tier": last_report.reward_tier.value,
                    "Brakes": last_report.harsh_braking_count,
                    "Speeding": last_report.speeding_count,
                    "Swerves": last_report.sharp_swerve_count,
                }
            )

    summary_df = pd.DataFrame(summary_rows)
    print("=== Driver Safety Scoring Benchmark (BR-05 / AIQ-04) ===")
    print(summary_df.to_string(index=False))


if __name__ == "__main__":
    main()