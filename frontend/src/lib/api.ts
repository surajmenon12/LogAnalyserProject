import { API_BASE_URL } from "@/constants";
import type {
  TriggerAnalysisRequest,
  TriggerAnalysisResponse,
  AnalysisStatusResponse,
  UpdateZendeskRequest,
  UpdateZendeskResponse,
} from "./types";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function triggerAnalysis(
  req: TriggerAnalysisRequest
): Promise<TriggerAnalysisResponse> {
  return fetchJSON<TriggerAnalysisResponse>(
    `${API_BASE_URL}/api/trigger-analysis`,
    { method: "POST", body: JSON.stringify(req) }
  );
}

export async function getAnalysisStatus(
  analysisId: string
): Promise<AnalysisStatusResponse> {
  return fetchJSON<AnalysisStatusResponse>(
    `${API_BASE_URL}/api/analysis-status/${analysisId}`
  );
}

export async function updateZendesk(
  req: UpdateZendeskRequest
): Promise<UpdateZendeskResponse> {
  return fetchJSON<UpdateZendeskResponse>(
    `${API_BASE_URL}/api/update-zendesk`,
    { method: "POST", body: JSON.stringify(req) }
  );
}
