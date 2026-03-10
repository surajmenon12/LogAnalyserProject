from __future__ import annotations

import asyncio
import logging
import uuid
from enum import Enum
from typing import Any, Dict, List, Optional

from app.config import settings
from app.models.analysis import AnalysisResult
from app.services.openai_analyzer import analyze_logs
from app.services.mock_redshift import (
    generate_cdr_records,
    generate_mdr_records,
    generate_zentrunk_records,
)
from app.services.redshift_client import (
    RedshiftError,
    fetch_cdr_records,
    fetch_mdr_records,
    fetch_zentrunk_records,
)

logger = logging.getLogger(__name__)


class WorkflowStatus(str, Enum):
    QUEUED = "queued"
    FETCHING_LOGS = "fetching_logs"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowState:
    def __init__(
        self,
        auth_id: Optional[str],
        email: Optional[str],
        from_date: str,
        to_date: str,
        log_type: str,
        filters: Optional[Dict[str, Any]] = None,
    ):
        self.analysis_id: str = str(uuid.uuid4())
        self.auth_id = auth_id or ""
        self.email = email or ""
        self.from_date = from_date
        self.to_date = to_date
        self.log_type = log_type
        self.filters: Dict[str, Any] = filters or {}
        self.status: WorkflowStatus = WorkflowStatus.QUEUED
        self.progress_pct: int = 0
        self.message: str = "Analysis queued"
        self.result: Optional[AnalysisResult] = None
        self.raw_logs: Optional[List[Dict]] = None


# In-memory workflow storage
_workflows: Dict[str, WorkflowState] = {}


def create_workflow(
    auth_id: Optional[str],
    email: Optional[str],
    from_date: str,
    to_date: str,
    log_type: str,
    filters: Optional[Dict[str, Any]] = None,
) -> WorkflowState:
    state = WorkflowState(auth_id, email, from_date, to_date, log_type, filters)
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

        identifier = state.auth_id or state.email
        f = state.filters  # shorthand

        if settings.MOCK_REDSHIFT:
            logger.info("MOCK_REDSHIFT=True — using mock data generators")
            await asyncio.sleep(1.5)

            if state.log_type == "voice":
                records = generate_cdr_records(
                    identifier,
                    state.from_date,
                    state.to_date,
                    country=f.get("country"),
                    direction=f.get("direction"),
                    call_state_filter=f.get("call_state"),
                    hangup_source=f.get("hangup_source"),
                    carrier_name=f.get("carrier"),
                    tollfree=f.get("tollfree"),
                    failed_only=f.get("failed_only", False),
                    zero_duration_only=f.get("zero_duration", False),
                    high_pdd_only=f.get("high_pdd", False),
                )
            elif state.log_type == "zentrunk":
                records = generate_zentrunk_records(
                    identifier,
                    state.from_date,
                    state.to_date,
                    country=f.get("country"),
                    direction=f.get("direction"),
                    hangup_cause_filter=f.get("hangup_cause"),
                    hangup_initiator=f.get("hangup_initiator"),
                    carrier_id=f.get("carrier"),
                    transport_protocol=f.get("transport_protocol"),
                    srtp_filter=f.get("srtp"),
                    tollfree=f.get("tollfree"),
                    failed_only=f.get("failed_only", False),
                )
            else:
                records = generate_mdr_records(
                    identifier,
                    state.from_date,
                    state.to_date,
                    country=f.get("country"),
                    direction=f.get("direction"),
                    message_state_filter=f.get("message_state"),
                    message_type_filter=f.get("message_type"),
                    carrier_name=f.get("carrier"),
                    number_type=f.get("number_type"),
                    dlr_error=f.get("dlr_error"),
                    failed_only=f.get("failed_only", False),
                )
        else:
            logger.info("Fetching real data from Redshift")
            try:
                if state.log_type == "voice":
                    records = fetch_cdr_records(
                        identifier, state.from_date, state.to_date, f,
                    )
                elif state.log_type == "zentrunk":
                    records = fetch_zentrunk_records(
                        identifier, state.from_date, state.to_date, f,
                    )
                else:
                    records = fetch_mdr_records(
                        identifier, state.from_date, state.to_date, f,
                    )
            except RedshiftError as exc:
                logger.error("Redshift fetch failed: %s", exc)
                state.status = WorkflowStatus.FAILED
                state.progress_pct = 0
                state.message = f"Redshift connection failed: {exc}"
                return

        raw_logs = [r.model_dump() for r in records]
        state.raw_logs = raw_logs
        state.progress_pct = 50
        state.message = f"Fetched {len(records)} records. Starting AI analysis..."

        # Step 2: Analyze
        state.status = WorkflowStatus.ANALYZING
        state.progress_pct = 60

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
