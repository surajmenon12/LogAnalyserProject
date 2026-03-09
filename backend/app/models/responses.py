from typing import Dict, List, Optional

from pydantic import BaseModel

from app.models.analysis import AnalysisResult


class TriggerAnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    message: str


class AnalysisStatusResponse(BaseModel):
    analysis_id: str
    status: str
    progress_pct: int
    message: str
    result: Optional[AnalysisResult] = None
    raw_logs: Optional[List[Dict]] = None


class UpdateZendeskResponse(BaseModel):
    success: bool
    ticket_id: str
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str
