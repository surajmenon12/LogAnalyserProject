"use client";

import { useState } from "react";
import type { TriggerAnalysisRequest } from "@/lib/types";

interface AnalysisFormProps {
  onSubmit: (data: TriggerAnalysisRequest) => void;
  submitting: boolean;
}

export default function AnalysisForm({ onSubmit, submitting }: AnalysisFormProps) {
  const [authId, setAuthId] = useState("");
  const [email, setEmail] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [logType, setLogType] = useState<"voice" | "sms" | "zentrunk">("voice");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Common filters
  const [country, setCountry] = useState("");
  const [direction, setDirection] = useState("");
  const [carrier, setCarrier] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);

  // SMS-specific
  const [messageState, setMessageState] = useState("");
  const [messageType, setMessageType] = useState("");
  const [numberType, setNumberType] = useState("");
  const [dlrError, setDlrError] = useState("");

  // Voice-specific
  const [callState, setCallState] = useState("");
  const [hangupSource, setHangupSource] = useState("");
  const [tollfree, setTollfree] = useState("");
  const [zeroDuration, setZeroDuration] = useState(false);
  const [highPdd, setHighPdd] = useState(false);

  // Zentrunk-specific
  const [hangupInitiator, setHangupInitiator] = useState("");
  const [transportProtocol, setTransportProtocol] = useState("");
  const [srtp, setSrtp] = useState("");

  const countries = [
    "US", "UK", "IN", "DE", "FR", "CA", "AU", "JP", "BR", "SG",
    "MX", "IT", "ES", "NL", "SE", "IR", "KR", "TH", "PH", "ZA",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: TriggerAnalysisRequest = {
      ...(authId ? { auth_id: authId } : {}),
      ...(email ? { email } : {}),
      from_date: fromDate,
      to_date: toDate,
      log_type: logType,
      // Common
      ...(country ? { country } : {}),
      ...(direction ? { direction } : {}),
      ...(carrier ? { carrier } : {}),
      ...(failedOnly ? { failed_only: true } : {}),
      // SMS
      ...(logType === "sms" && messageState ? { message_state: messageState } : {}),
      ...(logType === "sms" && messageType ? { message_type: messageType } : {}),
      ...(logType === "sms" && numberType ? { number_type: numberType } : {}),
      ...(logType === "sms" && dlrError ? { dlr_error: dlrError } : {}),
      // Voice
      ...(logType === "voice" && callState ? { call_state: callState } : {}),
      ...(logType === "voice" && hangupSource ? { hangup_source: hangupSource } : {}),
      ...(logType === "voice" && tollfree ? { tollfree } : {}),
      ...(logType === "voice" && zeroDuration ? { zero_duration: true } : {}),
      ...(logType === "voice" && highPdd ? { high_pdd: true } : {}),
      // Zentrunk
      ...(logType === "zentrunk" && hangupInitiator ? { hangup_initiator: hangupInitiator } : {}),
      ...(logType === "zentrunk" && transportProtocol ? { transport_protocol: transportProtocol } : {}),
      ...(logType === "zentrunk" && srtp ? { srtp: srtp === "true" } : {}),
      ...(logType === "zentrunk" && tollfree ? { tollfree } : {}),
    };
    onSubmit(req);
  };

  const hasIdentifier = authId || email;
  const isValid = hasIdentifier && fromDate && toDate;

  const inputClasses = "w-full rounded-[var(--radius-md)] border border-card-border bg-input-bg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all placeholder:text-text-muted";
  const selectClasses = inputClasses;
  const checkboxLabel = "flex items-center gap-2 text-sm text-foreground cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="card p-8 space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analyze Customer Logs</h2>
        <p className="text-sm text-text-secondary mt-1">Enter customer details to begin log analysis</p>
      </div>

      <div className="space-y-5">
        <p className="text-xs text-text-muted">Provide at least one: Auth ID or Customer Email</p>

        <div>
          <label htmlFor="authId" className="block text-sm font-medium text-foreground mb-1.5">
            Plivo Auth ID
          </label>
          <input
            id="authId"
            type="text"
            value={authId}
            onChange={(e) => setAuthId(e.target.value)}
            placeholder="e.g. MAXXXXXXXXXXXXXXXXXX"
            className={inputClasses}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-card-border" />
          <span className="text-xs text-text-muted font-medium">or</span>
          <div className="flex-1 border-t border-card-border" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Customer Email / Username
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com or username"
            className={inputClasses}
          />
          {logType === "zentrunk" && email && (
            <p className="text-[11px] text-amber-600 mt-1">Zentrunk only supports account_id lookup. Username filter will be ignored.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-foreground mb-1.5">From Date</label>
            <input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClasses} required />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-foreground mb-1.5">To Date</label>
            <input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClasses} required />
          </div>
        </div>

        {/* Log Type Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Log Type</label>
          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={() => setLogType("voice")}
              className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 transition-all text-left ${logType === "voice" ? "border-primary bg-primary-light" : "border-card-border bg-input-bg hover:border-gray-300"}`}>
              <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${logType === "voice" ? "bg-primary/15 text-primary" : "bg-muted-bg text-text-muted"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${logType === "voice" ? "text-foreground" : "text-text-secondary"}`}>Voice</p>
                <p className="text-[11px] text-text-muted">CDR Logs</p>
              </div>
            </button>

            <button type="button" onClick={() => setLogType("sms")}
              className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 transition-all text-left ${logType === "sms" ? "border-primary bg-primary-light" : "border-card-border bg-input-bg hover:border-gray-300"}`}>
              <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${logType === "sms" ? "bg-primary/15 text-primary" : "bg-muted-bg text-text-muted"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${logType === "sms" ? "text-foreground" : "text-text-secondary"}`}>SMS</p>
                <p className="text-[11px] text-text-muted">MDR Logs</p>
              </div>
            </button>

            <button type="button" onClick={() => setLogType("zentrunk")}
              className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 transition-all text-left ${logType === "zentrunk" ? "border-primary bg-primary-light" : "border-card-border bg-input-bg hover:border-gray-300"}`}>
              <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${logType === "zentrunk" ? "bg-primary/15 text-primary" : "bg-muted-bg text-text-muted"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${logType === "zentrunk" ? "text-foreground" : "text-text-secondary"}`}>Zentrunk</p>
                <p className="text-[11px] text-text-muted">SIP Trunk Logs</p>
              </div>
            </button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Advanced Filters
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-hover-bg rounded-[var(--radius-md)] border border-card-border">
            {/* Common filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClasses}>
                  <option value="">All Countries</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Direction</label>
                <select value={direction} onChange={(e) => setDirection(e.target.value)} className={selectClasses}>
                  <option value="">All Directions</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Carrier</label>
              <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Level_3_Communication, clx" className={inputClasses} />
            </div>

            <label className={checkboxLabel}>
              <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)}
                className="rounded border-card-border text-primary focus:ring-primary/20" />
              Show failed records only
            </label>

            {/* SMS-specific filters */}
            {logType === "sms" && (
              <div className="space-y-3 pt-2 border-t border-card-border">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">SMS Filters</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Message State</label>
                    <select value={messageState} onChange={(e) => setMessageState(e.target.value)} className={selectClasses}>
                      <option value="">All States</option>
                      <option value="delivered">Delivered</option>
                      <option value="undelivered">Undelivered</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Message Type</label>
                    <select value={messageType} onChange={(e) => setMessageType(e.target.value)} className={selectClasses}>
                      <option value="">All Types</option>
                      <option value="sms">SMS</option>
                      <option value="mms">MMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Number Type</label>
                    <select value={numberType} onChange={(e) => setNumberType(e.target.value)} className={selectClasses}>
                      <option value="">All Number Types</option>
                      <option value="local">Local</option>
                      <option value="mobile">Mobile</option>
                      <option value="shortcode">Shortcode</option>
                      <option value="tollfree">Toll-free</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">DLR Error Code</label>
                    <input type="text" value={dlrError} onChange={(e) => setDlrError(e.target.value)} placeholder="e.g. 801, 300, 006" className={inputClasses} />
                  </div>
                </div>
              </div>
            )}

            {/* Voice-specific filters */}
            {logType === "voice" && (
              <div className="space-y-3 pt-2 border-t border-card-border">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Voice Filters</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Call State</label>
                    <select value={callState} onChange={(e) => setCallState(e.target.value)} className={selectClasses}>
                      <option value="">All States</option>
                      <option value="ANSWER">Answer</option>
                      <option value="NOANSWER">No Answer</option>
                      <option value="BUSY">Busy</option>
                      <option value="CANCEL">Cancel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Hangup Source</label>
                    <select value={hangupSource} onChange={(e) => setHangupSource(e.target.value)} className={selectClasses}>
                      <option value="">All Sources</option>
                      <option value="Callee">Callee</option>
                      <option value="Caller">Caller</option>
                      <option value="Plivo">Plivo</option>
                      <option value="Carrier">Carrier</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Toll-free</label>
                  <select value={tollfree} onChange={(e) => setTollfree(e.target.value)} className={selectClasses}>
                    <option value="">All Traffic</option>
                    <option value="True">Toll-free Only</option>
                    <option value="False">Non-toll-free Only</option>
                  </select>
                </div>
                <div className="flex gap-6">
                  <label className={checkboxLabel}>
                    <input type="checkbox" checked={zeroDuration} onChange={(e) => setZeroDuration(e.target.checked)}
                      className="rounded border-card-border text-primary focus:ring-primary/20" />
                    Zero-duration only (routing failures)
                  </label>
                  <label className={checkboxLabel}>
                    <input type="checkbox" checked={highPdd} onChange={(e) => setHighPdd(e.target.checked)}
                      className="rounded border-card-border text-primary focus:ring-primary/20" />
                    High PDD only (&gt;4s)
                  </label>
                </div>
              </div>
            )}

            {/* Zentrunk-specific filters */}
            {logType === "zentrunk" && (
              <div className="space-y-3 pt-2 border-t border-card-border">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Zentrunk Filters</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Hangup Initiator</label>
                    <select value={hangupInitiator} onChange={(e) => setHangupInitiator(e.target.value)} className={selectClasses}>
                      <option value="">All Initiators</option>
                      <option value="customer">Customer</option>
                      <option value="carrier">Carrier</option>
                      <option value="callee">Callee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Transport Protocol</label>
                    <select value={transportProtocol} onChange={(e) => setTransportProtocol(e.target.value)} className={selectClasses}>
                      <option value="">All Protocols</option>
                      <option value="udp">UDP</option>
                      <option value="tcp">TCP</option>
                      <option value="tls">TLS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">SRTP (Encryption)</label>
                    <select value={srtp} onChange={(e) => setSrtp(e.target.value)} className={selectClasses}>
                      <option value="">All</option>
                      <option value="true">SRTP Enabled</option>
                      <option value="false">SRTP Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Toll-free</label>
                    <select value={tollfree} onChange={(e) => setTollfree(e.target.value)} className={selectClasses}>
                      <option value="">All Traffic</option>
                      <option value="True">Toll-free Only</option>
                      <option value="False">Non-toll-free Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full bg-primary text-white rounded-[var(--radius-md)] py-3 px-4 text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-hover"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting Analysis...
          </span>
        ) : "Start Analysis"}
      </button>
    </form>
  );
}
