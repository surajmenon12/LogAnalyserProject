from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.requests import TriggerAnalysisRequest
from app.models.responses import AnalysisStatusResponse, TriggerAnalysisResponse
from app.services.workflow_manager import create_workflow, get_workflow, run_workflow

router = APIRouter()


@router.post("/trigger-analysis", response_model=TriggerAnalysisResponse)
async def trigger_analysis(
    request: TriggerAnalysisRequest, background_tasks: BackgroundTasks
):
    state = create_workflow(
        auth_id=request.auth_id,
        email=request.email,
        from_date=request.from_date,
        to_date=request.to_date,
        log_type=request.log_type,
        country=request.country,
    )
    background_tasks.add_task(run_workflow, state.analysis_id)

    return TriggerAnalysisResponse(
        analysis_id=state.analysis_id,
        status=state.status.value,
        message="Analysis workflow started",
    )


@router.get("/analysis-status/{analysis_id}", response_model=AnalysisStatusResponse)
async def get_analysis_status(analysis_id: str):
    state = get_workflow(analysis_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return AnalysisStatusResponse(
        analysis_id=state.analysis_id,
        status=state.status.value,
        progress_pct=state.progress_pct,
        message=state.message,
        result=state.result,
        raw_logs=state.raw_logs if state.status.value == "completed" else None,
    )
