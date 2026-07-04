import { useState } from 'react'
import { Send, Loader2, Database, Sparkles, Copy, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import {
  submitQuery,
  extractErrorMessage,
  type QueryResponseData,
} from '@/api/client'
import { cn } from '@/lib/cn'

/**
 * The interactive demo. Real backend calls, real cache-hit/miss behavior.
 *
 * Suggested demo script for the interview:
 *   1. Send: "How do I reset my password?"
 *      -> source=llm  (first time, no similar prompt cached)
 *   2. Send: "How can I reset my account password"
 *      -> source=cache with similarity ~0.9x  (semantic hit, no LLM call)
 *   3. Send: "What's the weather today?"
 *      -> source=llm  (unrelated, cache miss)
 *
 * Explain: the second one didn't hit the LLM. That's the product.
 */

interface HistoryItem {
  prompt: string
  data: QueryResponseData
  at: Date
}

export default function Playground() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  async function submit() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setErr(null)
    try {
      const data = await submitQuery(prompt)
      setHistory((h) => [{ prompt, data, at: new Date() }, ...h].slice(0, 20))
      setPrompt('')
    } catch (e) {
      setErr(extractErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit()
  }

  return (
    <>
      <PageHeader
        title="Playground"
        description="Send prompts and watch the semantic cache in action"
        actions={
          history.length > 0 ? (
            <button className="btn-secondary" onClick={() => setHistory([])}>
              <Trash2 className="h-4 w-4" /> Clear history
            </button>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit} className="card mb-6">
        <label className="label">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="input font-mono"
          placeholder='Try: "How do I reset my password?" then "How can I reset my account password"'
          disabled={loading}
          onKeyDown={(e) => {
            // Cmd/Ctrl + Enter to submit — nice touch for demos
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {prompt.length} chars {prompt.length > 0 && '· ⌘/Ctrl+Enter to send'}
          </span>
          <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Querying…' : 'Send'}
          </button>
        </div>
        {err && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {err}
          </div>
        )}
      </form>

      {history.length === 0 && !loading && (
        <div className="card text-center text-sm text-slate-500">
          <div className="mb-2 text-slate-400">No queries yet.</div>
          Send a prompt above to see the response and whether it hit the cache.
        </div>
      )}

      <div className="space-y-3">
        {history.map((item, i) => (
          <QueryCard key={i} item={item} />
        ))}
      </div>
    </>
  )
}

function QueryCard({ item }: { item: HistoryItem }) {
  const isCache = item.data.source === 'cache'
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs text-slate-500">
            {item.at.toLocaleTimeString()}
          </div>
          <div className="mb-2 text-sm font-medium text-slate-300">
            {item.prompt}
          </div>
        </div>
        <span className={cn(
          'badge flex-shrink-0 ring-1 ring-inset',
          isCache
            ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        )}>
          {isCache ? <Database className="mr-1 h-3 w-3" /> : <Sparkles className="mr-1 h-3 w-3" />}
          {isCache ? 'CACHE HIT' : 'LLM CALL'}
          {isCache && item.data.similarity !== null && (
            <span className="ml-1 opacity-70">
              · sim {item.data.similarity.toFixed(3)}
            </span>
          )}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-500">Response</span>
          <button
            onClick={() => navigator.clipboard.writeText(item.data.response)}
            className="text-xs text-slate-500 hover:text-slate-300"
            title="Copy response"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <div className="whitespace-pre-wrap text-sm text-slate-200">
          {item.data.response}
        </div>
      </div>
    </div>
  )
}
