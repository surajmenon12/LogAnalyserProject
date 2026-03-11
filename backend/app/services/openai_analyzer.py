from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Dict, List, Union

import openai

from app.config import settings
from app.core.constants import (
    DLR_SUCCESS_CODES,
    SUCCESS_HANGUP_CODES,
    ZENTRUNK_SUCCESS_CAUSES,
)
from app.core.exceptions import AIAnalysisError
from app.models.analysis import AnalysisIssue, AnalysisResult, ChartData, TrendInfo
from app.models.cdr import CDRRecord
from app.models.mdr import MDRRecord
from app.models.zentrunk import ZentrunkRecord
from app.services.health_score import compute_health_score
from app.services.trend_detection import detect_trend

logger = logging.getLogger(__name__)


# ===================================================================
# CDR aggregation — uses base.cdr_raw_airflow column names
# ===================================================================

def _aggregate_cdr_logs(records: list[CDRRecord]) -> dict:
    total = len(records)
    successful = sum(
        1 for r in records if r.plivo_hangup_cause_code in SUCCESS_HANGUP_CODES
    )
    # Error distribution by plivo_hangup_cause_code + plivo_hangup_cause_name
    error_counter = Counter(
        f"{r.plivo_hangup_cause_code} - {r.plivo_hangup_cause_name}"
        for r in records
        if r.plivo_hangup_cause_code is not None
        and r.plivo_hangup_cause_code not in SUCCESS_HANGUP_CODES
    )
    carrier_counter = Counter(r.carrier_name for r in records if r.carrier_name)
    country_counter = Counter(r.country_iso for r in records if r.country_iso)
    hangup_source_counter = Counter(
        r.plivo_hangup_source for r in records
        if r.plivo_hangup_source
        and r.plivo_hangup_cause_code is not None
        and r.plivo_hangup_cause_code not in SUCCESS_HANGUP_CODES
    )

    # Aggregate by date for success rate over time (keyed by start_time)
    date_stats: dict[str, dict] = {}
    for r in records:
        date = r.start_time[:10]
        if date not in date_stats:
            date_stats[date] = {"total": 0, "success": 0}
        date_stats[date]["total"] += 1
        if r.plivo_hangup_cause_code in SUCCESS_HANGUP_CODES:
            date_stats[date]["success"] += 1

    failed_samples = [
        {
            "call_uuid": r.call_uuid,
            "plivo_hangup_cause_code": r.plivo_hangup_cause_code,
            "plivo_hangup_cause_name": r.plivo_hangup_cause_name,
            "hangup_cause": r.hangup_cause,
            "plivo_hangup_source": r.plivo_hangup_source,
            "carrier_name": r.carrier_name,
            "country_iso": r.country_iso,
            "call_state": r.call_state,
            "bill_duration": r.bill_duration,
            "post_dial_delay": r.post_dial_delay,
        }
        for r in records
        if r.plivo_hangup_cause_code not in SUCCESS_HANGUP_CODES
    ][:5]

    return {
        "log_type": "voice",
        "total_records": total,
        "successful": successful,
        "failed": total - successful,
        "success_rate": round(successful / total * 100, 2) if total > 0 else 0,
        "top_errors": dict(error_counter.most_common(10)),
        "carrier_distribution": dict(carrier_counter.most_common(10)),
        "country_distribution": dict(country_counter.most_common(10)),
        "hangup_source_distribution": dict(hangup_source_counter.most_common(5)),
        "daily_stats": {
            date: round(s["success"] / s["total"] * 100, 2) if s["total"] > 0 else 0
            for date, s in sorted(date_stats.items())
        },
        "failed_samples": failed_samples,
    }


# ===================================================================
# MDR aggregation — uses base.mdr_raw_airflow column names
# ===================================================================

def _aggregate_mdr_logs(records: list[MDRRecord]) -> dict:
    total = len(records)
    successful = sum(1 for r in records if r.message_state == "delivered")
    # Error distribution by dlr_error code
    error_counter = Counter(
        f"{r.dlr_error} - {r.message_state}"
        for r in records
        if r.dlr_error and r.dlr_error not in DLR_SUCCESS_CODES
    )
    carrier_counter = Counter(r.carrier_name for r in records if r.carrier_name)
    country_counter = Counter(r.country_iso for r in records if r.country_iso)
    number_type_counter = Counter(
        r.number_type for r in records if r.number_type
    )

    # Aggregate by date (keyed by message_time)
    date_stats: dict[str, dict] = {}
    for r in records:
        date = r.message_time[:10]
        if date not in date_stats:
            date_stats[date] = {"total": 0, "success": 0}
        date_stats[date]["total"] += 1
        if r.message_state == "delivered":
            date_stats[date]["success"] += 1

    failed_samples = [
        {
            "message_uuid": r.message_uuid,
            "dlr_error": r.dlr_error,
            "message_state": r.message_state,
            "carrier_name": r.carrier_name,
            "country_iso": r.country_iso,
            "number_type": r.number_type,
            "message_type": r.message_type,
        }
        for r in records
        if r.message_state in ("failed", "undelivered")
    ][:5]

    return {
        "log_type": "sms",
        "total_records": total,
        "successful": successful,
        "failed": total - successful,
        "success_rate": round(successful / total * 100, 2) if total > 0 else 0,
        "top_errors": dict(error_counter.most_common(10)),
        "carrier_distribution": dict(carrier_counter.most_common(10)),
        "country_distribution": dict(country_counter.most_common(10)),
        "number_type_distribution": dict(number_type_counter.most_common(5)),
        "daily_stats": {
            date: round(s["success"] / s["total"] * 100, 2) if s["total"] > 0 else 0
            for date, s in sorted(date_stats.items())
        },
        "failed_samples": failed_samples,
    }


# ===================================================================
# Zentrunk aggregation — uses base.zentrunk_cdr_raw column names
# ===================================================================

def _aggregate_zentrunk_logs(records: list[ZentrunkRecord]) -> dict:
    total = len(records)
    successful = sum(
        1 for r in records if r.hangup_cause and r.hangup_cause in ZENTRUNK_SUCCESS_CAUSES
    )
    # Error distribution by hangup_cause
    error_counter = Counter(
        r.hangup_cause
        for r in records
        if r.hangup_cause and r.hangup_cause not in ZENTRUNK_SUCCESS_CAUSES
    )
    carrier_counter = Counter(r.carrier_id for r in records if r.carrier_id)
    country_counter = Counter(r.to_iso for r in records if r.to_iso)
    initiator_counter = Counter(
        r.hangup_initiator for r in records
        if r.hangup_initiator
        and r.hangup_cause and r.hangup_cause not in ZENTRUNK_SUCCESS_CAUSES
    )
    transport_counter = Counter(
        r.transport_protocol for r in records if r.transport_protocol
    )

    # Aggregate by date (keyed by initiation_time)
    date_stats: dict[str, dict] = {}
    for r in records:
        date = r.initiation_time[:10]
        if date not in date_stats:
            date_stats[date] = {"total": 0, "success": 0}
        date_stats[date]["total"] += 1
        if r.hangup_cause and r.hangup_cause in ZENTRUNK_SUCCESS_CAUSES:
            date_stats[date]["success"] += 1

    failed_samples = [
        {
            "call_uuid": r.call_uuid,
            "hangup_cause": r.hangup_cause,
            "hangup_code": r.hangup_code,
            "hangup_initiator": r.hangup_initiator,
            "carrier_id": r.carrier_id,
            "carrier_gateway": r.carrier_gateway,
            "to_iso": r.to_iso,
            "transport_protocol": r.transport_protocol,
            "srtp": r.srtp,
        }
        for r in records
        if r.hangup_cause and r.hangup_cause not in ZENTRUNK_SUCCESS_CAUSES
    ][:5]

    return {
        "log_type": "zentrunk",
        "total_records": total,
        "successful": successful,
        "failed": total - successful,
        "success_rate": round(successful / total * 100, 2) if total > 0 else 0,
        "top_errors": dict(error_counter.most_common(10)),
        "carrier_distribution": dict(carrier_counter.most_common(10)),
        "country_distribution": dict(country_counter.most_common(10)),
        "initiator_distribution": dict(initiator_counter.most_common(5)),
        "transport_distribution": dict(transport_counter.most_common(5)),
        "daily_stats": {
            date: round(s["success"] / s["total"] * 100, 2) if s["total"] > 0 else 0
            for date, s in sorted(date_stats.items())
        },
        "failed_samples": failed_samples,
    }


# ===================================================================
# Health score / trend helpers
# ===================================================================

def _compute_extras(aggregated: dict) -> tuple:
    """Compute health score/grade and trend from aggregated data."""
    daily_stats = aggregated["daily_stats"]
    daily_rates = list(daily_stats.values())

    daily_error_rates = [100.0 - r for r in daily_rates]

    unique_error_count = len(aggregated["top_errors"])
    health_score, health_grade = compute_health_score(
        aggregated["success_rate"], unique_error_count, daily_error_rates
    )
    trend_result = detect_trend(daily_error_rates)
    trend_info = TrendInfo(**trend_result)

    return health_score, health_grade, trend_info


# ===================================================================
# Mock result builder
# ===================================================================

def _build_mock_result(aggregated: dict) -> AnalysisResult:
    """Generate a mock analysis result without calling OpenAI."""
    log_type = aggregated["log_type"]
    top_errors = aggregated["top_errors"]

    issues: list[AnalysisIssue] = []
    for i, (error, count) in enumerate(list(top_errors.items())[:5]):
        severity = "critical" if count > aggregated["total_records"] * 0.1 else "warning"
        issues.append(
            AnalysisIssue(
                title=f"High occurrence of {error.split(' - ')[1] if ' - ' in error else error}",
                severity=severity,
                description=f"Error '{error}' occurred {count} times across the analyzed period.",
                affected_records=count,
                recommendation=f"Investigate {'carrier routing' if log_type == 'voice' else 'trunk configuration' if log_type == 'zentrunk' else 'message delivery'} for this error pattern. Check if specific carriers or regions are disproportionately affected.",
            )
        )

    if not issues:
        issues.append(
            AnalysisIssue(
                title="No significant issues detected",
                severity="info",
                description="All logs appear normal with expected success rates.",
                affected_records=0,
                recommendation="No action required.",
            )
        )

    error_distribution = [
        {"error": error, "count": count}
        for error, count in list(top_errors.items())[:10]
    ]

    success_rate_over_time = [
        {"date": date, "rate": rate}
        for date, rate in aggregated["daily_stats"].items()
    ]

    dates = list(aggregated["daily_stats"].keys())
    date_range = f"{dates[0]} to {dates[-1]}" if dates else "N/A"

    health_score, health_grade, trend_info = _compute_extras(aggregated)

    return AnalysisResult(
        summary=f"Analysis of {aggregated['total_records']} {log_type} records shows a {aggregated['success_rate']}% success rate. "
        f"Found {len(issues)} issue(s) requiring attention. "
        f"Top error: {list(top_errors.keys())[0] if top_errors else 'None'}.",
        issues=issues,
        chart_data=ChartData(
            error_distribution=error_distribution,
            success_rate_over_time=success_rate_over_time,
        ),
        total_records=aggregated["total_records"],
        success_rate=aggregated["success_rate"],
        date_range=date_range,
        log_type=log_type,
        health_score=health_score,
        health_grade=health_grade,
        trend=trend_info,
    )


# ===================================================================
# AI prompt
# ===================================================================

SYSTEM_PROMPT = """You are a Plivo telecom log analyst. Analyze the aggregated log data and produce a JSON response with the following structure:

{
  "summary": "2-3 sentence summary of findings",
  "issues": [
    {
      "title": "Brief issue title",
      "severity": "critical|warning|info",
      "description": "Detailed description",
      "affected_records": <number>,
      "recommendation": "Actionable recommendation"
    }
  ],
  "chart_data": {
    "error_distribution": [{"error": "error name", "count": <number>}],
    "success_rate_over_time": [{"date": "YYYY-MM-DD", "rate": <number>}]
  }
}

Focus on:
- Identifying patterns in errors (carrier-specific, region-specific, time-based)
- Prioritizing issues by severity and impact
- Providing specific, actionable recommendations
- Noting any anomalies in success rates over time

Return ONLY valid JSON, no markdown fences or extra text."""


# ===================================================================
# Main entry point
# ===================================================================

async def analyze_logs(
    records: list[CDRRecord] | list[MDRRecord] | list[ZentrunkRecord], log_type: str
) -> AnalysisResult:
    if log_type == "voice":
        aggregated = _aggregate_cdr_logs(records)  # type: ignore[arg-type]
    elif log_type == "zentrunk":
        aggregated = _aggregate_zentrunk_logs(records)  # type: ignore[arg-type]
    else:
        aggregated = _aggregate_mdr_logs(records)  # type: ignore[arg-type]

    if settings.MOCK_AI:
        logger.info("Using mock analysis (MOCK_AI=true)")
        return _build_mock_result(aggregated)

    try:
        client = openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            default_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Plivo Log Analyzer",
            },
        )
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=2048,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Analyze these aggregated {log_type} logs:\n\n{json.dumps(aggregated, indent=2)}",
                },
            ],
        )
        response_text = response.choices[0].message.content or ""
        parsed = json.loads(response_text)

        issues = [AnalysisIssue(**issue) for issue in parsed.get("issues", [])]
        chart_data = ChartData(**parsed.get("chart_data", {"error_distribution": [], "success_rate_over_time": []}))

        dates = list(aggregated["daily_stats"].keys())
        date_range = f"{dates[0]} to {dates[-1]}" if dates else "N/A"

        health_score, health_grade, trend_info = _compute_extras(aggregated)

        return AnalysisResult(
            summary=parsed.get("summary", "Analysis complete."),
            issues=issues,
            chart_data=chart_data,
            total_records=aggregated["total_records"],
            success_rate=aggregated["success_rate"],
            date_range=date_range,
            log_type=log_type,
            health_score=health_score,
            health_grade=health_grade,
            trend=trend_info,
        )
    except (openai.APIError, json.JSONDecodeError, KeyError) as e:
        logger.error(f"OpenAI API call failed: {e}. Falling back to mock analysis.")
        return _build_mock_result(aggregated)
