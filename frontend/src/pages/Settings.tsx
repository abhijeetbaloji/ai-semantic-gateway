import { useEffect, useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

import { fetchSettings, saveSettings, extractErrorMessage } from '@/api/client'

export default function Settings() {
  const [threshold, setThreshold] = useState(0.90)
  const [maxLen, setMaxLen] = useState(8000)
  const [mock, setMock] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const config = await fetchSettings()
        setThreshold(config.similarityThreshold)
        setMaxLen(config.maxPromptLength)
        setMock(config.mockMode)
      } catch (e) {
        setErr(extractErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    setSaved(false)
    try {
      const config = await saveSettings({
        similarityThreshold: threshold,
        maxPromptLength: maxLen,
        mockMode: mock
      })
      setThreshold(config.similarityThreshold)
      setMaxLen(config.maxPromptLength)
      setMock(config.mockMode)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setErr(extractErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

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
        title="Settings"
        description="Workspace configuration"
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {err}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="card">
          <h3 className="mb-1 font-medium text-slate-100">Semantic cache</h3>
          <p className="mb-6 text-xs text-slate-500">
            How aggressively the cache reuses past responses.
          </p>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="label !mb-0">Similarity threshold</label>
                <span className="font-mono text-xs text-slate-300">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0.5} max={0.99} step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-brand-600"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-slate-500">
                Prompts with cosine similarity ≥ this value hit the cache instead of the LLM.
              </p>
            </div>

            <div>
              <label className="label">Max prompt length (chars)</label>
              <input
                type="number" min={100} max={100_000}
                value={maxLen}
                onChange={(e) => setMaxLen(parseInt(e.target.value || '0', 10))}
                className="input"
                disabled={saving}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="mb-1 font-medium text-slate-100">Development</h3>
          <p className="mb-6 text-xs text-slate-500">
            Mock mode returns deterministic responses without calling OpenAI. Useful for demos.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mock}
              onChange={(e) => setMock(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 cursor-pointer"
              disabled={saving}
            />
            <span className="text-sm text-slate-200">Enable mock mode</span>
          </label>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
          {saved && (
            <span className="text-xs text-emerald-400">Settings saved successfully</span>
          )}
        </div>
      </form>
    </>
  )
}
