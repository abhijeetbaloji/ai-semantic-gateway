import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  trend?: { value: string; positive: boolean }
  loading?: boolean
}

export default function StatCard({ label, value, hint, icon: Icon, trend, loading }: StatCardProps) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="label">{label}</div>
          <div className="mt-1 truncate text-2xl font-semibold text-slate-100">
            {loading ? <span className="inline-block h-6 w-20 animate-pulse rounded bg-slate-800" /> : value}
          </div>
          {hint && !loading && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {trend && !loading && (
        <div className={cn(
          'mt-3 inline-flex items-center gap-1 text-xs font-medium',
          trend.positive ? 'text-emerald-500' : 'text-rose-500',
        )}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  )
}
