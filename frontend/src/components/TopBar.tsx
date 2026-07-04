import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { fetchHealth, type HealthResponse } from '@/api/client'
import { cn } from '@/lib/cn'

/**
 * TopBar polls /api/v1/health every 10s. The green dot means the
 * backend is really reachable — this is a real signal, not a mock.
 */
export default function TopBar() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthy, setHealthy] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const h = await fetchHealth()
        if (!cancelled) { setHealth(h); setHealthy(true) }
      } catch {
        if (!cancelled) { setHealthy(false) }
      }
    }
    poll()
    const id = setInterval(poll, 10_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6">
      <div className="flex items-center gap-3">
        <span className={cn(
          'inline-flex h-2 w-2 rounded-full',
          healthy === null ? 'bg-slate-500' :
          healthy ? 'bg-emerald-500 shadow-emerald-500/50 shadow-md' :
          'bg-rose-500',
        )} />
        <span className="text-xs text-slate-400">
          {healthy === null && 'Checking backend…'}
          {healthy === true && health && `Backend UP · ${health.version} · uptime ${formatUptime(health.uptimeSeconds)}`}
          {healthy === false && 'Backend UNREACHABLE'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
          <User className="h-3.5 w-3.5" />
          demo@acme.com
        </div>
        <button
          className="btn-secondary !px-3 !py-1.5"
          onClick={() => navigate('/login')}
          title="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  )
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
