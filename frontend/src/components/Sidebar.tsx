import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareCode,
  KeyRound,
  Cpu,
  BarChart3,
  DollarSign,
  ClipboardList,
  Settings as SettingsIcon,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const items = [
  { to: '/dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/playground',    label: 'Playground',      icon: MessageSquareCode },
  { to: '/api-keys',      label: 'API Keys',        icon: KeyRound },
  { to: '/models',        label: 'Models',          icon: Cpu },
  { to: '/analytics',     label: 'Usage Analytics', icon: BarChart3 },
  { to: '/cost-tracking', label: 'Cost Tracking',   icon: DollarSign },
  { to: '/audit-logs',    label: 'Audit Logs',      icon: ClipboardList },
  { to: '/settings',      label: 'Settings',        icon: SettingsIcon },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/70 md:flex md:flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-100">Semantic Gateway</div>
          <div className="text-xs text-slate-500">LLM cache console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600/10 text-brand-500'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
          <div className="mb-1 font-medium text-slate-300">v0.1.0 · MVP</div>
          Semantic caching for LLM APIs
        </div>
      </div>
    </aside>
  )
}
