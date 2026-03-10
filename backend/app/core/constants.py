from __future__ import annotations

# ===================================================================
# Voice CDR — base.cdr_raw_airflow
# ===================================================================

# Plivo hangup cause codes (plivo_hangup_cause_code → plivo_hangup_cause_name)
HANGUP_CAUSES: dict[int, str] = {
    4000: "Normal Hangup",
    4001: "Unallocated Number",
    4002: "No Route to Network",
    4003: "No Route to Destination",
    4004: "Channel Unacceptable",
    4005: "Call Awarded Being Delivered",
    4010: "End Of XML Instructions",
    4016: "Normal Clearing (User Busy)",
    4017: "User Not Responding",
    4018: "No Answer from User",
    4019: "User Absent",
    4020: "Subscriber Absent",
    4021: "Call Rejected",
    4022: "Number Changed",
    4027: "Destination Out of Order",
    4028: "Invalid Number Format",
    4029: "Facility Rejected",
    4031: "Normal Unspecified",
    4034: "No Circuit Available",
    4038: "Network Out of Order",
    4041: "Temporary Failure",
    4042: "Switch Congestion",
    4043: "Access Information Discarded",
    4044: "Requested Channel Not Available",
    4047: "Resource Unavailable",
    4050: "Facility Not Subscribed",
    4052: "Outgoing Calls Barred",
    4054: "Incoming Calls Barred",
    4057: "Bearer Capability Not Authorized",
    4058: "Bearer Capability Not Available",
    4063: "Service Not Available",
    4065: "Bearer Capability Not Implemented",
    4079: "Service Not Implemented",
    4087: "User Not Member of CUG",
    4088: "Incompatible Destination",
    4102: "Recovery on Timer Expire",
    4111: "Protocol Error",
    4127: "Interworking Error",
    3000: "Unspecified Error",
    5000: "Plivo Internal Error",
    5010: "Call Rate Limit Exceeded",
    5020: "Account Balance Insufficient",
    5030: "Invalid Destination",
}

# Success hangup codes (call completed normally)
SUCCESS_HANGUP_CODES = {4000, 4016}

# SIP-level hangup_cause values (mapped from Q.850 causes)
SIP_HANGUP_CAUSES = [
    "NORMAL_CLEARING",
    "USER_BUSY",
    "NO_ROUTE_DESTINATION",
    "NO_ANSWER",
    "ORIGINATOR_CANCEL",
    "CALL_REJECTED",
    "UNALLOCATED_NUMBER",
    "DESTINATION_OUT_OF_ORDER",
    "RECOVERY_ON_TIMER_EXPIRE",
    "INVALID_NUMBER_FORMAT",
    "NORMAL_TEMPORARY_FAILURE",
    "SWITCH_CONGESTION",
    "SUBSCRIBER_ABSENT",
    "FACILITY_REJECTED",
    "NETWORK_OUT_OF_ORDER",
]

# call_state values
CALL_STATES = ["ANSWER", "NOANSWER", "BUSY", "CANCEL"]

# plivo_hangup_source values
HANGUP_SOURCES = ["Callee", "Caller", "Plivo", "Carrier"]

# call_duration_type buckets
DURATION_TYPES = ["30S", "60S", "120S", "300S", "600S"]

# ===================================================================
# SMS/MMS MDR — base.mdr_raw_airflow
# ===================================================================

# DLR error codes (dlr_error string values)
DLR_ERROR_CODES: dict[str, str] = {
    "000": "Delivered",
    "001": "Unknown Error",
    "002": "Absent Subscriber",
    "003": "Handset Memory Full",
    "006": "Network Error",
    "007": "Illegal Subscriber",
    "011": "Subscriber Not Provisioned",
    "012": "Subscriber Not Reachable",
    "300": "Carrier Rejected",
    "400": "Filtered/Spam",
    "450": "DND Activated",
    "500": "Expired",
    "600": "Unreachable",
    "700": "Invalid Destination",
    "801": "Carrier Internal Error",
    "802": "Carrier Network Failure",
    "900": "Plivo Internal Error",
    "901": "Rate Limit Exceeded",
}

DLR_SUCCESS_CODES = {"000"}

# message_state values
MESSAGE_STATES = ["delivered", "undelivered", "sent", "failed", "queued"]

# message_type values
MESSAGE_TYPES = ["sms", "mms"]

# number_type values (raw table)
NUMBER_TYPES = ["local", "mobile", "shortcode", "tollfree"]

# dst_number_type values (enriched table)
DST_NUMBER_TYPES = ["LC", "SC", "TF", "MB"]

# SMS carrier names (as they appear in Redshift)
SMS_CARRIERS = [
    "clx",
    "mitto-standard",
    "sap-33433",
    "telnyx-us",
    "sinch-standard",
    "twilio-us",
    "bandwidth",
    "vonage-premium",
    "plivo-direct",
    "commio",
]

# Legacy mapping kept for backward compatibility
SMS_ERROR_CODES: dict[int, str] = {
    0: "Delivered",
    100: "Unknown Error",
    200: "Invalid Destination Number",
    201: "Invalid Source Number",
    202: "Message Content Empty",
    300: "Carrier Network Error",
    301: "Carrier Rejected",
    302: "Number Unreachable",
    400: "Filtered/Spam Detected",
    401: "DND Activated",
    402: "Blacklisted Number",
    500: "Plivo Internal Error",
    501: "Rate Limit Exceeded",
    502: "Account Balance Insufficient",
}

SMS_SUCCESS_CODES = {0}

# ===================================================================
# Voice CDR carriers (as they appear in Redshift)
# ===================================================================

VOICE_CARRIERS = [
    "Level_3_Communication",
    "Bandwidth",
    "Telnyx",
    "Verizon_Wholesale",
    "AT&T",
    "Lumen",
    "Sinch",
    "Twilio_Super_Network",
    "BT_Wholesale",
    "Telia_Carrier",
]

# Common carriers (generic — used as fallback)
CARRIERS = VOICE_CARRIERS

# ===================================================================
# Zentrunk — base.zentrunk_cdr_raw
# ===================================================================

# Zentrunk hangup_cause values
ZENTRUNK_HANGUP_CAUSES = [
    "normal_clearing",
    "originator_cancel",
    "no_route_destination",
    "user_busy",
    "no_answer",
    "call_rejected",
    "unallocated_number",
    "destination_out_of_order",
    "recovery_on_timer_expire",
    "service_not_implemented",
    "network_out_of_order",
    "normal_temporary_failure",
    "media_timeout",
    "incompatible_destination",
]

ZENTRUNK_SUCCESS_CAUSES = {"normal_clearing", "originator_cancel"}

# hangup_initiator values
HANGUP_INITIATORS = ["customer", "carrier", "callee"]

# transport_protocol values
TRANSPORT_PROTOCOLS = ["udp", "tcp", "tls"]

# Common codec values
SRC_CODECS = [
    "PCMU,telephone-event/8000,CN",
    "PCMA,telephone-event/8000",
    "G729,telephone-event/8000",
    "PCMU,PCMA,telephone-event/8000",
    "opus/48000,PCMU",
]

DEST_CODECS = [
    "PCMU",
    "PCMA",
    "G729",
    "PCMU,PCMA",
    "opus/48000",
]

# Carrier gateway patterns
CARRIER_GATEWAYS = [
    "sip:+{to_number}@4.55.40.227",
    "sip:+{to_number}@198.51.100.10",
    "sip:+{to_number}@203.0.113.50",
    "sip:+{to_number}@192.0.2.100",
    "sip:+{to_number}@172.16.0.1",
]

# Legacy Zentrunk error codes (kept for backward compat)
ZENTRUNK_ERROR_CODES: dict[int, str] = {
    0: "Call Completed",
    600: "Trunk Registration Failed",
    601: "Trunk Authentication Error",
    602: "Invalid Trunk Configuration",
    603: "Trunk Capacity Exceeded",
    604: "Codec Mismatch",
    605: "IP Not Whitelisted",
    606: "Media Timeout",
    607: "RTP Stream Error",
    608: "Trunk Failover Triggered",
    609: "QoS Threshold Exceeded",
    610: "TLS Handshake Failed",
    611: "SRTP Negotiation Error",
    612: "DNS Resolution Failed",
    613: "SIP Timeout",
    614: "Trunk Suspended",
}

ZENTRUNK_SUCCESS_CODES = {0}

# Trunk names
TRUNK_NAMES = [
    "primary-us-east",
    "primary-us-west",
    "primary-eu",
    "backup-us",
    "backup-eu",
    "apac-primary",
    "india-primary",
    "uk-primary",
    "canada-primary",
    "latam-primary",
]

# ===================================================================
# Shared
# ===================================================================

# ISO country codes (used across all tables)
COUNTRIES = [
    "US", "UK", "IN", "DE", "FR", "CA", "AU", "JP", "BR", "SG",
    "MX", "IT", "ES", "NL", "SE", "IR", "KR", "TH", "PH", "ZA",
]

# Regions (internal classification)
REGIONS = [
    "US-East",
    "US-West",
    "EU-West",
    "EU-Central",
    "APAC-South",
    "APAC-Southeast",
    "India",
    "UK",
    "Canada",
    "Australia",
]

# SIP response codes (used by CDR & Zentrunk)
SIP_RESPONSE_CODES: dict[int, str] = {
    200: "OK",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    408: "Request Timeout",
    480: "Temporarily Unavailable",
    486: "Busy Here",
    487: "Request Terminated",
    488: "Not Acceptable Here",
    500: "Server Internal Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
}
