# Redshift Data Access Request
## Plivo Log Analysis Dashboard — Field-Level Justification

**Requested by:** Suraj Menon
**Date:** March 9, 2026
**Purpose:** Read-only access to specific columns for the Plivo Log Analysis Dashboard, an internal tool that automates customer issue diagnosis for support agents.
**Access Mode:** SELECT only. No INSERT, UPDATE, DELETE, CREATE, or DDL operations.
**Row Limit:** All queries will be capped at 150 rows per request to minimize scan cost.

---

## How the Dashboard Uses This Data

The tool follows a three-step pipeline:

1. **Fetch** — Query Redshift with customer identifiers (account ID or username) and a date range. Return up to 150 matching log records.
2. **Analyze** — Aggregate the records to compute error distributions, success rates over time, carrier/region breakdowns, and health scores. Feed aggregated stats to an AI model for pattern detection and recommendations.
3. **Present** — Display interactive charts, a filterable log table, trend indicators, and a downloadable PDF report to the support agent.

Each field requested below maps directly to one or more of these steps. Fields are grouped by table with a clear justification for each.

---

## Table 1: `base.mdr_raw_airflow`
**Purpose:** Primary source for SMS/MMS (MDR) log analysis.
**Why this table over `fact_mdr_enriched`:** Contains full phone numbers (not redacted), human-readable `carrier_name`, and `username` for customer lookup — all essential for support agent workflows.

| # | Column | Type | Justification |
|---|--------|------|---------------|
| 1 | `message_uuid` | varchar(64) | **Unique record identifier.** Used as the primary key in the log table. Allows agents to reference specific messages in Zendesk tickets and cross-reference with other internal tools. |
| 2 | `account_id` | varchar(16) | **Customer lookup.** Primary filter for querying logs by Plivo Auth ID. This is how agents identify which customer's logs to analyze. |
| 3 | `username` | varchar(32) | **Customer lookup (alternate).** Agents sometimes only have a customer email/username. This allows filtering by that identifier when Auth ID is unavailable. |
| 4 | `from_number` | varchar(100) | **Source number display.** Shown in the log table so agents can identify the sending number. Helps diagnose number-specific issues (e.g., a particular sender ID being blocked by carriers). |
| 5 | `to_number` | varchar(100) | **Destination number display.** Shown in the log table. Essential for identifying destination-specific delivery failures (e.g., invalid number format, country-specific blocking). |
| 6 | `message_direction` | varchar(16) | **Traffic direction filter.** Values: `inbound`/`outbound`. Allows agents to filter and analyze inbound vs outbound traffic separately, as failure patterns differ by direction. |
| 7 | `message_state` | varchar(16) | **Success/failure classification.** Values: `delivered`, `undelivered`, `sent`, etc. This is the primary field for computing success rates, health grades, and identifying failed records for error analysis. |
| 8 | `message_type` | varchar(8) | **Message type filter.** Values: `sms`/`mms`. Allows agents to isolate SMS vs MMS issues, which have different carrier routing and failure modes. |
| 9 | `dlr_error` | varchar(16) | **Error code for failure analysis.** Values: `000` (success), `801`, `300`, `006`, etc. This is the primary field for building the error distribution chart and classifying failure types. Maps to specific delivery failure reasons. |
| 10 | `carrier_name` | varchar(64) | **Carrier attribution.** Values: `clx`, `mitto-standard`, `sap-33433`, etc. Used to build carrier distribution charts and identify carrier-specific failure patterns (e.g., "80% of failures are on carrier X"). Critical for actionable recommendations. |
| 11 | `carrier_id` | varchar(16) | **Carrier identifier.** Used alongside `carrier_name` for precise carrier identification when carrier names are ambiguous or when cross-referencing with internal carrier configuration. |
| 12 | `country_iso` | varchar(4) | **Country/region analysis.** Values: `US`, `AU`, `IR`, `JP`, etc. Used to build geographic distribution charts, identify country-specific delivery issues, and filter logs by destination country. |
| 13 | `to_iso` | varchar(8) | **Destination country code.** Used as a secondary geographic classifier. In some records, `to_iso` may differ from `country_iso` for routing analysis. |
| 14 | `units` | integer | **Message segment count.** Indicates how many SMS segments a message was split into. Relevant for cost analysis and identifying issues with long messages that get split and partially fail. |
| 15 | `message_time` | timestamp | **Timestamp for time-series analysis.** Used to plot success rate over time, group records by date, detect trends (improving/worsening), and filter logs within the requested date range. |
| 16 | `number_type` | varchar(32) | **Number type classification.** Values: `local`, `mobile`, `shortcode`, `tollfree`. Allows agents to filter and identify if failures are concentrated on a specific number type (e.g., shortcode messages failing more than long codes). |

---

## Table 2: `base.fact_mdr_enriched`
**Purpose:** Secondary/enriched source for SMS analysis when additional error classification is needed.
**When used:** As a supplementary lookup when `dlr_error` codes from `mdr_raw_airflow` need enriched error categorization.

| # | Column | Type | Justification |
|---|--------|------|---------------|
| 1 | `message_uuid` | varchar(36) | **Join key.** Used to correlate records between `mdr_raw_airflow` and this enriched table when additional error context is needed. |
| 2 | `account_id` | integer | **Customer filter.** Used when querying this table directly for enriched error data. |
| 3 | `message_state` | varchar(12) | **Status verification.** Cross-reference delivery status with raw table to confirm consistency. |
| 4 | `dlr_error` | varchar(10) | **Error code (enriched).** Same DLR error code, used for joining and verification. |
| 5 | `enr_error_code` | integer | **Enriched error classification.** Provides a normalized, integer-based error code that maps to standardized error categories. Supplements the raw `dlr_error` string with a cleaner classification for AI analysis. |
| 6 | `carrier_id` | varchar(28) | **Carrier identification.** Since this table lacks `carrier_name`, the ID is used to join back to raw data or internal carrier mapping for attribution. |
| 7 | `country_iso` | varchar(4) | **Geographic analysis.** Same purpose as in raw table — country-level filtering and distribution charts. |
| 8 | `message_time` | timestamp | **Temporal alignment.** Used for date-range filtering when querying this table. |
| 9 | `dst_number_type` | char(2) | **Enriched number type.** Values: `LC` (local), `SC` (shortcode), `TF` (tollfree), `MB` (mobile). Provides standardized number type classification for more consistent analysis. |
| 10 | `message_direction` | varchar(8) | **Direction filter.** Same purpose as in raw table — filtering by inbound/outbound traffic. |

---

## Table 3: `base.cdr_raw_airflow`
**Purpose:** Primary source for Voice (CDR) log analysis.
**Why this table:** Contains the richest set of call detail fields including Plivo-specific hangup codes, carrier names, call quality indicators, and customer identifiers.

| # | Column | Type | Justification |
|---|--------|------|---------------|
| 1 | `call_uuid` | varchar(64) | **Unique record identifier.** Primary key for the log table. Allows agents to reference specific calls in tickets and trace call flows. |
| 2 | `account_id` | varchar(16) | **Customer lookup.** Primary filter for querying logs by Plivo Auth ID. |
| 3 | `username` | varchar(32) | **Customer lookup (alternate).** Values: `schoolpointe`, etc. Allows filtering by customer username when Auth ID is unavailable. |
| 4 | `from_number` | varchar(128) | **Caller number.** Displayed in log table. Helps identify caller-specific issues (e.g., a number being flagged as spam). |
| 5 | `to_number` | varchar(128) | **Destination number.** Displayed in log table. Essential for diagnosing destination-specific routing failures. |
| 6 | `call_direction` | varchar(8) | **Traffic direction.** Values: `inbound`/`outbound`. Filters and segments analysis by direction, as failure patterns differ significantly. |
| 7 | `call_state` | varchar(32) | **Call outcome.** Values: `ANSWER`, `NOANSWER`, `BUSY`, `CANCEL`, etc. Used alongside hangup codes to classify call success/failure. |
| 8 | `hangup_cause` | varchar(32) | **Hangup reason (SIP-level).** Values: `NORMAL_CLEARING`, `USER_BUSY`, `NO_ROUTE_DESTINATION`, etc. Primary field for the error distribution chart. Maps to standard SIP/Q.850 cause codes. |
| 9 | `plivo_hangup_cause_code` | integer | **Plivo-specific hangup code.** Values: `4000` (Normal), `4010` (End of XML), etc. Numeric code used for programmatic success/failure classification. Codes 4000 and 4016 indicate success. |
| 10 | `plivo_hangup_cause_name` | varchar(64) | **Plivo-specific hangup description.** Values: `Normal Hangup`, `End Of XML Instructions`, etc. Human-readable label shown in the error distribution chart and issue cards. More descriptive than raw SIP causes. |
| 11 | `plivo_hangup_source` | varchar(16) | **Who initiated the hangup.** Values: `Callee`, `Caller`, `Plivo`, `Carrier`. Helps agents determine whether failures originate from the customer's app, the end user, the carrier, or Plivo infrastructure. |
| 12 | `carrier_name` | varchar(64) | **Carrier attribution.** Values: `Level_3_Communication`, etc. Used to build carrier distribution charts and identify carrier-specific routing failures. |
| 13 | `carrier_id` | varchar(32) | **Carrier identifier.** Precise carrier reference for cross-referencing with internal carrier dashboards. |
| 14 | `country_iso` | varchar(4) | **Destination country.** Values: `US`, `UK`, `IN`, etc. Used for geographic distribution analysis and country filtering. |
| 15 | `from_iso` | varchar(5) | **Origin country.** Used alongside `to_iso` for international call routing analysis. |
| 16 | `to_iso` | varchar(8) | **Destination country code.** Alternate geographic classifier for destination. |
| 17 | `start_time` | timestamp | **Call initiation timestamp.** Used for time-series charts, date-range filtering, and trend detection. |
| 18 | `answer_time` | timestamp | **Call answer timestamp.** Used to calculate ring time and post-dial delay. Null values indicate unanswered calls. |
| 19 | `end_time` | timestamp | **Call end timestamp.** Used with `start_time` to compute actual duration and for date-range boundary filtering. |
| 20 | `bill_duration` | integer | **Billable duration (seconds).** Shown in log table. Helps agents assess call impact — zero-duration calls with failure codes indicate complete routing failures vs. calls that connected but dropped. |
| 21 | `ring_time` | integer | **Ring duration (seconds).** Diagnostic indicator. Excessively long ring times may indicate destination issues. Zero ring time with failure may indicate immediate rejection. |
| 22 | `post_dial_delay` | integer | **Post-dial delay (seconds).** Network quality indicator. High PDD values may indicate carrier-side latency or routing issues. Used in AI analysis for quality assessment. |
| 23 | `sip_call_id` | varchar(128) | **SIP Call-ID header.** Used by agents for deep debugging — can be shared with carriers to trace specific calls through their infrastructure. |
| 24 | `tollfree` | varchar(8) | **Toll-free indicator.** Values: `True`/`False`. Allows filtering by toll-free traffic, which has distinct carrier routing and failure patterns. |
| 25 | `call_duration_type` | varchar(16) | **Duration bucket.** Values: `30S`, `60S`, etc. Helps segment analysis by call length to identify if short/long calls fail at different rates. |

---

## Table 4: `base.zentrunk_cdr_raw`
**Purpose:** Primary source for Zentrunk (SIP Trunking) log analysis.
**Why this table:** Zentrunk operates differently from standard Plivo voice — it's a SIP trunking product with different fields (trunk-level routing, SIP codecs, transport protocols).

| # | Column | Type | Justification |
|---|--------|------|---------------|
| 1 | `call_uuid` | varchar(100) | **Unique record identifier.** Primary key for Zentrunk calls in the log table. |
| 2 | `account_id` | integer | **Customer lookup.** Primary filter for querying Zentrunk logs by customer account. |
| 3 | `from_number` | varchar(256) | **Source identifier.** Values include SIP usernames (e.g., `mathrawkdev`) and phone numbers. Displayed in log table for call identification. |
| 4 | `to_number` | varchar(256) | **Destination number.** Displayed in log table for diagnosing destination-specific routing issues. |
| 5 | `call_direction` | varchar(20) | **Traffic direction.** Values: `inbound`/`outbound`. Segments analysis by direction. |
| 6 | `hangup_cause` | varchar(100) | **Hangup reason.** Values: `normal_clearing`, `originator_cancel`, `no_route_destination`, etc. Primary field for error distribution chart and failure classification. |
| 7 | `hangup_code` | integer | **Numeric hangup code.** SIP/Q.850 cause code for programmatic classification. Used to determine success (null or normal codes) vs failure. |
| 8 | `hangup_initiator` | varchar(100) | **Who terminated the call.** Values: `customer`, `carrier`, `callee`. Crucial for Zentrunk diagnosis — determines whether failures originate from the customer's PBX, the carrier, or the far end. |
| 9 | `carrier_id` | varchar(16) | **Carrier identifier.** Used for carrier-level failure attribution and distribution charts. |
| 10 | `carrier_gateway` | varchar(128) | **Carrier SIP gateway.** Values: `sip:+18593618614@4.55.40.227`. Contains the actual SIP URI used for routing. Helps diagnose gateway-specific failures (e.g., a particular gateway IP rejecting calls). |
| 11 | `from_iso` | varchar(5) | **Origin country.** Geographic analysis of call origination. |
| 12 | `to_iso` | varchar(16) | **Destination country.** Geographic analysis for regional failure patterns. |
| 13 | `initiation_time` | timestamp | **Call start timestamp.** Primary timestamp for time-series analysis, date-range filtering, and trend detection. |
| 14 | `answer_time` | timestamp | **Call answer timestamp.** `1970-01-01` indicates unanswered calls. Used to distinguish between routing failures and answered-then-dropped calls. |
| 15 | `end_time` | timestamp | **Call end timestamp.** Used with `initiation_time` for duration calculation and date-range boundaries. |
| 16 | `duration` | integer | **Actual call duration (seconds).** Zero indicates failed/unanswered calls. Shown in log table. |
| 17 | `bill_duration` | integer | **Billable duration (seconds).** Shown alongside actual duration. Helps agents understand billing impact of failed calls. |
| 18 | `transport_protocol` | varchar(25) | **SIP transport.** Values: `udp`, `tcp`, `tls`. Zentrunk-specific diagnostic — transport choice can affect reliability. Allows filtering by protocol if failures correlate with a specific transport. |
| 19 | `srtp` | boolean | **Media encryption indicator.** Whether SRTP was used. Relevant for diagnosing media-related failures where encryption negotiation fails. |
| 20 | `src_codec` | varchar(512) | **Source codec list.** Values: `PCMU,telephone-event/8000,CN`. Diagnostic field for media quality issues — codec mismatches between source and destination can cause call failures or quality degradation. |
| 21 | `dest_codec` | varchar(128) | **Destination codec list.** Compared with `src_codec` to identify codec negotiation issues. |
| 22 | `tollfree` | varchar(8) | **Toll-free indicator.** Allows filtering toll-free trunk traffic separately. |

---

## Summary

| Table | Fields Requested | Total Columns in Table | Access Scope |
|-------|-----------------|----------------------|-------------|
| `base.mdr_raw_airflow` | 16 of 39 | 39 | SELECT only, WHERE on `account_id`/`username` + `message_time`, LIMIT 150 |
| `base.fact_mdr_enriched` | 10 of 31 | 31 | SELECT only, WHERE on `account_id` + `message_time`, LIMIT 150 |
| `base.cdr_raw_airflow` | 25 of 56 | 56 | SELECT only, WHERE on `account_id`/`username` + `start_time`, LIMIT 150 |
| `base.zentrunk_cdr_raw` | 22 of 30 | 30 | SELECT only, WHERE on `account_id` + `initiation_time`, LIMIT 150 |

### What We Are NOT Accessing

The following sensitive/irrelevant columns are explicitly **excluded** from all queries:

- **Billing/financial data:** `cloud_rate`, `carrier_rate`, `total_cloud_amount`, `total_carrier_amount`, `carrier_cost`, `total_amount`, `rate`, `enr_cost`, `termination_rate` — not relevant to log diagnosis
- **Account configuration:** `account_type`, `auto_payment_approval`, `product_plan`, `tier`, `tier_name`, `plan_id` — internal billing metadata
- **Infrastructure internals:** `server_id`, `server_ip`, `opensips_ip`, `extra_data`, `conversion_rate` — internal infrastructure details not needed for customer-facing analysis
- **Internal IDs:** `id`, `subaccount_id`, `sub_account_id`, `parent_call_uuid`, `request_uuid`, `parent_uuid`, `parent_message_uuid`, `message_part_string`, `sms_group_id`, `product_plan_id`, `billing_tier_id` — internal references not useful for support diagnosis
- **Redundant fields:** `rounded_bill_duration` (have `bill_duration`), `conference_uuid` (not in scope), `last_updated`, `message_charge_time`

### Security Controls

1. **Read-only access** — All queries are `SELECT` statements only. No write operations of any kind.
2. **Row limit** — Every query includes `LIMIT 150` to cap data scanned per request.
3. **Scoped filters** — All queries filter by `account_id` or `username` + date range. No full-table scans.
4. **No data persistence** — Fetched records are held in browser `sessionStorage` only and auto-clear after 15 minutes of inactivity.
5. **No PII export to external services** — Raw log data stays client-side. Only aggregated statistics (counts, percentages) are sent to the AI model for analysis.
