from typing import Optional

from pydantic import BaseModel


class ZentrunkRecord(BaseModel):
    call_uuid: str
    trunk_name: str
    from_number: str
    to_number: str
    direction: str  # "inbound" or "outbound"
    duration_seconds: int
    bill_duration_seconds: int
    status: str  # "completed", "failed", "busy", "no_answer"
    sip_response_code: int
    error_code: Optional[int] = None
    error_message: Optional[str] = None
    initiation_time: str
    answer_time: Optional[str] = None
    end_time: str
    source_ip: str
    carrier: str
    region: str
    country: str
