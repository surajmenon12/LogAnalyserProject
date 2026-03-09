"use client";

import { useAnalysis } from "@/hooks/useAnalysis";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import Sidebar from "@/components/Sidebar";
import AnalysisForm from "@/components/AnalysisForm";
import StatusTracker from "@/components/StatusTracker";
import AISummaryCard from "@/components/AISummaryCard";
import ErrorDistributionChart from "@/components/ErrorDistributionChart";
import SuccessRateChart from "@/components/SuccessRateChart";
import RawLogsDownload from "@/components/RawLogsDownload";
import ZendeskUpdateButton from "@/components/ZendeskUpdateButton";
import PrivacyBanner from "@/components/PrivacyBanner";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";

function getHeaderContent(phase: string): { title: string; subtitle: string; breadcrumb: string } {
  switch (phase) {
    case "processing":
      return { title: "Analysis in Progress", subtitle: "Fetching and analyzing customer logs", breadcrumb: "Processing" };
    case "results":
      return { title: "Analysis Results", subtitle: "Review findings and take action", breadcrumb: "Results" };
    default:
      return { title: "New Analysis", subtitle: "Customer issue diagnosis", breadcrumb: "New Analysis" };
  }
}

export default function Home() {
  const {
    phase, analysisId, statusData, error, submitting, hasResults,
    submit, goToForm, goToDashboard,
  } = useAnalysis();
  const { showModal, handleTimeout } = useSessionTimeout(phase !== "form");
  const { title, subtitle, breadcrumb } = getHeaderContent(phase);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentPhase={phase}
        hasResults={hasResults}
        onNewAnalysis={goToForm}
        onDashboard={goToDashboard}
      />

      <main className="flex-1 lg:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card-bg/80 backdrop-blur-md border-b border-card-border">
          <div className="px-6 lg:px-8 h-16 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-text-muted mb-0.5">
                <span>Plivo Log Analysis</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-text-secondary">{breadcrumb}</span>
              </div>
              <h1 className="text-[15px] font-semibold text-foreground leading-none">{title}</h1>
            </div>
            <p className="hidden sm:block text-xs text-text-muted">{subtitle}</p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-6 space-y-6">
          <PrivacyBanner />

          {error && (
            <div className="card-static p-4 border-danger/30 bg-danger-light text-sm text-red-700 flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {phase === "form" && (
            <>
              {hasResults && (
                <button
                  onClick={goToDashboard}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to last results
                </button>
              )}
              <AnalysisForm onSubmit={submit} submitting={submitting} />
            </>
          )}

          {phase === "processing" && statusData && (
            <StatusTracker
              status={statusData.status}
              progressPct={statusData.progress_pct}
              message={statusData.message}
            />
          )}

          {phase === "results" && statusData?.result && (
            <>
              <AISummaryCard result={statusData.result} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ErrorDistributionChart
                  data={statusData.result.chart_data.error_distribution}
                />
                <SuccessRateChart
                  data={statusData.result.chart_data.success_rate_over_time}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {statusData.raw_logs && (
                  <RawLogsDownload
                    logs={statusData.raw_logs}
                    logType={statusData.result.log_type}
                  />
                )}

                {analysisId && (
                  <ZendeskUpdateButton
                    analysisId={analysisId}
                    summary={statusData.result.summary}
                  />
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={goToForm}
                  className="px-6 py-2.5 text-sm font-medium text-text-secondary bg-card-bg border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-gray-50 hover:shadow-hover transition-all"
                >
                  Start New Analysis
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && <SessionTimeoutModal onConfirm={handleTimeout} />}
    </div>
  );
}
