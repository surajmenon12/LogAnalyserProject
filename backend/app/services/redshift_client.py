"""Redshift client for executing read-only queries against Plivo's data warehouse.

Uses psycopg2 with RealDictCursor so rows come back as plain dicts,
which are then mapped to Pydantic models.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import settings
from app.models.cdr import CDRRecord
from app.models.mdr import MDRRecord
from app.models.zentrunk import ZentrunkRecord
from app.services.redshift_queries import (
    build_cdr_query,
    build_mdr_query,
    build_zentrunk_query,
)

logger = logging.getLogger(__name__)

CONNECTION_TIMEOUT = 10  # seconds


class RedshiftError(Exception):
    """Raised when a Redshift query or connection fails."""


def get_connection():
    """Create a psycopg2 connection to Redshift using app settings."""
    return psycopg2.connect(
        host=settings.REDSHIFT_HOST,
        port=settings.REDSHIFT_PORT,
        dbname=settings.REDSHIFT_DATABASE,
        user=settings.REDSHIFT_USER,
        password=settings.REDSHIFT_PASSWORD,
        connect_timeout=CONNECTION_TIMEOUT,
        cursor_factory=RealDictCursor,
    )


def execute_query(sql: str) -> List[Dict[str, Any]]:
    """Execute a read-only SQL query and return rows as list of dicts."""
    truncated = sql[:200] + "..." if len(sql) > 200 else sql
    logger.info("Executing Redshift query: %s", truncated)

    try:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
            # RealDictRow -> plain dict
            result = [dict(r) for r in rows]
            logger.info("Query returned %d rows", len(result))
            return result
        finally:
            conn.close()
    except psycopg2.Error as exc:
        raise RedshiftError(f"Redshift query failed: {exc}") from exc


# -------------------------------------------------------------------
# High-level fetch helpers
# -------------------------------------------------------------------

def _str_or_none(val: Any) -> Optional[str]:
    """Convert a value to str if truthy, else None."""
    return str(val) if val else None


def fetch_cdr_records(
    identifier: str,
    from_date: str,
    to_date: str,
    filters: Dict[str, Any],
) -> List[CDRRecord]:
    """Fetch CDR records from Redshift and return as Pydantic models."""
    sql = build_cdr_query(
        account_id=identifier,
        from_date=from_date,
        to_date=to_date,
        country_iso=filters.get("country"),
        direction=filters.get("direction"),
        call_state=filters.get("call_state"),
        hangup_source=filters.get("hangup_source"),
        carrier_name=filters.get("carrier"),
        tollfree=filters.get("tollfree"),
        failed_only=filters.get("failed_only", False),
        zero_duration_only=filters.get("zero_duration", False),
        high_pdd_only=filters.get("high_pdd", False),
    )
    rows = execute_query(sql)
    return [CDRRecord(**row) for row in rows]


def fetch_mdr_records(
    identifier: str,
    from_date: str,
    to_date: str,
    filters: Dict[str, Any],
) -> List[MDRRecord]:
    """Fetch MDR records from Redshift and return as Pydantic models."""
    sql = build_mdr_query(
        account_id=identifier,
        from_date=from_date,
        to_date=to_date,
        country_iso=filters.get("country"),
        direction=filters.get("direction"),
        message_state=filters.get("message_state"),
        message_type=filters.get("message_type"),
        carrier_name=filters.get("carrier"),
        number_type=filters.get("number_type"),
        dlr_error=filters.get("dlr_error"),
        failed_only=filters.get("failed_only", False),
    )
    rows = execute_query(sql)
    return [MDRRecord(**row) for row in rows]


def fetch_zentrunk_records(
    identifier: str,
    from_date: str,
    to_date: str,
    filters: Dict[str, Any],
) -> List[ZentrunkRecord]:
    """Fetch Zentrunk records from Redshift and return as Pydantic models."""
    srtp_val = filters.get("srtp")
    srtp_bool: Optional[bool] = None
    if srtp_val is not None:
        if isinstance(srtp_val, bool):
            srtp_bool = srtp_val
        elif isinstance(srtp_val, str):
            srtp_bool = srtp_val.lower() in ("true", "1", "yes")

    sql = build_zentrunk_query(
        account_id=identifier,
        from_date=from_date,
        to_date=to_date,
        country_iso=filters.get("country"),
        direction=filters.get("direction"),
        hangup_initiator=filters.get("hangup_initiator"),
        carrier_id=filters.get("carrier"),
        transport_protocol=filters.get("transport_protocol"),
        srtp=srtp_bool,
        tollfree=filters.get("tollfree"),
        failed_only=filters.get("failed_only", False),
    )
    rows = execute_query(sql)
    return [ZentrunkRecord(**row) for row in rows]
