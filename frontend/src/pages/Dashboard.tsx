import { useEffect, useState } from 'react'
import { Activity, DollarSign, Percent, Zap, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import {
  fetchMetrics,
  fetchRequestHistory,
  fetchTopPrompts,
  extractErrorMessage,
  type MetricsResponse,
} from '@/api/client'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [topPrompts, setTopPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const [metRes, histRes, topRes] = await Promise.all([
        fetchMetrics(),
        fetchRequestHistory(),
        fetchTopPrompts(),
      ])
      setMetrics(metRes)
      setHistory(histRes)
      setTopPrompts(topRes)
    } catch (e) {
      setErr(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your semantic cache performance"
        actions={
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          Failed to load metrics: {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total requests"
          value={metrics?.requestCount.toLocaleString() ?? '—'}
          hint="Since backend start"
          icon={Activity}
          loading={loading}
        />
        <StatCard
          label="Cache hit rate"
          value={metrics ? `${(metrics.hitRate * 100).toFixed(1)}%` : '—'}
          hint={`${metrics?.cacheHits ?? 0} hits / ${metrics?.cacheMisses ?? 0} misses`}
          icon={Percent}
          loading={loading}
        />
        <StatCard
          label="Cost saved (est.)"
          value={metrics ? `$${metrics.estimatedCostSavedUsd.toFixed(4)}` : '—'}
          hint="Based on $0.0004 per avoided LLM call"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          label="Uptime"
          value={metrics ? formatUptime(metrics.uptimeSeconds) : '—'}
          hint="Backend uptime"
          icon={Zap}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-100">Request volume (last 7 days)</h3>
              <p className="text-xs text-slate-500">Cache hits vs. LLM fallbacks</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="hit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="miss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="hits" stroke="#3b82f6" fill="url(#hit)" strokeWidth={2} />
                <Area type="monotone" dataKey="misses" stroke="#f59e0b" fill="url(#miss)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-slate-100">Top cached prompts</h3>
          </div>
          {topPrompts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-slate-500">
              No cache hits recorded yet.
              <span className="mt-1">Try querying paraphrased prompts in Playground.</span>
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {topPrompts.map((p, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                  <span className="truncate text-slate-300" title={p.prompt}>{p.prompt}</span>
                  <span className="ml-3 flex-shrink-0 rounded-md bg-brand-600/10 px-2 py-0.5 text-xs text-brand-500">
                    {p.hits} hits
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}
