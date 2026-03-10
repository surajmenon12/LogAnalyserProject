"use client";

import { useState, useMemo } from "react";
import { downloadCSV, downloadJSON } from "@/lib/download";
import type { DrilldownFilter } from "@/lib/types";

interface LogTableProps {
  logs: Record<string, unknown>[];
  logType: string;
  drilldownFilter?: DrilldownFilter | null;
  onClearDrilldown?: () => void;
}

const PAGE_SIZE = 20;

// Map log type to the carrier field name in the data
function getCarrierField(logType: string): string {
  return logType === "zentrunk" ? "carrier_id" : "carrier_name";
}

// Map log type to the country field name
function getCountryField(logType: string): string {
  return logType === "zentrunk" ? "to_iso" : "country_iso";
}

// Map log type to the status/cause filter field
function getStatusField(logType: string): string {
  if (logType === "voice") return "hangup_cause";
  if (logType === "zentrunk") return "hangup_cause";
  return "message_state";
}

// Map log type to the timestamp field
function getTimeField(logType: string): string {
  if (logType === "voice") return "start_time";
  if (logType === "zentrunk") return "initiation_time";
  return "message_time";
}

export default function LogTable({ logs, logType, drilldownFilter, onClearDrilldown }: LogTableProps) {
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const carrierField = getCarrierField(logType);
  const countryField = getCountryField(logType);
  const statusField = getStatusField(logType);
  const timeField = getTimeField(logType);

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const carriers = new Set<string>();
    const countries = new Set<string>();
    const statuses = new Set<string>();
    for (const log of logs) {
      if (log[carrierField]) carriers.add(String(log[carrierField]));
      if (log[countryField]) countries.add(String(log[countryField]));
      if (log[statusField]) statuses.add(String(log[statusField]));
    }
    return {
      carriers: Array.from(carriers).sort(),
      countries: Array.from(countries).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [logs, carrierField, countryField, statusField]);

  // Filter & search
  const filtered = useMemo(() => {
    let result = [...logs];

    // Drilldown filter
    if (drilldownFilter) {
      if (drilldownFilter.type === "error") {
        result = result.filter((log) => {
          let errorStr: string;
          if (logType === "voice") {
            errorStr = `${log.plivo_hangup_cause_code} - ${log.plivo_hangup_cause_name}`;
          } else if (logType === "zentrunk") {
            errorStr = String(log.hangup_cause || "");
          } else {
            errorStr = `${log.dlr_error} - ${log.message_state}`;
          }
          return errorStr === drilldownFilter.value;
        });
      } else if (drilldownFilter.type === "date") {
        result = result.filter((log) => {
          const logDate = String(log[timeField] || "").slice(0, 10);
          return logDate === drilldownFilter.value;
        });
      }
    }

    if (carrierFilter) result = result.filter((log) => String(log[carrierField]) === carrierFilter);
    if (countryFilter) result = result.filter((log) => String(log[countryField]) === countryFilter);
    if (statusFilter) result = result.filter((log) => String(log[statusField]) === statusFilter);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((log) =>
        Object.values(log).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    return result;
  }, [logs, search, carrierFilter, countryFilter, statusFilter, drilldownFilter, logType, carrierField, countryField, statusField, timeField]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = String(a[sortKey] ?? "");
      const vb = String(b[sortKey] ?? "");
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const columns = logs.length > 0 ? Object.keys(logs[0]) : [];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filename = `${logType}_logs_${new Date().toISOString().slice(0, 10)}`;

  const selectClasses = "rounded-[var(--radius-md)] border border-card-border bg-input-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  const statusLabel = logType === "voice" || logType === "zentrunk" ? "Hangup Causes" : "Message States";

  return (
    <div className="card p-6 space-y-4 overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Log Records</h3>
          <span className="text-[11px] text-text-muted bg-hover-bg px-2 py-0.5 rounded-full">
            {filtered.length} of {logs.length} records
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(filtered as Record<string, unknown>[], `${filename}_filtered.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-hover-bg hover:shadow-hover transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => downloadJSON(filtered as unknown[], `${filename}_filtered.json`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-hover-bg hover:shadow-hover transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            JSON
          </button>
        </div>
      </div>

      {/* Drilldown filter bar */}
      {drilldownFilter && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary-light border border-primary/20 rounded-[var(--radius-md)] text-xs">
          <span className="text-primary font-medium">
            Filtered by {drilldownFilter.type}: {drilldownFilter.value}
          </span>
          {onClearDrilldown && (
            <button
              onClick={onClearDrilldown}
              className="ml-auto text-primary hover:text-primary-hover font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search all fields..."
          className={`flex-1 min-w-[200px] ${selectClasses}`}
        />
        <select value={carrierFilter} onChange={(e) => { setCarrierFilter(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">All Carriers</option>
          {uniqueValues.carriers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">All Countries</option>
          {uniqueValues.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">All {statusLabel}</option>
          {uniqueValues.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2.5 text-left font-semibold text-text-secondary cursor-pointer hover:text-foreground transition-colors whitespace-nowrap select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col}
                    {sortKey === col && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {sortDir === "asc" ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className="border-b border-card-border/50 hover:bg-hover-bg transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-text-muted">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-text-muted">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] disabled:opacity-40 hover:bg-hover-bg transition-all"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] disabled:opacity-40 hover:bg-hover-bg transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
