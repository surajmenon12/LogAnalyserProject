from typing import Optional

from pydantic import BaseModel, Field, validator


class TriggerAnalysisRequest(BaseModel):
    # --- Required fields ---
    auth_id: Optional[str] = Field(None, description="Plivo Auth ID / account_id")
    email: Optional[str] = Field(None, description="Customer email / username")
    from_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    to_date: str = Field(..., description="End date (YYYY-MM-DD)")
    log_type: str = Field(..., pattern="^(voice|sms|zentrunk)$", description="Log type: voice, sms, or zentrunk")

    # --- Common optional filters ---
    country: Optional[str] = Field(None, description="Country ISO code (e.g. US, UK, IN)")
    direction: Optional[str] = Field(None, description="Traffic direction: inbound or outbound")
    carrier: Optional[str] = Field(None, description="Carrier name or ID filter")
    failed_only: Optional[bool] = Field(False, description="Show only failed records")

    # --- SMS-specific filters ---
    message_state: Optional[str] = Field(None, description="SMS: delivered, undelivered, sent, failed")
    message_type: Optional[str] = Field(None, description="SMS: sms or mms")
    number_type: Optional[str] = Field(None, description="SMS: local, mobile, shortcode, tollfree")
    dlr_error: Optional[str] = Field(None, description="SMS: DLR error code (e.g. 801, 300)")

    # --- Voice-specific filters ---
    call_state: Optional[str] = Field(None, description="Voice: ANSWER, NOANSWER, BUSY, CANCEL")
    hangup_source: Optional[str] = Field(None, description="Voice: Callee, Caller, Plivo, Carrier")
    tollfree: Optional[str] = Field(None, description="Voice/Zentrunk: True or False")
    zero_duration: Optional[bool] = Field(False, description="Voice: only zero-duration (routing failure) calls")
    high_pdd: Optional[bool] = Field(False, description="Voice: only high post-dial delay (>4s) calls")

    # --- Zentrunk-specific filters ---
    hangup_initiator: Optional[str] = Field(None, description="Zentrunk: customer, carrier, callee")
    transport_protocol: Optional[str] = Field(None, description="Zentrunk: udp, tcp, tls")
    srtp: Optional[bool] = Field(None, description="Zentrunk: true = SRTP enabled, false = disabled")

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
