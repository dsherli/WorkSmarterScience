import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Simple Home to mirror your static look; feel free to replace with your real content
function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600" />
            <span className="font-semibold tracking-tight">PersonalVTA</span>
          </div>
          <nav className="hidden gap-6 text-sm text-slate-200/90 sm:flex">
            <Link className="hover:text-white" to="/">Home</Link>
            <a className="hover:text-white" href="/assessment.html">Assessment</a>
            <Link className="hover:text-white" to="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_-20%,rgba(16,185,129,0.10),transparent)]" />
          <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-10 backdrop-blur-md shadow-[0_16px_64px_rgba(15,23,42,0.08)]">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome</h1>
            <p className="mt-2 text-slate-600">
              This landing page uses the same full-page color scheme (emerald / amber / slate).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Create account
              </Link>
              <a
                href="/assessment.html"
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow hover:bg-amber-600"
              >
                Try Assessment
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// If you have auth, wire this to real logic
// For now, it just lets everything through.
function RequireAuth({ children }: { children: React.ReactNode }) {
  // Example: read from context or cookie and gate accordingly.
  // const { user } = useAuth();
  // if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Keep a tidy fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
