export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const POLLING_INTERVAL_MS = 2000;
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_STORAGE_KEY = "plivo_analysis_state";
