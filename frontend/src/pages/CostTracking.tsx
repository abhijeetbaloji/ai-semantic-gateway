import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { DollarSign, TrendingDown, Wallet, Percent, Loader2, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { fetchMetrics, fetchRequestHistory, extractErrorMessage, type MetricsResponse } from '@/api/client'

export default function CostTracking() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const [metRes, histRes] = await Promise.all([
        fetchMetrics(),
        fetchRequestHistory(),
      ])
      setMetrics(metRes)
      setHistory(histRes)
    } catch (e) {
      setErr(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Calculate chart data from request history:
  // - withoutCache: (hits + misses) * 0.0015 (assume average LLM cost without caching is $0.0015)
  // - withCache: misses * 0.0015
  const chartData = history.map((h) => {
    const withoutCache = (h.hits + h.misses) * 0.0015
    const withCache = h.misses * 0.0015
    return {
      month: h.day,
      withoutCache: parseFloat(withoutCache.toFixed(4)),
      withCache: parseFloat(withCache.toFixed(4)),
      savings: parseFloat((withoutCache - withCache).toFixed(4)),
    }
  })

  // Calculate model spend breakdown
  const openaiMiniSpend = metrics ? metrics.cacheMisses * 0.0015 : 0.0
  const embeddingSpend = (metrics ? (metrics.cacheHits + metrics.cacheMisses) : 0) * 0.0001 // text-embedding-3-small cost
  const totalSpend = openaiMiniSpend + embeddingSpend

  const providerBreakdown = [
    { provider: 'OpenAI · gpt-4o-mini', spend: openaiMiniSpend },
    { provider: 'OpenAI · text-embedding-3-small', spend: embeddingSpend },
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Cost Tracking"
        description="LLM spend, savings, and per-provider breakdown"
        actions={
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          Failed to load cost metrics: {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spend (est.)"
          value={metrics ? `$${totalSpend.toFixed(4)}` : '—'}
          hint="OpenAI API cost"
          icon={Wallet}
        />
        <StatCard
          label="Saved (est.)"
          value={metrics ? `$${metrics.estimatedCostSavedUsd.toFixed(4)}` : '—'}
          hint="vs. no cache"
          icon={TrendingDown}
        />
        <StatCard
          label="Effective savings"
          value={metrics ? `${(metrics.hitRate * 100).toFixed(1)}%` : '—'}
          hint="Overall cache hit rate"
          icon={Percent}
        />
        <StatCard
          label="Total queries avoided"
          value={metrics ? metrics.cacheHits.toString() : '—'}
          hint="Filtered by gateway"
          icon={DollarSign}
        />
      </div>

      <div className="mt-6 card">
        <div className="mb-4">
          <h3 className="font-medium text-slate-100">Daily spend vs. savings</h3>
          <p className="text-xs text-slate-500">Actual LLM cost with semantic cache vs. what you would have paid without it</p>
        </div>
        <div className="h-72">
          {chartData.length === 0 || chartData.every(c => c.withoutCache === 0) ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No query history available yet to plot costs.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="wi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `$${v.toFixed(4)}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="withoutCache" name="Without cache" stroke="#f43f5e" fill="url(#wo)" strokeWidth={2} />
                <Area type="monotone" dataKey="withCache"    name="With cache"    stroke="#10b981" fill="url(#wi)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 card">
        <div className="mb-4">
          <h3 className="font-medium text-slate-100">Spend by model (this month)</h3>
        </div>
        <div className="space-y-3">
          {providerBreakdown.map((p) => {
            const pct = totalSpend > 0 ? (p.spend / totalSpend) * 100 : 0
            return (
              <div key={p.provider}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-mono text-slate-300">{p.provider}</span>
                  <span className="text-slate-400">${p.spend.toFixed(4)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
