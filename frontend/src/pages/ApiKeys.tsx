import { useState } from 'react'
import { Plus, KeyRound, Copy, Trash2, EyeOff, Eye } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed: string | null
  requests: number
}

const initialKeys: ApiKey[] = [
  { id: '1', name: 'Production',  key: 'sgk_live_9f8b2c4d1e6a7b3c9d5e8f2a4b6c7d8e', createdAt: '2026-05-12', lastUsed: '2 mins ago', requests: 128432 },
  { id: '2', name: 'Staging',     key: 'sgk_test_5a1b3c8d2e4f6a9b7c1d5e3f8a2b4c6d', createdAt: '2026-05-14', lastUsed: '1 hour ago', requests: 42918 },
  { id: '3', name: 'Local dev',   key: 'sgk_test_2e4f6a8b1c3d5e7f9a2b4c6d8e1f3a5b', createdAt: '2026-06-01', lastUsed: '3 days ago', requests: 1204 },
]

export default function ApiKeys() {
  const [keys, setKeys] = useState(initialKeys)
  const [reveal, setReveal] = useState<Record<string, boolean>>({})

  function addKey() {
    const id = String(Date.now())
    setKeys([{
      id,
      name: 'New key',
      key: 'sgk_live_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: null,
      requests: 0,
    }, ...keys])
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Manage keys that authenticate requests to the gateway"
        actions={
          <button className="btn-primary" onClick={addKey}>
            <Plus className="h-4 w-4" /> Create key
          </button>
        }
      />

      <div className="card p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Key</th>
              <th className="p-4 font-medium">Requests</th>
              <th className="p-4 font-medium">Last used</th>
              <th className="p-4 font-medium">Created</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="flex items-center gap-2 text-slate-200">
                    <KeyRound className="h-4 w-4 text-slate-500" />
                    {k.name}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">
                      {reveal[k.id] ? k.key : maskKey(k.key)}
                    </code>
                    <button
                      onClick={() => setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))}
                      className="text-slate-500 hover:text-slate-300"
                      title={reveal[k.id] ? 'Hide' : 'Reveal'}
                    >
                      {reveal[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(k.key)}
                      className="text-slate-500 hover:text-slate-300"
                      title="Copy"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="p-4 text-slate-300">{k.requests.toLocaleString()}</td>
                <td className="p-4 text-slate-400">{k.lastUsed ?? 'Never'}</td>
                <td className="p-4 text-slate-400">{k.createdAt}</td>
                <td className="p-4 text-right">
                  <button
                    className="text-slate-500 hover:text-rose-400"
                    onClick={() => setKeys(keys.filter((x) => x.id !== k.id))}
                    title="Revoke"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function maskKey(key: string): string {
  const prefix = key.slice(0, 8)
  const suffix = key.slice(-4)
  return `${prefix}${'•'.repeat(24)}${suffix}`
}
