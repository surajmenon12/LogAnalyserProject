from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Dict, List, Union

import openai

from app.config import settings
from app.core.constants import HANGUP_CAUSES, SMS_ERROR_CODES, SUCCESS_HANGUP_CODES, SMS_SUCCESS_CODES
from app.core.exceptions import AIAnalysisError
from app.models.analysis import AnalysisIssue, AnalysisResult, ChartData
from app.models.cdr import CDRRecord
from app.models.mdr import MDRRecord

logger = logging.getLogger(__name__)


def _aggregate_cdr_logs(records: list[CDRRecord]) -> dict:
    total = len(records)
    successful = sum(1 for r in records if r.hangup_cause_code in SUCCESS_HANGUP_CODES)
    error_counter = Counter(
        f"{r.hangup_cause_code} - {r.hangup_cause}"
        for r in records
        if r.hangup_cause_code not in SUCCESS_HANGUP_CODES
    )
    carrier_counter = Counter(r.carrier for r in records)
    region_counter = Counter(r.region for r in records)

    # Aggregate by date for success rate over time
    date_stats: dict[str, dict] = {}
    for r in records:
        date = r.initiation_time[:10]
        if date not in date_stats:
            date_stats[date] = {"total": 0, "success": 0}
        date_stats[date]["total"] += 1
        if r.hangup_cause_code in SUCCESS_HANGUP_CODES:
            date_stats[date]["success"] += 1

    # Sample failed records (up to 5)
    failed_samples = [
        {
            "call_uuid": r.call_uuid,
            "hangup_cause_code": r.hangup_cause_code,
            "hangup_cause": r.hangup_cause,
            "carrier": r.carrier,
            "region": r.region,
            "sip_response_code": r.sip_response_code,
        }
        for r in records
        if r.hangup_cause_code not in SUCCESS_HANGUP_CODES
    ][:5]

    return {
        "log_type": "voice",
        "total_records": total,
        "successful": successful,
        "failed": total - successful,
        "success_rate": round(successful / total * 100, 2) if total > 0 else 0,
        "top_errors": dict(error_counter.most_common(10)),
        "carrier_distribution": dict(carrier_counter.most_common(10)),
        "region_distribution": dict(region_counter.most_common(10)),
        "daily_stats": {
            date: round(s["success"] / s["total"] * 100, 2) if s["total"] > 0 else 0
            for date, s in sorted(date_stats.items())
        },
        "failed_samples": failed_samples,
    }


def _aggregate_mdr_logs(records: list[MDRRecord]) -> dict:
    total = len(records)
    successful = sum(1 for r in records if r.status == "delivered")
    error_counter = Counter(
        f"{r.error_code} - {r.error_message}"
        for r in records
        if r.error_code is not None and r.error_code not in SMS_SUCCESS_CODES
    )
    carrier_counter = Counter(r.carrier for r in records)
    region_counter = Counter(r.region for r in records)

    date_stats: dict[str, dict] = {}
    for r in records:
        date = r.sent_time[:10]
        if date not in date_stats:
            date_stats[date] = {"total": 0, "success": 0}
        date_stats[date]["total"] += 1
        if r.status == "delivered":
            date_stats[date]["success"] += 1

    failed_samples = [
        {
            "message_uuid": r.message_uuid,
            "error_code": r.error_code,
            "error_message": r.error_message,
            "carrier": r.carrier,
            "region": r.region,
            "status": r.status,
        }
        for r in records
        if r.status in ("failed", "undelivered")
    ][:5]

    return {
        "log_type": "sms",
        "total_records": total,
        "successful": successful,
        "failed": total - successful,
        "success_rate": round(successful / total * 100, 2) if total > 0 else 0,
        "top_errors": dict(error_counter.most_common(10)),
        "carrier_distribution": dict(carrier_counter.most_common(10)),
        "region_distribution": dict(region_counter.most_common(10)),
        "daily_stats": {
            date: round(s["success"] / s["total"] * 100, 2) if s["total"] > 0 else 0
            for date, s in sorted(date_stats.items())
        },
        "failed_samples": failed_samples,
    }


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
                recommendation=f"Investigate {'carrier routing' if log_type == 'voice' else 'message delivery'} for this error pattern. Check if specific carriers or regions are disproportionately affected.",
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
    )


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


async def analyze_logs(
    records: list[CDRRecord] | list[MDRRecord], log_type: str
) -> AnalysisResult:
    if log_type == "voice":
        aggregated = _aggregate_cdr_logs(records)  # type: ignore[arg-type]
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

        return AnalysisResult(
            summary=parsed.get("summary", "Analysis complete."),
            issues=issues,
            chart_data=chart_data,
            total_records=aggregated["total_records"],
            success_rate=aggregated["success_rate"],
            date_range=date_range,
            log_type=log_type,
        )
    except (openai.APIError, json.JSONDecodeError, KeyError) as e:
        logger.error(f"OpenAI API call failed: {e}. Falling back to mock analysis.")
        return _build_mock_result(aggregated)
