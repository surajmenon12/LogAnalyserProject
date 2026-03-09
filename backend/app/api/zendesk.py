from fastapi import APIRouter, HTTPException

from app.models.requests import UpdateZendeskRequest
from app.models.responses import UpdateZendeskResponse
from app.services.mock_zendesk import update_zendesk_ticket
from app.services.workflow_manager import get_workflow

router = APIRouter()


@router.post("/update-zendesk", response_model=UpdateZendeskResponse)
async def update_zendesk(request: UpdateZendeskRequest):
    state = get_workflow(request.analysis_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if state.status.value != "completed":
        raise HTTPException(status_code=400, detail="Analysis not yet completed")

    result = await update_zendesk_ticket(
        ticket_id=request.ticket_id,
        summary=request.summary,
    )
    return UpdateZendeskResponse(**result)
