from typing import List, Optional
import numpy as np
import pandas as pd

from ai_services.simulation.network_loader import haversine_meters
from ai_services.schemas import GPSPing, SafetyScoreResponse, SafetyTier


class DriverSafetyScorer:
    """
    Computes smartphone-only kinematic safety scores (BR-05, BR-08, FR-6.3, FR-6.4)
    with EWMA temporal smoothing (AIQ-04) and explainable coaching output (NFR-11).
    """

    def __init__(
        self,
        speed_limit_kmh: float = 55.0,
        harsh_brake_threshold_mps2: float = -2.1,
        rapid_accel_threshold_mps2: float = 2.5,
        swerve_threshold_deg_per_sec: float = 7.5,
        ewma_alpha: float = 0.15,
        cold_start_prior: float = 85.0,
    ):
        self.speed_limit_kmh = speed_limit_kmh
        self.harsh_brake_threshold = harsh_brake_threshold_mps2
        self.rapid_accel_threshold = rapid_accel_threshold_mps2
        self.swerve_threshold = swerve_threshold_deg_per_sec
        self.ewma_alpha = ewma_alpha
        self.cold_start_prior = cold_start_prior

    def _assign_reward_tier(self, ewma_score: float) -> SafetyTier:
        if ewma_score >= 90.0:
            return SafetyTier.PLATINUM
        if ewma_score >= 80.0:
            return SafetyTier.GOLD
        if ewma_score >= 70.0:
            return SafetyTier.STANDARD
        return SafetyTier.COACHING

    def _build_coaching_explanation(
        self,
        flags: List[str],
        ewma_score: float,
        tier: SafetyTier,
        nlp_penalty: float,
        nlp_bonus: float,
    ) -> str:
        """Generates constructive driver feedback required by NFR-11 and UR-D06."""
        reasons = []
        if "harsh_braking" in flags:
            reasons.append("frequent sudden braking detected; keep a wider following distance")
        if "rapid_acceleration" in flags:
            reasons.append("abrupt acceleration bursts detected when leaving stops")
        if "excessive_speeding" in flags:
            reasons.append("sustained driving above corridor speed limits")
        if "erratic_lane_swerving" in flags:
            reasons.append("sharp high-speed lane changes detected")
        if nlp_penalty > 0:
            reasons.append("passenger safety complaints flagged on recent trips")

        if not reasons:
            if nlp_bonus > 0:
                return (
                    f"Great job! Smooth driving kinematics and positive passenger feedback "
                    f"maintain your {tier.value} status ({ewma_score:.1f}/100)."
                )
            return (
                f"Consistent, smooth driving across this trip. Your stabilized safety "
                f"score is {ewma_score:.1f}/100 ({tier.value})."
            )

        joined_reasons = "; ".join(reasons)
        return (
            f"Safety score updated to {ewma_score:.1f}/100 ({tier.value}). "
            f"Areas to improve: {joined_reasons}."
        )

    def score_trip(
        self,
        pings: List[GPSPing],
        previous_ewma_score: Optional[float] = None,
        nlp_penalty: float = 0.0,
        nlp_bonus: float = 0.0,
    ) -> SafetyScoreResponse:
        """
        Evaluates a completed trip's GPS sequence and updates the driver's stabilized
        EWMA safety score.
        """
        prev_score = (
            previous_ewma_score if previous_ewma_score is not None else self.cold_start_prior
        )

        if len(pings) < 3:
            driver_id = pings[0].driver_id if pings else "UNKNOWN"
            tier = self._assign_reward_tier(prev_score)
            return SafetyScoreResponse(
                driver_id=driver_id,
                trip_score=round(prev_score, 2),
                ewma_safety_score=round(prev_score, 2),
                reward_tier=tier,
                total_distance_km=0.0,
                harsh_braking_count=0,
                rapid_accel_count=0,
                speeding_count=0,
                sharp_swerve_count=0,
                flags=[],
                coaching_explanation="Insufficient GPS telemetry on this short segment; previous score maintained.",
            )

        pings = sorted(pings, key=lambda p: p.timestamp)
        driver_id = pings[0].driver_id

        lats = np.array([p.location.lat for p in pings], dtype=float)
        lons = np.array([p.location.lon for p in pings], dtype=float)
        times = np.array([p.timestamp for p in pings], dtype=float)
        bearings = np.array([p.bearing_degrees for p in pings], dtype=float)

        dt = np.diff(times)
        valid_dt = dt > 0
        dt = dt[valid_dt]

        raw_dists = np.array(
            [
                haversine_meters(lats[i], lons[i], lats[i + 1], lons[i + 1])
                for i in range(len(pings) - 1)
            ],
            dtype=float,
        )[valid_dt]

        # 1. Reject impossible GPS multipath spikes (> 140 km/h = 38.9 m/s)
        implied_vel_mps = raw_dists / dt
        clean_mask = implied_vel_mps <= 38.9
        if np.sum(clean_mask) < 2:
            tier = self._assign_reward_tier(prev_score)
            return SafetyScoreResponse(
                driver_id=driver_id,
                trip_score=round(prev_score, 2),
                ewma_safety_score=round(prev_score, 2),
                reward_tier=tier,
                total_distance_km=0.0,
                harsh_braking_count=0,
                rapid_accel_count=0,
                speeding_count=0,
                sharp_swerve_count=0,
                flags=[],
                coaching_explanation="GPS signal jitter filtered; previous safety score maintained.",
            )

        dt = dt[clean_mask]
        step_dists = raw_dists[clean_mask]
        total_distance_km = float(np.sum(step_dists) / 1000.0)

        # 2. Light 2-point smoothing preserves genuine 5s harsh braking while cutting GPS jitter
        raw_vel_mps = step_dists / dt
        vel_mps = pd.Series(raw_vel_mps).rolling(window=2, min_periods=1).mean().to_numpy()
        vel_kmh = vel_mps * 3.6

        # 3. Longitudinal acceleration (m/s^2) and oscillatory swerve detection
        accel_mps2 = np.diff(vel_mps) / dt[1:]

        d_bearing = ((np.diff(bearings)[valid_dt][clean_mask] + 180.0) % 360.0) - 180.0
        yaw_rate = d_bearing / dt  # Signed deg/sec

        # A swerve is a sharp turn (> 7 deg/s) immediately followed by an opposite correction
        yaw_reversal = (np.abs(yaw_rate[:-1]) > self.swerve_threshold) & (
            np.sign(yaw_rate[:-1]) != np.sign(yaw_rate[1:])
        ) & (np.abs(yaw_rate[1:]) > 4.0)

        harsh_braking = int(np.sum(accel_mps2 < self.harsh_brake_threshold))
        rapid_accel = int(np.sum(accel_mps2 > self.rapid_accel_threshold))
        speeding = int(np.sum(vel_kmh > (self.speed_limit_kmh + 10.0)))
        sharp_swerves = int(np.sum(yaw_reversal & (vel_kmh[:-1] > 25.0)))

        # 4. Distance-normalized trip sub-score (penalties scaled per 10 km driven)
        norm_factor = max(total_distance_km / 10.0, 0.5)
        kinematic_penalty = (
            (harsh_braking * 3.0)
            + (rapid_accel * 2.0)
            + (speeding * 1.5)
            + (sharp_swerves * 2.5)
        ) / norm_factor

        raw_trip_score = float(
            np.clip(
                100.0 - kinematic_penalty - abs(nlp_penalty) + abs(nlp_bonus),
                0.0,
                100.0,
            )
        )

        # 5. EWMA update for temporal score stability (AIQ-04)
        updated_ewma = float(
            np.clip(
                (1.0 - self.ewma_alpha) * prev_score + self.ewma_alpha * raw_trip_score,
                0.0,
                100.0,
            )
        )
        tier = self._assign_reward_tier(updated_ewma)

        flags = []
        if harsh_braking >= 2:
            flags.append("harsh_braking")
        if rapid_accel >= 2:
            flags.append("rapid_acceleration")
        if speeding >= 3:
            flags.append("excessive_speeding")
        if sharp_swerves >= 2:
            flags.append("erratic_lane_swerving")

        explanation = self._build_coaching_explanation(
            flags=flags,
            ewma_score=updated_ewma,
            tier=tier,
            nlp_penalty=nlp_penalty,
            nlp_bonus=nlp_bonus,
        )

        return SafetyScoreResponse(
            driver_id=driver_id,
            trip_score=round(raw_trip_score, 2),
            ewma_safety_score=round(updated_ewma, 2),
            reward_tier=tier,
            total_distance_km=round(total_distance_km, 2),
            harsh_braking_count=harsh_braking,
            rapid_accel_count=rapid_accel,
            speeding_count=speeding,
            sharp_swerve_count=sharp_swerves,
            flags=flags,
            coaching_explanation=explanation,
        )