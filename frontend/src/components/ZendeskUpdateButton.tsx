"use client";

import { useState } from "react";
import { updateZendesk } from "@/lib/api";

interface ZendeskUpdateButtonProps {
  analysisId: string;
  summary: string;
}

export default function ZendeskUpdateButton({
  analysisId,
  summary,
}: ZendeskUpdateButtonProps) {
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!ticketId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await updateZendesk({
        ticket_id: ticketId,
        analysis_id: analysisId,
        summary,
      });
      setResult(res.message);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-hover-bg border border-card-border flex items-center justify-center text-text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Zendesk Integration</h3>
          <p className="text-[11px] text-text-muted">Push analysis summary to a support ticket</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Ticket ID (e.g. 12345)"
          className="flex-1 rounded-[var(--radius-md)] border border-card-border bg-input-bg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all placeholder:text-text-muted"
        />
        <button
          onClick={handleUpdate}
          disabled={!ticketId || loading}
          className="px-4 py-2.5 text-sm font-medium bg-primary text-white rounded-[var(--radius-md)] hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-hover"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating...
            </span>
          ) : "Update Ticket"}
        </button>
      </div>

      {result && (
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-gray-50 rounded-[var(--radius-md)] p-2.5 border border-card-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {result}
        </div>
      )}
    </div>
  );
}
