import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Login failed')
        setLoading(false)
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // color palette (dev-friendly inline fallbacks)
  const colors = {
    sage: '#9AAE9A', // soft sage green
    slateBg: '#6b7c8e', // slate gray
    amber: '#f59e0b', // warm amber (Tailwind amber-500)
    forest: '#064e3b', // deep forest
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.slateBg}`}>
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div style={{ backgroundColor: colors.sage }} className="flex items-center gap-3 px-6 py-5">
            <div style={{ backgroundColor: colors.forest }} className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold">V</div>
            <div>
              <h2 className="text-lg font-semibold text-white">Welcome back</h2>
              <p className="text-sm text-white/90">Sign in to continue to Student App</p>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="your username"
                  aria-label="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="your password"
                  aria-label="password"
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  <span>Remember me</span>
                </label>
                <a className="text-sm text-amber-600 hover:underline" href="#">Forgot?</a>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold px-4 py-2 rounded-md"
                  style={{ backgroundColor: colors.amber }}
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              <span>Don’t have an account?</span>{' '}
              <a className="text-amber-600 font-medium hover:underline" href="#">Sign up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
