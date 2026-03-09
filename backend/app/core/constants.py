from __future__ import annotations

# Plivo Voice Hangup Cause Codes
HANGUP_CAUSES: dict[int, str] = {
    4000: "Normal Clearing",
    4001: "Unallocated Number",
    4002: "No Route to Network",
    4003: "No Route to Destination",
    4004: "Channel Unacceptable",
    4005: "Call Awarded Being Delivered",
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

# Plivo SMS Error Codes
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

# Common carriers
CARRIERS = [
    "AT&T",
    "Verizon",
    "T-Mobile",
    "Vodafone",
    "Airtel",
    "BT",
    "Deutsche Telekom",
    "Orange",
    "Telia",
    "Rogers",
]

# Regions
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

# SIP response codes relevant to voice calls
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
