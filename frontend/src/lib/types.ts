export interface TriggerAnalysisRequest {
  auth_id?: string;
  email?: string;
  from_date: string;
  to_date: string;
  log_type: "voice" | "sms" | "zentrunk";
  // Common filters
  country?: string;
  direction?: string;
  carrier?: string;
  failed_only?: boolean;
  // SMS-specific
  message_state?: string;
  message_type?: string;
  number_type?: string;
  dlr_error?: string;
  // Voice-specific
  call_state?: string;
  hangup_source?: string;
  tollfree?: string;
  zero_duration?: boolean;
  high_pdd?: boolean;
  // Zentrunk-specific
  hangup_initiator?: string;
  transport_protocol?: string;
  srtp?: boolean;
}

export interface TriggerAnalysisResponse {
  analysis_id: string;
  status: string;
  message: string;
}

export interface AnalysisIssue {
  title: string;
  severity: "critical" | "warning" | "info";
  description: string;
  affected_records: number;
  recommendation: string;
}

export interface ChartData {
  error_distribution: Array<{ error: string; count: number }>;
  success_rate_over_time: Array<{ date: string; rate: number }>;
}

export interface TrendInfo {
  direction: "stable" | "increasing" | "decreasing";
  slope: number;
  confidence: "high" | "medium" | "low";
  description: string;
}

export interface AnalysisResult {
  summary: string;
  issues: AnalysisIssue[];
  chart_data: ChartData;
  total_records: number;
  success_rate: number;
  date_range: string;
  log_type: string;
  health_score: number;
  health_grade: string;
  trend: TrendInfo | null;
}

export interface AnalysisStatusResponse {
  analysis_id: string;
  status:
    | "queued"
    | "fetching_logs"
    | "analyzing"
    | "completed"
    | "failed";
  progress_pct: number;
  message: string;
  result: AnalysisResult | null;
  raw_logs: Record<string, unknown>[] | null;
}

export interface UpdateZendeskRequest {
  ticket_id: string;
  analysis_id: string;
  summary: string;
}

export interface UpdateZendeskResponse {
  success: boolean;
  ticket_id: string;
  message: string;
}

export type WorkflowPhase = "form" | "processing" | "results";

export interface DrilldownFilter {
  type: "error" | "date";
  value: string;
}
