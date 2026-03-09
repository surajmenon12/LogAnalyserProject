from typing import Optional

from pydantic import BaseModel, Field, validator


class TriggerAnalysisRequest(BaseModel):
    auth_id: Optional[str] = Field(None, description="Plivo Auth ID")
    email: Optional[str] = Field(None, description="Customer email address")
    from_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    to_date: str = Field(..., description="End date (YYYY-MM-DD)")
    log_type: str = Field(..., pattern="^(voice|sms)$", description="Log type: voice or sms")

    @validator("email", always=True)
    def at_least_one_identifier(cls, email, values):  # noqa: N805
        auth_id = values.get("auth_id")
        if not auth_id and not email:
            raise ValueError("At least one of auth_id or email must be provided")
        return email


class UpdateZendeskRequest(BaseModel):
    ticket_id: str = Field(..., min_length=1, description="Zendesk ticket ID")
    analysis_id: str = Field(..., min_length=1, description="Analysis workflow ID")
    summary: str = Field(..., min_length=1, description="Analysis summary to post")
