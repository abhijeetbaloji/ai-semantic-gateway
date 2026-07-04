import axios from 'axios'

// Base URL comes from Vite env var (VITE_API_URL). In docker-compose we
// set this to the nginx-proxied path; in local dev it defaults to the
// backend on :8080.
let rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
if (rawBaseURL && !rawBaseURL.endsWith('/api/v1')) {
  rawBaseURL = rawBaseURL.replace(/\/$/, '') + '/api/v1'
}
const baseURL = rawBaseURL

export const api = axios.create({
  baseURL,
  timeout: 35_000, // slightly above backend's 30s LLM timeout
  headers: { 'Content-Type': 'application/json' },
})

// -------- Types matching the backend contract --------

export interface QueryResponseData {
  response: string
  source: 'cache' | 'llm'
  similarity: number | null
}

export interface SuccessEnvelope<T> {
  timestamp: string
  status: number
  data: T
}

export interface ErrorEnvelope {
  timestamp: string
  status: number
  errorCode: string
  message: string
}

export interface HealthResponse {
  status: string
  version: string
  uptimeSeconds: number
}

export interface MetricsResponse {
  requestCount: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  estimatedCostSavedUsd: number
  uptimeSeconds: number
}

export interface SystemSettings {
  similarityThreshold: number
  maxPromptLength: number
  mockMode: boolean
}

// -------- Calls --------

export async function submitQuery(prompt: string): Promise<QueryResponseData> {
  const res = await api.post<SuccessEnvelope<QueryResponseData>>('/query', { prompt })
  return res.data.data
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await api.get<HealthResponse>('/health')
  return res.data
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await api.get<MetricsResponse>('/metrics')
  return res.data
}

export async function fetchSettings(): Promise<SystemSettings> {
  const res = await api.get<SuccessEnvelope<SystemSettings>>('/settings')
  return res.data.data
}

export async function saveSettings(settings: SystemSettings): Promise<SystemSettings> {
  const res = await api.post<SuccessEnvelope<SystemSettings>>('/settings', settings)
  return res.data.data
}

export async function fetchRequestHistory(): Promise<any[]> {
  const res = await api.get<SuccessEnvelope<any[]>>('/analytics/history')
  return res.data.data
}

export async function fetchTopPrompts(): Promise<any[]> {
  const res = await api.get<SuccessEnvelope<any[]>>('/analytics/top-prompts')
  return res.data.data
}

export async function fetchRequestLogs(): Promise<any[]> {
  const res = await api.get<SuccessEnvelope<any[]>>('/analytics/logs')
  return res.data.data
}

export async function fetchRequestsPerHour(): Promise<any[]> {
  const res = await api.get<SuccessEnvelope<any[]>>('/analytics/requests-per-hour')
  return res.data.data
}

export async function fetchLatency(): Promise<any[]> {
  const res = await api.get<SuccessEnvelope<any[]>>('/analytics/latency')
  return res.data.data
}

export async function fetchModelDistribution(): Promise<any[]> {
  const res = await api.get<SuccessEnvelope<any[]>>('/analytics/models')
  return res.data.data
}

// Extract a user-friendly error string from an axios error, whether the
// backend responded with our ErrorEnvelope or something else went wrong.
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ErrorEnvelope | undefined
    if (data?.message) return data.message
    if (err.message) return err.message
  }
  return 'An unexpected error occurred'
}
