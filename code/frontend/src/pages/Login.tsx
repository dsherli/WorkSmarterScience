import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Login failed')
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24">
      <h1 className="text-2xl font-bold mb-4">Student Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-2 py-1" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
        </div>
      </form>
    </div>
  )
}
