"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { triggerAnalysis, getAnalysisStatus } from "@/lib/api";
import { usePolling } from "./usePolling";
import { saveSession, loadSession, clearSession } from "@/lib/session";
import { POLLING_INTERVAL_MS } from "@/constants";
import type {
  TriggerAnalysisRequest,
  AnalysisStatusResponse,
  WorkflowPhase,
} from "@/lib/types";

export function useAnalysis() {
  const [phase, setPhase] = useState<WorkflowPhase>("form");
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<AnalysisStatusResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const restored = useRef(false);

  // Restore session on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = loadSession();
    if (!saved) return;

    if (saved.phase === "results" && saved.statusData?.result) {
      setPhase("results");
      setAnalysisId(saved.analysisId);
      setStatusData(saved.statusData);
    } else if (saved.phase === "processing" && saved.analysisId) {
      // Resume polling for an in-progress analysis
      setPhase("processing");
      setAnalysisId(saved.analysisId);
      setStatusData(saved.statusData);
    }
  }, []);

  // Persist state whenever it changes meaningfully
  useEffect(() => {
    if (!restored.current) return;
    if (phase === "form" && !statusData) return; // nothing to save
    saveSession({ phase, analysisId, statusData });
  }, [phase, analysisId, statusData]);

  const isPolling =
    phase === "processing" &&
    analysisId !== null &&
    statusData?.status !== "completed" &&
    statusData?.status !== "failed";

  const fetcher = useCallback(() => {
    return getAnalysisStatus(analysisId!);
  }, [analysisId]);

  const shouldStop = useCallback(
    (data: AnalysisStatusResponse) =>
      data.status === "completed" || data.status === "failed",
    []
  );

  const onData = useCallback(
    (data: AnalysisStatusResponse) => {
      setStatusData(data);
      if (data.status === "completed") {
        setPhase("results");
      } else if (data.status === "failed") {
        setError(data.message);
      }
    },
    []
  );

  usePolling<AnalysisStatusResponse>({
    fetcher,
    interval: POLLING_INTERVAL_MS,
    enabled: isPolling,
    onData,
    shouldStop,
  });

  const submit = useCallback(async (request: TriggerAnalysisRequest) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await triggerAnalysis(request);
      setAnalysisId(res.analysis_id);
      setPhase("processing");
      setStatusData({
        analysis_id: res.analysis_id,
        status: "queued",
        progress_pct: 0,
        message: res.message,
        result: null,
        raw_logs: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Check if we have saved results to go back to
  const hasResults = statusData?.status === "completed" && statusData?.result != null;

  // Navigate to form without destroying saved data
  const goToForm = useCallback(() => {
    setPhase("form");
    setError(null);
  }, []);

  // Navigate back to results (if available)
  const goToDashboard = useCallback(() => {
    if (hasResults) {
      setPhase("results");
      setError(null);
    }
  }, [hasResults]);

  // Full reset — clears everything (used by session timeout)
  const fullReset = useCallback(() => {
    setPhase("form");
    setAnalysisId(null);
    setStatusData(null);
    setError(null);
    clearSession();
  }, []);

  return {
    phase,
    analysisId,
    statusData,
    error,
    submitting,
    hasResults,
    submit,
    goToForm,
    goToDashboard,
    fullReset,
  };
}
