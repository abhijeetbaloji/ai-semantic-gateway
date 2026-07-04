import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, Building2, Loader2 } from 'lucide-react'

// MOCK register page. Real user creation belongs to Priority 3 backend work.
export default function Register() {
  const [org, setOrg] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Create workspace</h1>
          <p className="text-sm text-slate-400">Start caching your LLM calls</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Organization</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input required value={org} onChange={(e) => setOrg(e.target.value)}
                className="input pl-9" placeholder="Acme Inc." />
            </div>
          </div>

          <div>
            <label className="label">Work email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input pl-9" placeholder="you@company.com" />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9" placeholder="At least 8 characters" />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating…' : 'Create workspace'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
