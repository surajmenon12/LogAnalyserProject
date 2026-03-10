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
  const [country, setCountry] = useState("");

  const countries = [
    "US", "UK", "India", "Germany", "France", "Canada", "Australia",
    "Japan", "Brazil", "Singapore", "Mexico", "Italy", "Spain", "Netherlands", "Sweden",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(authId ? { auth_id: authId } : {}),
      ...(email ? { email } : {}),
      from_date: fromDate,
      to_date: toDate,
      log_type: logType,
      ...(country ? { country } : {}),
    });
  };

  const hasIdentifier = authId || email;
  const isValid = hasIdentifier && fromDate && toDate;

  const inputClasses = "w-full rounded-[var(--radius-md)] border border-card-border bg-input-bg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all placeholder:text-text-muted";

  return (
    <form onSubmit={handleSubmit} className="card p-8 space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analyze Customer Logs</h2>
        <p className="text-sm text-text-secondary mt-1">Enter customer details to begin log analysis</p>
      </div>

      <div className="space-y-5">
        {/* Identifier hint */}
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
            Customer Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-foreground mb-1.5">
              From Date
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-foreground mb-1.5">
              To Date
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={inputClasses}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Log Type</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setLogType("voice")}
              className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 transition-all text-left ${
                logType === "voice"
                  ? "border-primary bg-primary-light"
                  : "border-card-border bg-input-bg hover:border-gray-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${
                logType === "voice" ? "bg-primary/15 text-primary" : "bg-muted-bg text-text-muted"
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${logType === "voice" ? "text-foreground" : "text-text-secondary"}`}>Voice</p>
                <p className="text-[11px] text-text-muted">CDR Logs</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLogType("sms")}
              className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 transition-all text-left ${
                logType === "sms"
                  ? "border-primary bg-primary-light"
                  : "border-card-border bg-input-bg hover:border-gray-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${
                logType === "sms" ? "bg-primary/15 text-primary" : "bg-muted-bg text-text-muted"
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${logType === "sms" ? "text-foreground" : "text-text-secondary"}`}>SMS</p>
                <p className="text-[11px] text-text-muted">MDR Logs</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLogType("zentrunk")}
              className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 transition-all text-left ${
                logType === "zentrunk"
                  ? "border-primary bg-primary-light"
                  : "border-card-border bg-input-bg hover:border-gray-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${
                logType === "zentrunk" ? "bg-primary/15 text-primary" : "bg-muted-bg text-text-muted"
              }`}>
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

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1.5">
            Country <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClasses}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
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
