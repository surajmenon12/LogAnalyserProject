from __future__ import annotations

import math
from typing import Dict, List


def detect_trend(daily_error_rates: List[float]) -> Dict:
    """
    Detect trend in daily error rates using linear regression.

    Returns dict with direction, slope, confidence, description.
    """
    n = len(daily_error_rates)
    if n < 2:
        return {
            "direction": "stable",
            "slope": 0.0,
            "confidence": "low",
            "description": "Insufficient data for trend analysis.",
        }

    x_mean = (n - 1) / 2.0
    y_mean = sum(daily_error_rates) / n

    ss_xy = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(daily_error_rates))
    ss_xx = sum((i - x_mean) ** 2 for i in range(n))
    ss_yy = sum((y - y_mean) ** 2 for y in daily_error_rates)

    if ss_xx == 0:
        slope = 0.0
    else:
        slope = ss_xy / ss_xx

    # R-squared
    if ss_yy == 0 or ss_xx == 0:
        r_squared = 0.0
    else:
        r_squared = (ss_xy ** 2) / (ss_xx * ss_yy)

    r_squared = max(0.0, min(1.0, r_squared))
    slope = round(slope, 4)

    # Direction
    if abs(slope) < 0.5:
        direction = "stable"
    elif slope > 0:
        direction = "increasing"  # Error rates going up = bad
    else:
        direction = "decreasing"  # Error rates going down = good

    # Confidence from R-squared
    if r_squared >= 0.7:
        confidence = "high"
    elif r_squared >= 0.4:
        confidence = "medium"
    else:
        confidence = "low"

    # Description
    descriptions = {
        "stable": "Error rates have remained relatively stable over the analyzed period.",
        "increasing": f"Error rates are trending upward (slope: {slope}/day), indicating a worsening pattern that may need attention.",
        "decreasing": f"Error rates are trending downward (slope: {slope}/day), indicating an improving pattern.",
    }

    return {
        "direction": direction,
        "slope": slope,
        "confidence": confidence,
        "description": descriptions[direction],
    }
