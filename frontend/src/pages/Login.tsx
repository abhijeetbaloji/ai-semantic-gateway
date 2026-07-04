import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, Loader2 } from 'lucide-react'

/**
 * MOCK login. Real Spring Security is Priority 3 backend work.
 * This exists so the demo has a landing page and a clear entry point.
 */
export default function Login() {
  const [email, setEmail] = useState('demo@acme.com')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Simulate a call so the button behavior feels real in a demo
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 400)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Semantic Gateway</h1>
          <p className="text-sm text-slate-400">Log in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-slate-500">
            No account?{' '}
            <Link to="/register" className="text-brand-500 hover:text-brand-400">
              Create one
            </Link>
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Demo build — any credentials work
        </p>
      </div>
    </div>
  )
}
