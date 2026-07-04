import { Cpu, Check } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { cn } from '@/lib/cn'

interface Model {
  id: string
  provider: string
  family: string
  contextTokens: string
  costIn: string
  costOut: string
  enabled: boolean
  role: 'embedding' | 'chat'
}

// Model catalog and enabled state.
const models: Model[] = [
  { id: 'text-embedding-3-small', provider: 'OpenAI',    family: 'text-embedding-3', contextTokens: '8K',   costIn: '$0.02 / 1M', costOut: '—',        enabled: true,  role: 'embedding' },
  { id: 'text-embedding-3-large', provider: 'OpenAI',    family: 'text-embedding-3', contextTokens: '8K',   costIn: '$0.13 / 1M', costOut: '—',        enabled: false, role: 'embedding' },
  { id: 'gpt-4o-mini',            provider: 'OpenAI',    family: 'gpt-4o',           contextTokens: '128K', costIn: '$0.15 / 1M', costOut: '$0.60 / 1M', enabled: true,  role: 'chat' },
  { id: 'gpt-4o',                 provider: 'OpenAI',    family: 'gpt-4o',           contextTokens: '128K', costIn: '$2.50 / 1M', costOut: '$10.00 / 1M', enabled: false, role: 'chat' },
  { id: 'claude-haiku-4-5',       provider: 'Anthropic', family: 'claude-4',         contextTokens: '200K', costIn: '$0.25 / 1M', costOut: '$1.25 / 1M', enabled: false, role: 'chat' },
  { id: 'claude-sonnet-5',        provider: 'Anthropic', family: 'claude-5',         contextTokens: '200K', costIn: '$3.00 / 1M', costOut: '$15.00 / 1M', enabled: false, role: 'chat' },
]

export default function Models() {
  return (
    <>
      <PageHeader
        title="Models"
        description="Configure which LLM and embedding models power your gateway"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProviderCard name="OpenAI" configured active />
        <ProviderCard name="Anthropic" configured={false} />
      </div>

      <div className="card p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-medium">Model</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Context</th>
              <th className="p-4 font-medium">Input</th>
              <th className="p-4 font-medium">Output</th>
              <th className="p-4 font-medium text-right">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {models.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                      <Cpu className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-mono text-xs text-slate-200">{m.id}</div>
                      <div className="text-xs text-slate-500">{m.provider} · {m.family}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    'badge',
                    m.role === 'embedding'
                      ? 'bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20'
                      : 'bg-brand-500/10 text-brand-500 ring-1 ring-inset ring-brand-500/20',
                  )}>
                    {m.role}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{m.contextTokens}</td>
                <td className="p-4 text-slate-400">{m.costIn}</td>
                <td className="p-4 text-slate-400">{m.costOut}</td>
                <td className="p-4 text-right">
                  <ToggleReadonly on={m.enabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ProviderCard({ name, configured, active }: { name: string; configured: boolean; active?: boolean }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-slate-100">{name}</div>
          <div className="mt-1 text-xs text-slate-500">
            {configured ? 'API key configured' : 'Not configured'}
          </div>
        </div>
        <span className={cn(
          'badge',
          active
            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20'
            : 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20',
        )}>
          {active && <Check className="mr-1 h-3 w-3" />}
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

function ToggleReadonly({ on }: { on: boolean }) {
  return (
    <div className={cn(
      'inline-flex h-5 w-9 items-center rounded-full transition-colors',
      on ? 'bg-brand-600' : 'bg-slate-700',
    )}>
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        on ? 'translate-x-4' : 'translate-x-0.5',
      )}/>
    </div>
  )
}
