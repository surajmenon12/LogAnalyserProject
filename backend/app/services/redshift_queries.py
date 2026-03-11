"""
Hardcoded Redshift SQL query templates for Plivo Log Analysis Dashboard.

All queries are SELECT-only with LIMIT 150.
All queries require account_id (or username where supported) + date range.
Filters are additive (AND-combined).

Tables:
  - base.mdr_raw_airflow        (SMS/MMS)
  - base.fact_mdr_enriched      (SMS enriched — joined via message_uuid)
  - base.cdr_raw_airflow        (Voice CDR)
  - base.zentrunk_cdr_raw       (Zentrunk SIP Trunking)
"""

from __future__ import annotations

from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ROW_LIMIT = 150
PDD_THRESHOLD_SECONDS = 4

# ---------------------------------------------------------------------------
# MDR columns we SELECT from base.mdr_raw_airflow
# ---------------------------------------------------------------------------
MDR_COLUMNS = [
    "message_uuid",
    "account_id",
    "username",
    "from_number",
    "to_number",
    "message_direction",
    "message_state",
    "message_type",
    "dlr_error",
    "carrier_name",
    "carrier_id",
    "country_iso",
    "to_iso",
    "units",
    "message_time",
    "number_type",
]

# Enriched columns from base.fact_mdr_enriched (joined by message_uuid)
MDR_ENRICHED_COLUMNS = [
    "enr.enr_error_code",
    "enr.dst_number_type",
]

# CDR columns from base.cdr_raw_airflow
CDR_COLUMNS = [
    "call_uuid",
    "account_id",
    "username",
    "from_number",
    "to_number",
    "call_direction",
    "call_state",
    "hangup_cause",
    "plivo_hangup_cause_code",
    "plivo_hangup_cause_name",
    "plivo_hangup_source",
    "carrier_name",
    "carrier_id",
    "country_iso",
    "from_iso",
    "to_iso",
    "start_time",
    "answer_time",
    "end_time",
    "bill_duration",
    "ring_time",
    "post_dial_delay",
    "sip_call_id",
    "tollfree",
    "call_duration_type",
]

# Zentrunk columns from base.zentrunk_cdr_raw
ZENTRUNK_COLUMNS = [
    "call_uuid",
    "account_id",
    "from_number",
    "to_number",
    "call_direction",
    "hangup_cause",
    "hangup_code",
    "hangup_initiator",
    "carrier_id",
    "carrier_gateway",
    "from_iso",
    "to_iso",
    "initiation_time",
    "answer_time",
    "end_time",
    "duration",
    "bill_duration",
    "transport_protocol",
    "srtp",
    "src_codec",
    "dest_codec",
    "tollfree",
]


# ===================================================================
# MDR (SMS/MMS) Queries — base.mdr_raw_airflow
# ===================================================================

def build_mdr_query(
    account_id: Optional[str] = None,
    username: Optional[str] = None,
    from_date: str = "",
    to_date: str = "",
    *,
    country_iso: Optional[str] = None,
    direction: Optional[str] = None,
    message_state: Optional[str] = None,
    message_type: Optional[str] = None,
    dlr_error: Optional[str] = None,
    carrier_name: Optional[str] = None,
    number_type: Optional[str] = None,
    failed_only: bool = False,
    with_enriched: bool = True,
) -> str:
    """Build a SELECT query for base.mdr_raw_airflow with optional filters.

    Edge cases covered:
      1.  Base query by account_id + date range
      2.  By username when account_id unavailable
      3.  + country filter (country_iso)
      4.  + direction filter (inbound/outbound)
      5.  + failed only (message_state IN undelivered/failed)
      6.  + specific DLR error code
      7.  + carrier filter
      8.  + message type (sms/mms)
      9.  + number type (local/mobile/shortcode/tollfree)
      10. + LEFT JOIN fact_mdr_enriched for enr_error_code, dst_number_type
    """
    # --- SELECT columns ------------------------------------------------
    cols = [f"m.{c}" for c in MDR_COLUMNS]
    if with_enriched:
        cols.extend(MDR_ENRICHED_COLUMNS)
    select_clause = ",\n       ".join(cols)

    # --- FROM / JOIN ---------------------------------------------------
    from_clause = "base.mdr_raw_airflow m"
    if with_enriched:
        from_clause += (
            "\n  LEFT JOIN base.fact_mdr_enriched enr"
            "\n    ON m.message_uuid = enr.message_uuid"
        )

    # --- WHERE ---------------------------------------------------------
    conditions: list[str] = []

    # Identifier — search both account_id and username with OR
    if account_id and username:
        conditions.append(f"(m.account_id = '{account_id}' OR m.username = '{username}')")
    elif account_id:
        conditions.append(f"(m.account_id = '{account_id}' OR m.username = '{account_id}')")
    elif username:
        conditions.append(f"(m.account_id = '{username}' OR m.username = '{username}')")

    # Date range (inclusive)
    if from_date:
        conditions.append(f"m.message_time >= '{from_date} 00:00:00'")
    if to_date:
        conditions.append(f"m.message_time <= '{to_date} 23:59:59'")

    # Optional filters
    if country_iso:
        conditions.append(f"m.country_iso = '{country_iso}'")
    if direction:
        conditions.append(f"m.message_direction = '{direction}'")
    if message_type:
        conditions.append(f"m.message_type = '{message_type}'")
    if carrier_name:
        conditions.append(f"m.carrier_name = '{carrier_name}'")
    if number_type:
        conditions.append(f"m.number_type = '{number_type}'")
    if dlr_error:
        conditions.append(f"m.dlr_error = '{dlr_error}'")

    # Failed-only shortcut
    if failed_only:
        conditions.append("m.message_state IN ('undelivered', 'failed')")
    elif message_state:
        conditions.append(f"m.message_state = '{message_state}'")

    where_clause = "\n   AND ".join(conditions) if conditions else "1=1"

    return (
        f"SELECT {select_clause}\n"
        f"  FROM {from_clause}\n"
        f" WHERE {where_clause}\n"
        f" ORDER BY m.message_time DESC\n"
        f" LIMIT {ROW_LIMIT};"
    )


# ===================================================================
# CDR (Voice) Queries — base.cdr_raw_airflow
# ===================================================================

# Plivo success hangup codes
CDR_SUCCESS_CODES = (4000, 4016)


def build_cdr_query(
    account_id: Optional[str] = None,
    username: Optional[str] = None,
    from_date: str = "",
    to_date: str = "",
    *,
    country_iso: Optional[str] = None,
    direction: Optional[str] = None,
    call_state: Optional[str] = None,
    hangup_source: Optional[str] = None,
    carrier_name: Optional[str] = None,
    tollfree: Optional[str] = None,
    failed_only: bool = False,
    zero_duration_only: bool = False,
    high_pdd_only: bool = False,
) -> str:
    """Build a SELECT query for base.cdr_raw_airflow with optional filters.

    Edge cases covered:
      1.  Base query by account_id + date range
      2.  By username when account_id unavailable
      3.  + country filter (country_iso)
      4.  + direction filter (inbound/outbound)
      5.  + failed only (plivo_hangup_cause_code NOT IN success codes)
      6.  + call state (ANSWER/NOANSWER/BUSY/CANCEL)
      7.  + hangup source (Callee/Caller/Plivo/Carrier)
      8.  + carrier filter
      9.  + tollfree filter (True/False)
      10. + zero-duration calls (complete routing failures, bill_duration = 0)
      11. + high post-dial delay (> 4s threshold for latency issues)
    """
    select_clause = ",\n       ".join(CDR_COLUMNS)
    conditions: list[str] = []

    # Identifier — search both account_id and username with OR
    if account_id and username:
        conditions.append(f"(account_id = '{account_id}' OR username = '{username}')")
    elif account_id:
        conditions.append(f"(account_id = '{account_id}' OR username = '{account_id}')")
    elif username:
        conditions.append(f"(account_id = '{username}' OR username = '{username}')")

    # Date range
    if from_date:
        conditions.append(f"start_time >= '{from_date} 00:00:00'")
    if to_date:
        conditions.append(f"start_time <= '{to_date} 23:59:59'")

    # Optional filters
    if country_iso:
        conditions.append(f"country_iso = '{country_iso}'")
    if direction:
        conditions.append(f"call_direction = '{direction}'")
    if carrier_name:
        conditions.append(f"carrier_name = '{carrier_name}'")
    if hangup_source:
        conditions.append(f"plivo_hangup_source = '{hangup_source}'")
    if tollfree:
        conditions.append(f"tollfree = '{tollfree}'")

    # Call state filter
    if call_state:
        conditions.append(f"call_state = '{call_state}'")

    # Failed-only: exclude normal clearing codes
    if failed_only:
        codes_str = ", ".join(str(c) for c in CDR_SUCCESS_CODES)
        conditions.append(f"plivo_hangup_cause_code NOT IN ({codes_str})")

    # Zero-duration calls — complete routing failures
    if zero_duration_only:
        conditions.append("bill_duration = 0")

    # High post-dial delay — carrier-side latency
    if high_pdd_only:
        conditions.append(f"post_dial_delay > {PDD_THRESHOLD_SECONDS}")

    where_clause = "\n   AND ".join(conditions) if conditions else "1=1"

    return (
        f"SELECT {select_clause}\n"
        f"  FROM base.cdr_raw_airflow\n"
        f" WHERE {where_clause}\n"
        f" ORDER BY start_time DESC\n"
        f" LIMIT {ROW_LIMIT};"
    )


# ===================================================================
# Zentrunk Queries — base.zentrunk_cdr_raw
# ===================================================================

# Zentrunk normal hangup causes (success)
ZENTRUNK_NORMAL_CAUSES = ("normal_clearing", "originator_cancel")


def build_zentrunk_query(
    account_id: Optional[str] = None,
    from_date: str = "",
    to_date: str = "",
    *,
    country_iso: Optional[str] = None,
    direction: Optional[str] = None,
    hangup_cause: Optional[str] = None,
    hangup_initiator: Optional[str] = None,
    carrier_id: Optional[str] = None,
    carrier_gateway: Optional[str] = None,
    transport_protocol: Optional[str] = None,
    srtp: Optional[bool] = None,
    tollfree: Optional[str] = None,
    failed_only: bool = False,
) -> str:
    """Build a SELECT query for base.zentrunk_cdr_raw with optional filters.

    Note: Zentrunk does NOT support username lookup — only account_id.
    Note: answer_time = '1970-01-01' indicates unanswered calls (differs
          from CDR which uses NULL).

    Edge cases covered:
      1.  Base query by account_id + date range
      2.  + country filter (to_iso)
      3.  + direction filter (inbound/outbound)
      4.  + failed only (hangup_cause NOT IN normal causes)
      5.  + hangup initiator (customer/carrier/callee)
      6.  + carrier filter (carrier_id)
      7.  + transport protocol (udp/tcp/tls)
      8.  + SRTP filter (encrypted / unencrypted)
      9.  + tollfree filter
      10. + gateway-specific failures (carrier_gateway LIKE pattern)
    """
    select_clause = ",\n       ".join(ZENTRUNK_COLUMNS)
    conditions: list[str] = []

    # Identifier — Zentrunk has no username, but try both account_id fields
    if account_id:
        conditions.append(f"account_id = '{account_id}'")

    # Date range
    if from_date:
        conditions.append(f"initiation_time >= '{from_date} 00:00:00'")
    if to_date:
        conditions.append(f"initiation_time <= '{to_date} 23:59:59'")

    # Optional filters
    if country_iso:
        conditions.append(f"to_iso = '{country_iso}'")
    if direction:
        conditions.append(f"call_direction = '{direction}'")
    if hangup_cause:
        conditions.append(f"hangup_cause = '{hangup_cause}'")
    if hangup_initiator:
        conditions.append(f"hangup_initiator = '{hangup_initiator}'")
    if carrier_id:
        conditions.append(f"carrier_id = '{carrier_id}'")
    if transport_protocol:
        conditions.append(f"transport_protocol = '{transport_protocol}'")
    if tollfree:
        conditions.append(f"tollfree = '{tollfree}'")

    # SRTP filter
    if srtp is True:
        conditions.append("srtp = true")
    elif srtp is False:
        conditions.append("srtp = false")

    # Gateway-specific (partial match on SIP URI / IP)
    if carrier_gateway:
        conditions.append(f"carrier_gateway LIKE '%{carrier_gateway}%'")

    # Failed-only: exclude normal hangup causes
    if failed_only:
        causes_str = ", ".join(f"'{c}'" for c in ZENTRUNK_NORMAL_CAUSES)
        conditions.append(f"hangup_cause NOT IN ({causes_str})")

    where_clause = "\n   AND ".join(conditions) if conditions else "1=1"

    return (
        f"SELECT {select_clause}\n"
        f"  FROM base.zentrunk_cdr_raw\n"
        f" WHERE {where_clause}\n"
        f" ORDER BY initiation_time DESC\n"
        f" LIMIT {ROW_LIMIT};"
    )


# ===================================================================
# Enriched MDR standalone (when only enriched data is needed)
# ===================================================================

MDR_ENRICHED_STANDALONE_COLUMNS = [
    "message_uuid",
    "account_id",
    "message_state",
    "dlr_error",
    "enr_error_code",
    "carrier_id",
    "country_iso",
    "message_time",
    "dst_number_type",
    "message_direction",
]


def build_mdr_enriched_query(
    account_id: Optional[str] = None,
    from_date: str = "",
    to_date: str = "",
    *,
    country_iso: Optional[str] = None,
    direction: Optional[str] = None,
    enr_error_code: Optional[int] = None,
    dst_number_type: Optional[str] = None,
    failed_only: bool = False,
) -> str:
    """Build a SELECT query for base.fact_mdr_enriched standalone.

    Used when enriched error classification is the primary need.
    """
    select_clause = ",\n       ".join(MDR_ENRICHED_STANDALONE_COLUMNS)
    conditions: list[str] = []

    if account_id:
        conditions.append(f"account_id = '{account_id}'")

    if from_date:
        conditions.append(f"message_time >= '{from_date} 00:00:00'")
    if to_date:
        conditions.append(f"message_time <= '{to_date} 23:59:59'")

    if country_iso:
        conditions.append(f"country_iso = '{country_iso}'")
    if direction:
        conditions.append(f"message_direction = '{direction}'")
    if enr_error_code is not None:
        conditions.append(f"enr_error_code = {enr_error_code}")
    if dst_number_type:
        conditions.append(f"dst_number_type = '{dst_number_type}'")

    if failed_only:
        conditions.append("message_state IN ('undelivered', 'failed')")

    where_clause = "\n   AND ".join(conditions) if conditions else "1=1"

    return (
        f"SELECT {select_clause}\n"
        f"  FROM base.fact_mdr_enriched\n"
        f" WHERE {where_clause}\n"
        f" ORDER BY message_time DESC\n"
        f" LIMIT {ROW_LIMIT};"
    )


# ===================================================================
# Helper: get the appropriate query builder for a log type
# ===================================================================

def get_query_for_log_type(log_type: str, **kwargs: object) -> str:
    """Dispatch to the correct query builder based on log_type."""
    if log_type == "sms":
        return build_mdr_query(**kwargs)  # type: ignore[arg-type]
    elif log_type == "voice":
        return build_cdr_query(**kwargs)  # type: ignore[arg-type]
    elif log_type == "zentrunk":
        return build_zentrunk_query(**kwargs)  # type: ignore[arg-type]
    else:
        raise ValueError(f"Unknown log_type: {log_type}")
