import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/user/", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">This is your placeholder dashboard.</p>

        {user ? (
          <div className="mt-6 grid gap-3">
            <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-sm text-gray-300">Welcome, <span className="font-medium text-white">{user.username}</span></p>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-400">Loading user…</p>
        )}
      </div>
    </div>
  );
}
