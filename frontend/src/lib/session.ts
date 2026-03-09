import { SESSION_STORAGE_KEY } from "@/constants";
import type { AnalysisStatusResponse, WorkflowPhase } from "@/lib/types";

export interface SessionState {
  phase: WorkflowPhase;
  analysisId: string | null;
  statusData: AnalysisStatusResponse | null;
}

export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(state: SessionState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
