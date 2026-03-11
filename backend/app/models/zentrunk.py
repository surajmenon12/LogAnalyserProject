from typing import Optional

from pydantic import BaseModel


class ZentrunkRecord(BaseModel):
    """Matches base.zentrunk_cdr_raw columns.

    Note: No username column — only account_id for customer lookup.
    Note: answer_time = '1970-01-01...' indicates unanswered (not NULL like CDR).
    """

    call_uuid: str
    account_id: int
    from_number: str                         # SIP username or phone number
    to_number: str
    call_direction: str                      # inbound / outbound
    hangup_cause: Optional[str] = None        # normal_clearing, originator_cancel, etc.
    hangup_code: Optional[int] = None        # SIP/Q.850 cause code
    hangup_initiator: Optional[str] = None   # customer, carrier, callee
    carrier_id: Optional[str] = None
    carrier_gateway: Optional[str] = None    # sip:+18593618614@4.55.40.227
    from_iso: Optional[str] = None
    to_iso: Optional[str] = None
    initiation_time: str                     # timestamp
    answer_time: Optional[str] = None        # '1970-01-01' = unanswered
    end_time: str                            # timestamp
    duration: Optional[int] = 0              # seconds, 0 = failed/unanswered
    bill_duration: Optional[int] = 0         # seconds
    transport_protocol: Optional[str] = None  # udp, tcp, tls
    srtp: Optional[bool] = None               # media encryption
    src_codec: Optional[str] = None           # PCMU,telephone-event/8000,CN
    dest_codec: Optional[str] = None
    tollfree: Optional[str] = None            # True / False
