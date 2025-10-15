import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function HeaderBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <span className="font-semibold tracking-tight">PersonalVTA</span>
        </div>
        <nav className="hidden gap-6 text-sm text-slate-200/90 sm:flex">
          <Link className="hover:text-white" to="/">Home</Link>
          <Link className="hover:text-white" to="/assessments/1">Assessment</Link>
          <Link className="hover:text-white" to="/dashboard">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/user/", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800">
      <HeaderBar />

      {/* Page header stripe (emerald w/ amber accent) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_-20%,rgba(16,185,129,0.10),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 backdrop-blur-md shadow-[0_16px_64px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Dashboard
                </h1>
                <p className="mt-1 text-slate-600">
                  {user ? <>Welcome back, <span className="font-semibold text-emerald-600">{user.username}</span>.</> : "Loading user…"}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Beta features enabled
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content grid (full page styling; not just a card) */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-16">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <h3 className="font-semibold text-slate-900">Interactive Assessments</h3>
            <p className="mt-2 text-sm text-slate-600">
              Jump back into your latest assessment and pick up where you left off.
            </p>
            <Link
              to="/assessments/1"
              className="mt-4 inline-block rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              Continue
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
            <h3 className="font-semibold text-slate-900">Progress</h3>
            <p className="mt-2 text-sm text-slate-600">See scores and topic mastery trends.</p>
            <button className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow hover:bg-amber-600">
              View Progress
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-slate-400 to-slate-500" />
            <h3 className="font-semibold text-slate-900">Resources</h3>
            <p className="mt-2 text-sm text-slate-600">Reference sheets and practice sets.</p>
            <button className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Open Library
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
