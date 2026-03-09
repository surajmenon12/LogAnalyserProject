from typing import Optional

from pydantic import BaseModel


class CDRRecord(BaseModel):
    call_uuid: str
    from_number: str
    to_number: str
    direction: str
    duration_seconds: int
    bill_duration_seconds: int
    hangup_cause_code: int
    hangup_cause: str
    initiation_time: str
    answer_time: Optional[str] = None
    end_time: str
    carrier: str
    region: str
    sip_response_code: int
