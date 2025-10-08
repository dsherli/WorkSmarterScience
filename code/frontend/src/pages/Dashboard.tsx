import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/user/', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null))
  }, [])

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user ? (
        <div className="mt-4">
          <p>Welcome, {user.username}</p>
          <pre className="mt-2 bg-gray-100 p-2">{JSON.stringify(user, null, 2)}</pre>
        </div>
      ) : (
        <p className="mt-4">Not logged in or loading...</p>
      )}
    </div>
  )
}
