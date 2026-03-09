from __future__ import annotations

import asyncio
import logging
import uuid
from enum import Enum
from typing import Dict, List, Optional

from app.models.analysis import AnalysisResult
from app.services.openai_analyzer import analyze_logs
from app.services.mock_redshift import generate_cdr_records, generate_mdr_records

logger = logging.getLogger(__name__)


class WorkflowStatus(str, Enum):
    QUEUED = "queued"
    FETCHING_LOGS = "fetching_logs"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowState:
    def __init__(self, auth_id: Optional[str], email: Optional[str], from_date: str, to_date: str, log_type: str):
        self.analysis_id: str = str(uuid.uuid4())
        self.auth_id = auth_id or ""
        self.email = email or ""
        self.from_date = from_date
        self.to_date = to_date
        self.log_type = log_type
        self.status: WorkflowStatus = WorkflowStatus.QUEUED
        self.progress_pct: int = 0
        self.message: str = "Analysis queued"
        self.result: Optional[AnalysisResult] = None
        self.raw_logs: Optional[List[Dict]] = None


# In-memory workflow storage
_workflows: Dict[str, WorkflowState] = {}


def create_workflow(
    auth_id: Optional[str], email: Optional[str], from_date: str, to_date: str, log_type: str
) -> WorkflowState:
    state = WorkflowState(auth_id, email, from_date, to_date, log_type)
    _workflows[state.analysis_id] = state
    return state


def get_workflow(analysis_id: str) -> Optional[WorkflowState]:
    return _workflows.get(analysis_id)


async def run_workflow(analysis_id: str) -> None:
    state = _workflows.get(analysis_id)
    if state is None:
        return

    try:
        # Step 1: Fetch logs
        state.status = WorkflowStatus.FETCHING_LOGS
        state.progress_pct = 20
        state.message = "Fetching logs from data warehouse..."

        # Simulate network latency
        await asyncio.sleep(1.5)

        identifier = state.auth_id or state.email
        if state.log_type == "voice":
            records = generate_cdr_records(identifier, state.from_date, state.to_date)
            raw_logs = [r.model_dump() for r in records]
        else:
            records = generate_mdr_records(identifier, state.from_date, state.to_date)
            raw_logs = [r.model_dump() for r in records]

        state.raw_logs = raw_logs
        state.progress_pct = 50
        state.message = f"Fetched {len(records)} records. Starting AI analysis..."

        # Step 2: Analyze with OpenAI
        state.status = WorkflowStatus.ANALYZING
        state.progress_pct = 60

        # Simulate analysis time
        await asyncio.sleep(2.0)

        result = await analyze_logs(records, state.log_type)

        state.progress_pct = 90
        state.message = "Finalizing results..."
        await asyncio.sleep(0.5)

        # Step 3: Complete
        state.status = WorkflowStatus.COMPLETED
        state.progress_pct = 100
        state.message = "Analysis complete"
        state.result = result

        logger.info(f"Workflow {analysis_id} completed successfully")

    except Exception as e:
        logger.error(f"Workflow {analysis_id} failed: {e}")
        state.status = WorkflowStatus.FAILED
        state.progress_pct = 0
        state.message = f"Analysis failed: {str(e)}"
