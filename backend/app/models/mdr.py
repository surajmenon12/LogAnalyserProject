from typing import Optional

from pydantic import BaseModel


class MDRRecord(BaseModel):
    message_uuid: str
    from_number: str
    to_number: str
    direction: str
    message_type: str
    status: str
    error_code: Optional[int] = None
    error_message: Optional[str] = None
    sent_time: str
    delivered_time: Optional[str] = None
    carrier: str
    region: str
    units: int
