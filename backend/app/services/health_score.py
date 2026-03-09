from __future__ import annotations

from typing import List


def compute_health_score(
    success_rate: float,
    unique_error_count: int,
    daily_error_rates: List[float],
) -> tuple:
    """
    Compute a health score (0-100) and letter grade.

    Formula: 0.50 * success_rate + 0.30 * error_diversity + 0.20 * trend
    """
    # Error diversity: fewer unique errors = better
    error_diversity = max(0.0, 100.0 - unique_error_count * 10.0)

    # Trend: linear regression slope on daily error rates
    trend_score = 100.0
    if len(daily_error_rates) >= 2:
        n = len(daily_error_rates)
        x_mean = (n - 1) / 2.0
        y_mean = sum(daily_error_rates) / n
        numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(daily_error_rates))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        if denominator > 0:
            slope = numerator / denominator
            # Negative slope = error rates decreasing = good
            # Positive slope = error rates increasing = bad
            if slope > 0:
                trend_score = max(0.0, 100.0 - slope * 20.0)
            else:
                trend_score = 100.0

    score = 0.50 * success_rate + 0.30 * error_diversity + 0.20 * trend_score
    score = max(0.0, min(100.0, round(score, 1)))

    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 45:
        grade = "D"
    else:
        grade = "F"

    return score, grade
