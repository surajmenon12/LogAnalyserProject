from typing import Dict, List, Optional

from pydantic import BaseModel


class AnalysisIssue(BaseModel):
    title: str
    severity: str  # "critical" | "warning" | "info"
    description: str
    affected_records: int
    recommendation: str


class ChartData(BaseModel):
    error_distribution: List[Dict]
    success_rate_over_time: List[Dict]


class TrendInfo(BaseModel):
    direction: str  # "stable" | "increasing" | "decreasing"
    slope: float
    confidence: str  # "high" | "medium" | "low"
    description: str


class AnalysisResult(BaseModel):
    summary: str
    issues: List[AnalysisIssue]
    chart_data: ChartData
    total_records: int
    success_rate: float
    date_range: str
    log_type: str
    health_score: float = 0.0
    health_grade: str = "N/A"
    trend: Optional[TrendInfo] = None
