from typing import Optional

from pydantic import BaseModel


class MDRRecord(BaseModel):
    """Matches base.mdr_raw_airflow columns (with enriched join fields)."""

    message_uuid: str
    account_id: str
    username: Optional[str] = None
    from_number: str
    to_number: str
    message_direction: str          # inbound / outbound
    message_state: str              # delivered / undelivered / sent / failed
    message_type: str               # sms / mms
    dlr_error: str                  # "000" = success, "801", "300", etc.
    carrier_name: str               # clx, mitto-standard, sap-33433, etc.
    carrier_id: Optional[str] = None
    country_iso: str                # US, AU, IR, JP, etc.
    to_iso: Optional[str] = None
    units: int                      # SMS segment count
    message_time: str               # timestamp
    number_type: Optional[str] = None  # local, mobile, shortcode, tollfree

    # Enriched fields (from LEFT JOIN base.fact_mdr_enriched)
    enr_error_code: Optional[int] = None
    dst_number_type: Optional[str] = None  # LC, SC, TF, MB
