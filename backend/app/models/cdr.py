from typing import Optional

from pydantic import BaseModel


class CDRRecord(BaseModel):
    """Matches base.cdr_raw_airflow columns."""

    call_uuid: str
    account_id: str
    username: Optional[str] = None
    from_number: str
    to_number: str
    call_direction: str                     # inbound / outbound
    call_state: Optional[str] = None         # ANSWER, NOANSWER, BUSY, CANCEL
    hangup_cause: Optional[str] = None      # NORMAL_CLEARING, USER_BUSY, etc.
    plivo_hangup_cause_code: Optional[int] = None  # 4000 (Normal), 4010, etc.
    plivo_hangup_cause_name: Optional[str] = None  # Normal Hangup, End Of XML, etc.
    plivo_hangup_source: Optional[str] = None      # Callee, Caller, Plivo, Carrier
    carrier_name: Optional[str] = None      # Level_3_Communication, etc.
    carrier_id: Optional[str] = None
    country_iso: str                        # US, UK, IN, etc.
    from_iso: Optional[str] = None
    to_iso: Optional[str] = None
    start_time: str                         # timestamp
    answer_time: Optional[str] = None       # NULL = unanswered
    end_time: str                           # timestamp
    bill_duration: Optional[int] = 0         # seconds, 0 = routing failure
    ring_time: Optional[int] = 0            # seconds
    post_dial_delay: Optional[int] = 0      # seconds, >4 = latency issue
    sip_call_id: Optional[str] = None
    tollfree: str                           # "True" / "False"
    call_duration_type: Optional[str] = None  # 30S, 60S, etc.
