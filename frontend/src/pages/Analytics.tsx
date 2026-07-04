import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Loader2, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import {
  fetchRequestsPerHour,
  fetchLatency,
  fetchModelDistribution,
  extractErrorMessage,
} from '@/api/client'

export default function Analytics() {
  const [requestsPerHour, setRequestsPerHour] = useState<any[]>([])
  const [latencyData, setLatencyData] = useState<any[]>([])
  const [modelDistribution, setModelDistribution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const [reqRes, latRes, modelRes] = await Promise.all([
        fetchRequestsPerHour(),
        fetchLatency(),
        fetchModelDistribution(),
      ])
      setRequestsPerHour(reqRes)
      setLatencyData(latRes)
      setModelDistribution(modelRes)
    } catch (e) {
      setErr(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  const hasData = requestsPerHour.some(r => r.requests > 0) || latencyData.some(l => l.p50 > 0) || modelDistribution.some(m => m.value > 0)

  return (
    <>
      <PageHeader
        title="Usage Analytics"
        description="Traffic patterns, latency, and model distribution"
        actions={
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          Failed to load analytics: {err}
        </div>
      )}

      <div className="mb-6 card">
        <div className="mb-4">
          <h3 className="font-medium text-slate-100">Requests per hour (last 24h)</h3>
          <p className="text-xs text-slate-500">Aggregate across all queries</p>
        </div>
        <div className="h-72">
          {!hasData ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No query history available in the last 24h to show patterns.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestsPerHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-medium text-slate-100">Latency (ms)</h3>
            <p className="text-xs text-slate-500">p50 / p95 / p99 response times</p>
          </div>
          <div className="h-64">
            {!hasData ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No latency records available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-4">
            <h3 className="font-medium text-slate-100">Model distribution</h3>
            <p className="text-xs text-slate-500">Share of LLM vs embedding API calls</p>
          </div>
          <div className="h-64">
            {!hasData ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No model calls recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={modelDistribution} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2}>
                    {modelDistribution.map((entry, index) => (
                      <Cell key={`c-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {modelDistribution.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="font-mono text-slate-300">{m.name}</span>
                </div>
                <span className="text-slate-400">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
