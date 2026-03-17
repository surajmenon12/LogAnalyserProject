"""Mock Redshift data generators.

Produces records matching the real Redshift column schemas so the rest of
the pipeline (aggregation, analysis, UI) works identically whether data
comes from mock or real Redshift.

Deterministic seeding ensures identical data for the same identifier + date range.
"""

from __future__ import annotations

import hashlib
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.constants import (
    CALL_STATES,
    CARRIERS,
    COUNTRIES,
    DEST_CODECS,
    DLR_ERROR_CODES,
    DLR_SUCCESS_CODES,
    DST_NUMBER_TYPES,
    DURATION_TYPES,
    HANGUP_CAUSES,
    HANGUP_INITIATORS,
    HANGUP_SOURCES,
    MESSAGE_STATES,
    MESSAGE_TYPES,
    NUMBER_TYPES,
    SIP_HANGUP_CAUSES,
    SMS_CARRIERS,
    SRC_CODECS,
    SUCCESS_HANGUP_CODES,
    TRANSPORT_PROTOCOLS,
    VOICE_CARRIERS,
    ZENTRUNK_HANGUP_CAUSES,
    ZENTRUNK_SUCCESS_CAUSES,
)
from app.models.cdr import CDRRecord
from app.models.mdr import MDRRecord
from app.models.zentrunk import ZentrunkRecord


def _seed_from_params(identifier: str, from_date: str, to_date: str) -> int:
    raw = f"{identifier}:{from_date}:{to_date}"
    return int(hashlib.sha256(raw.encode()).hexdigest()[:8], 16)


# ===================================================================
# CDR (Voice) — matches base.cdr_raw_airflow
# ===================================================================

def generate_cdr_records(
    auth_id: str,
    from_date: str,
    to_date: str,
    *,
    country: Optional[List[str]] = None,
    direction: Optional[str] = None,
    call_state_filter: Optional[str] = None,
    hangup_source: Optional[str] = None,
    carrier_name: Optional[str] = None,
    tollfree: Optional[str] = None,
    failed_only: bool = False,
    zero_duration_only: bool = False,
    high_pdd_only: bool = False,
) -> list[CDRRecord]:
    seed = _seed_from_params(auth_id, from_date, to_date)
    rng = random.Random(seed)

    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")
    num_days = max((end - start).days, 1)

    num_records = rng.randint(50, 150)
    success_rate = rng.uniform(0.70, 0.85)

    error_codes = [c for c in HANGUP_CAUSES if c not in SUCCESS_HANGUP_CODES]
    primary_errors = rng.sample(error_codes, min(3, len(error_codes)))

    error_sip_causes = [c for c in SIP_HANGUP_CAUSES if c != "NORMAL_CLEARING"]

    records: list[CDRRecord] = []
    for _ in range(num_records):
        is_success = rng.random() < success_rate

        if is_success:
            hangup_code = 4000
            hangup_name = HANGUP_CAUSES[4000]
            sip_cause = "NORMAL_CLEARING"
            c_state = "ANSWER"
            h_source = rng.choice(["Callee", "Caller"])
            bill_dur = rng.randint(5, 600)
            ring_t = rng.randint(1, 15)
            pdd = rng.randint(0, 6)
        else:
            hangup_code = rng.choice(
                primary_errors if rng.random() < 0.7 else error_codes
            )
            hangup_name = HANGUP_CAUSES.get(hangup_code, "Unknown")
            sip_cause = rng.choice(error_sip_causes)
            c_state = rng.choice(["NOANSWER", "BUSY", "CANCEL"])
            h_source = rng.choice(HANGUP_SOURCES)
            bill_dur = 0
            ring_t = rng.randint(0, 3)
            pdd = rng.randint(0, 10)

        day_offset = rng.randint(0, num_days - 1) if num_days > 1 else 0
        hour = rng.randint(0, 23)
        minute = rng.randint(0, 59)
        second = rng.randint(0, 59)
        start_t = start + timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)
        answer_t = (start_t + timedelta(seconds=rng.randint(1, 10))) if is_success else None
        end_t = start_t + timedelta(seconds=bill_dur + rng.randint(1, 15))

        c_carrier = rng.choice(VOICE_CARRIERS)
        c_country = rng.choice(COUNTRIES)
        c_direction = rng.choice(["inbound", "outbound"])
        from_iso = rng.choice(COUNTRIES)
        to_iso = c_country
        is_tollfree = rng.random() < 0.15
        dur_type = rng.choice(DURATION_TYPES) if bill_dur > 0 else "30S"

        records.append(
            CDRRecord(
                call_uuid=str(uuid.UUID(int=rng.getrandbits(128))),
                account_id=auth_id,
                username=None,
                from_number=f"+1{rng.randint(2000000000, 9999999999)}",
                to_number=f"+1{rng.randint(2000000000, 9999999999)}",
                call_direction=c_direction,
                call_state=c_state,
                hangup_cause=sip_cause,
                plivo_hangup_cause_code=hangup_code,
                plivo_hangup_cause_name=hangup_name,
                plivo_hangup_source=h_source,
                carrier_name=c_carrier,
                carrier_id=f"CR{rng.randint(10000, 99999)}",
                country_iso=c_country,
                from_iso=from_iso,
                to_iso=to_iso,
                start_time=start_t.isoformat(),
                answer_time=answer_t.isoformat() if answer_t else None,
                end_time=end_t.isoformat(),
                bill_duration=bill_dur,
                ring_time=ring_t,
                post_dial_delay=pdd,
                sip_call_id=f"{uuid.UUID(int=rng.getrandbits(128))}@plivo.com",
                tollfree="True" if is_tollfree else "False",
                call_duration_type=dur_type,
            )
        )

    # Apply filters
    if country:
        records = [r for r in records if r.country_iso in country]
    if direction:
        records = [r for r in records if r.call_direction == direction]
    if call_state_filter:
        records = [r for r in records if r.call_state == call_state_filter]
    if hangup_source:
        records = [r for r in records if r.plivo_hangup_source == hangup_source]
    if carrier_name:
        records = [r for r in records if r.carrier_name == carrier_name]
    if tollfree:
        records = [r for r in records if r.tollfree == tollfree]
    if failed_only:
        records = [r for r in records if r.plivo_hangup_cause_code not in SUCCESS_HANGUP_CODES]
    if zero_duration_only:
        records = [r for r in records if r.bill_duration == 0]
    if high_pdd_only:
        records = [r for r in records if r.post_dial_delay > 4]

    records.sort(key=lambda r: r.start_time)
    return records[:150]


# ===================================================================
# MDR (SMS/MMS) — matches base.mdr_raw_airflow + enriched join
# ===================================================================

def generate_mdr_records(
    auth_id: str,
    from_date: str,
    to_date: str,
    *,
    country: Optional[List[str]] = None,
    direction: Optional[str] = None,
    message_state_filter: Optional[str] = None,
    message_type_filter: Optional[str] = None,
    carrier_name: Optional[str] = None,
    number_type: Optional[str] = None,
    dlr_error: Optional[str] = None,
    failed_only: bool = False,
) -> list[MDRRecord]:
    seed = _seed_from_params(auth_id, from_date, to_date)
    rng = random.Random(seed)

    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")
    num_days = max((end - start).days, 1)

    num_records = rng.randint(50, 150)
    success_rate = rng.uniform(0.70, 0.85)

    error_dlr_codes = [c for c in DLR_ERROR_CODES if c not in DLR_SUCCESS_CODES]
    primary_errors = rng.sample(error_dlr_codes, min(3, len(error_dlr_codes)))

    records: list[MDRRecord] = []
    for _ in range(num_records):
        is_success = rng.random() < success_rate

        if is_success:
            m_state = "delivered"
            m_dlr = "000"
            enr_code = None
        else:
            m_state = rng.choice(["undelivered", "failed"])
            m_dlr = rng.choice(primary_errors if rng.random() < 0.7 else error_dlr_codes)
            enr_code = rng.randint(1000, 9999)

        day_offset = rng.randint(0, num_days - 1) if num_days > 1 else 0
        hour = rng.randint(0, 23)
        minute = rng.randint(0, 59)
        second = rng.randint(0, 59)
        msg_time = start + timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)

        m_carrier = rng.choice(SMS_CARRIERS)
        m_country = rng.choice(COUNTRIES)
        m_direction = rng.choice(["inbound", "outbound"])
        m_type = rng.choice(["sms", "sms", "sms", "mms"])  # 75% sms
        m_number_type = rng.choice(NUMBER_TYPES)
        m_dst_type = rng.choice(DST_NUMBER_TYPES)

        records.append(
            MDRRecord(
                message_uuid=str(uuid.UUID(int=rng.getrandbits(128))),
                account_id=auth_id,
                username=None,
                from_number=f"+1{rng.randint(2000000000, 9999999999)}",
                to_number=f"+1{rng.randint(2000000000, 9999999999)}",
                message_direction=m_direction,
                message_state=m_state,
                message_type=m_type,
                dlr_error=m_dlr,
                carrier_name=m_carrier,
                carrier_id=f"MC{rng.randint(10000, 99999)}",
                country_iso=m_country,
                to_iso=m_country,
                units=rng.randint(1, 3),
                message_time=msg_time.isoformat(),
                number_type=m_number_type,
                enr_error_code=enr_code,
                dst_number_type=m_dst_type,
            )
        )

    # Apply filters
    if country:
        records = [r for r in records if r.country_iso in country]
    if direction:
        records = [r for r in records if r.message_direction == direction]
    if message_state_filter:
        records = [r for r in records if r.message_state == message_state_filter]
    if message_type_filter:
        records = [r for r in records if r.message_type == message_type_filter]
    if carrier_name:
        records = [r for r in records if r.carrier_name == carrier_name]
    if number_type:
        records = [r for r in records if r.number_type == number_type]
    if dlr_error:
        records = [r for r in records if r.dlr_error == dlr_error]
    if failed_only:
        records = [r for r in records if r.message_state in ("undelivered", "failed")]

    records.sort(key=lambda r: r.message_time)
    return records[:150]


# ===================================================================
# Zentrunk — matches base.zentrunk_cdr_raw
# ===================================================================

def generate_zentrunk_records(
    auth_id: str,
    from_date: str,
    to_date: str,
    *,
    country: Optional[List[str]] = None,
    direction: Optional[str] = None,
    hangup_cause_filter: Optional[str] = None,
    hangup_initiator: Optional[str] = None,
    carrier_id: Optional[str] = None,
    transport_protocol: Optional[str] = None,
    srtp_filter: Optional[bool] = None,
    tollfree: Optional[str] = None,
    failed_only: bool = False,
) -> list[ZentrunkRecord]:
    seed = _seed_from_params(auth_id, from_date, to_date)
    rng = random.Random(seed)

    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")
    num_days = max((end - start).days, 1)

    num_records = rng.randint(50, 150)
    success_rate = rng.uniform(0.70, 0.85)

    error_causes = [c for c in ZENTRUNK_HANGUP_CAUSES if c not in ZENTRUNK_SUCCESS_CAUSES]
    primary_errors = rng.sample(error_causes, min(3, len(error_causes)))

    gateway_ips = [
        "4.55.40.227", "198.51.100.10", "203.0.113.50",
        "192.0.2.100", "172.16.0.1",
    ]

    records: list[ZentrunkRecord] = []
    for _ in range(num_records):
        is_success = rng.random() < success_rate

        if is_success:
            h_cause = "normal_clearing"
            h_code = None
            h_initiator = rng.choice(["customer", "callee"])
            dur = rng.randint(5, 600)
        else:
            h_cause = rng.choice(primary_errors if rng.random() < 0.7 else error_causes)
            h_code = rng.randint(400, 603)
            h_initiator = rng.choice(HANGUP_INITIATORS)
            dur = 0

        day_offset = rng.randint(0, num_days - 1) if num_days > 1 else 0
        hour = rng.randint(0, 23)
        minute = rng.randint(0, 59)
        second = rng.randint(0, 59)
        init_time = start + timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)

        # Zentrunk: answer_time = '1970-01-01T00:00:00' for unanswered
        if is_success:
            answer_t = (init_time + timedelta(seconds=rng.randint(1, 10))).isoformat()
        else:
            answer_t = "1970-01-01T00:00:00"

        end_t = init_time + timedelta(seconds=dur + rng.randint(1, 15))

        z_country = rng.choice(COUNTRIES)
        z_direction = rng.choice(["inbound", "outbound"])
        z_transport = rng.choice(TRANSPORT_PROTOCOLS)
        z_srtp = rng.random() < 0.4
        z_tollfree = "True" if rng.random() < 0.1 else "False"
        z_carrier_id = f"ZC{rng.randint(10000, 99999)}"
        gw_ip = rng.choice(gateway_ips)
        to_num = f"+{rng.randint(10000000000, 99999999999)}"

        records.append(
            ZentrunkRecord(
                call_uuid=str(uuid.UUID(int=rng.getrandbits(128))),
                account_id=int(hashlib.sha256(auth_id.encode()).hexdigest()[:8], 16) % 10000000,
                from_number=f"sip:user{rng.randint(100,999)}@{rng.choice(gateway_ips)}",
                to_number=to_num,
                call_direction=z_direction,
                hangup_cause=h_cause,
                hangup_code=h_code,
                hangup_initiator=h_initiator,
                carrier_id=z_carrier_id,
                carrier_gateway=f"sip:{to_num}@{gw_ip}",
                from_iso=rng.choice(COUNTRIES),
                to_iso=z_country,
                initiation_time=init_time.isoformat(),
                answer_time=answer_t,
                end_time=end_t.isoformat(),
                duration=dur,
                bill_duration=dur,
                transport_protocol=z_transport,
                srtp=z_srtp,
                src_codec=rng.choice(SRC_CODECS),
                dest_codec=rng.choice(DEST_CODECS),
                tollfree=z_tollfree,
            )
        )

    # Apply filters
    if country:
        records = [r for r in records if r.to_iso in country]
    if direction:
        records = [r for r in records if r.call_direction == direction]
    if hangup_cause_filter:
        records = [r for r in records if r.hangup_cause == hangup_cause_filter]
    if hangup_initiator:
        records = [r for r in records if r.hangup_initiator == hangup_initiator]
    if carrier_id:
        records = [r for r in records if r.carrier_id == carrier_id]
    if transport_protocol:
        records = [r for r in records if r.transport_protocol == transport_protocol]
    if srtp_filter is not None:
        records = [r for r in records if r.srtp == srtp_filter]
    if tollfree:
        records = [r for r in records if r.tollfree == tollfree]
    if failed_only:
        records = [r for r in records if r.hangup_cause not in ZENTRUNK_SUCCESS_CAUSES]

    records.sort(key=lambda r: r.initiation_time)
    return records[:150]
