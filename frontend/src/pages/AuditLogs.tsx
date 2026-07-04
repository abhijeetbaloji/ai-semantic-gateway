import { useEffect, useState } from 'react'
import { Search, Loader2, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { cn } from '@/lib/cn'
import { fetchRequestLogs, extractErrorMessage } from '@/api/client'

type LogLevel = 'info' | 'warn' | 'error'

const levelStyles: Record<LogLevel, string> = {
  info:  'bg-brand-500/10 text-brand-500 ring-brand-500/20',
  warn:  'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  error: 'bg-rose-500/10 text-rose-500 ring-rose-500/20',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState('')

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchRequestLogs()
      setLogs(data)
    } catch (e) {
      setErr(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = logs.filter(
    (r) =>
      !q ||
      r.prompt.toLowerCase().includes(q.toLowerCase()) ||
      r.response.toLowerCase().includes(q.toLowerCase()) ||
      r.source.toLowerCase().includes(q.toLowerCase()),
  )

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
        title="Audit Logs"
        description="Trail of query requests across your workspace"
        actions={
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {err}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
            placeholder="Search prompt, response, or source…"
          />
        </div>
      </div>

      <div className="card p-0">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-slate-800">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="p-3 pl-4 font-medium">Time</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Prompt</th>
              <th className="p-3 font-medium">Response</th>
              <th className="p-3 font-medium">Metrics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((r, i) => {
              const isCache = r.source === 'cache'
              return (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="p-3 pl-4 font-mono text-xs text-slate-400">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      'badge ring-1 ring-inset uppercase text-[10px]',
                      isCache ? levelStyles.info : levelStyles.warn
                    )}>
                      {isCache ? 'cache hit' : 'llm call'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-300 max-w-[200px] truncate" title={r.prompt}>
                    {r.prompt}
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-400 max-w-[250px] truncate" title={r.response}>
                    {r.response}
                  </td>
                  <td className="p-3 text-xs text-slate-500 font-mono">
                    {r.similarity ? `sim: ${(r.similarity * 100).toFixed(1)}% · ` : ''}
                    {r.durationMs}ms
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
