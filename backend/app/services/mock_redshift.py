from __future__ import annotations

import hashlib
import random
import uuid
from datetime import datetime, timedelta
from typing import List

from app.core.constants import (
    CARRIERS,
    HANGUP_CAUSES,
    REGIONS,
    SIP_RESPONSE_CODES,
    SMS_ERROR_CODES,
    SUCCESS_HANGUP_CODES,
)
from app.models.cdr import CDRRecord
from app.models.mdr import MDRRecord


def _seed_from_params(identifier: str, from_date: str, to_date: str) -> int:
    raw = f"{identifier}:{from_date}:{to_date}"
    return int(hashlib.sha256(raw.encode()).hexdigest()[:8], 16)


def generate_cdr_records(
    auth_id: str, from_date: str, to_date: str
) -> list[CDRRecord]:
    seed = _seed_from_params(auth_id, from_date, to_date)
    rng = random.Random(seed)

    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")
    num_days = max((end - start).days, 1)

    num_records = rng.randint(50, 200)
    success_rate = rng.uniform(0.70, 0.85)

    # Build weighted error distribution — cluster around a few error codes
    error_codes = [c for c in HANGUP_CAUSES if c not in SUCCESS_HANGUP_CODES]
    primary_errors = rng.sample(error_codes, min(3, len(error_codes)))
    sip_codes = list(SIP_RESPONSE_CODES.keys())
    error_sip_codes = [c for c in sip_codes if c >= 400]

    records: list[CDRRecord] = []
    for i in range(num_records):
        is_success = rng.random() < success_rate

        if is_success:
            hangup_code = 4000
            sip_code = 200
            duration = rng.randint(5, 600)
        else:
            hangup_code = rng.choice(
                primary_errors if rng.random() < 0.7 else error_codes
            )
            sip_code = rng.choice(error_sip_codes)
            duration = 0

        day_offset = rng.randint(0, num_days - 1) if num_days > 1 else 0
        hour = rng.randint(0, 23)
        minute = rng.randint(0, 59)
        second = rng.randint(0, 59)
        init_time = start + timedelta(
            days=day_offset, hours=hour, minutes=minute, seconds=second
        )
        answer_time = (
            (init_time + timedelta(seconds=rng.randint(1, 10))) if is_success else None
        )
        end_time = init_time + timedelta(seconds=duration + rng.randint(1, 15))

        carrier = rng.choice(CARRIERS)
        region = rng.choice(REGIONS)
        direction = rng.choice(["inbound", "outbound"])

        records.append(
            CDRRecord(
                call_uuid=str(uuid.UUID(int=rng.getrandbits(128))),
                from_number=f"+1{rng.randint(2000000000, 9999999999)}",
                to_number=f"+1{rng.randint(2000000000, 9999999999)}",
                direction=direction,
                duration_seconds=duration,
                bill_duration_seconds=max(duration, 0),
                hangup_cause_code=hangup_code,
                hangup_cause=HANGUP_CAUSES.get(hangup_code, "Unknown"),
                initiation_time=init_time.isoformat(),
                answer_time=answer_time.isoformat() if answer_time else None,
                end_time=end_time.isoformat(),
                carrier=carrier,
                region=region,
                sip_response_code=sip_code,
            )
        )

    records.sort(key=lambda r: r.initiation_time)
    return records


def generate_mdr_records(
    auth_id: str, from_date: str, to_date: str
) -> list[MDRRecord]:
    seed = _seed_from_params(auth_id, from_date, to_date)
    rng = random.Random(seed)

    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")
    num_days = max((end - start).days, 1)

    num_records = rng.randint(50, 200)
    success_rate = rng.uniform(0.70, 0.85)

    error_codes = [c for c in SMS_ERROR_CODES if c != 0]
    primary_errors = rng.sample(error_codes, min(3, len(error_codes)))

    statuses_for_success = ["delivered"]
    statuses_for_failure = ["failed", "undelivered"]

    records: list[MDRRecord] = []
    for i in range(num_records):
        is_success = rng.random() < success_rate

        if is_success:
            status = rng.choice(statuses_for_success)
            error_code = None
            error_message = None
        else:
            status = rng.choice(statuses_for_failure)
            error_code = rng.choice(
                primary_errors if rng.random() < 0.7 else error_codes
            )
            error_message = SMS_ERROR_CODES.get(error_code, "Unknown Error")

        day_offset = rng.randint(0, num_days - 1) if num_days > 1 else 0
        hour = rng.randint(0, 23)
        minute = rng.randint(0, 59)
        second = rng.randint(0, 59)
        sent_time = start + timedelta(
            days=day_offset, hours=hour, minutes=minute, seconds=second
        )
        delivered_time = (
            (sent_time + timedelta(seconds=rng.randint(1, 30))) if is_success else None
        )

        carrier = rng.choice(CARRIERS)
        region = rng.choice(REGIONS)
        direction = rng.choice(["inbound", "outbound"])

        records.append(
            MDRRecord(
                message_uuid=str(uuid.UUID(int=rng.getrandbits(128))),
                from_number=f"+1{rng.randint(2000000000, 9999999999)}",
                to_number=f"+1{rng.randint(2000000000, 9999999999)}",
                direction=direction,
                message_type="sms",
                status=status,
                error_code=error_code,
                error_message=error_message,
                sent_time=sent_time.isoformat(),
                delivered_time=delivered_time.isoformat() if delivered_time else None,
                carrier=carrier,
                region=region,
                units=rng.randint(1, 3),
            )
        )

    records.sort(key=lambda r: r.sent_time)
    return records
