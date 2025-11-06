import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Assessment1 from "./pages/Assessment1";
import RubricManager from "./pages/RubricManager";
import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import { useAuth } from "./auth/AuthContext";

// --- Public Home page ---
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
                        <a className="hover:text-white" href="/">Home</a>
                        <a className="hover:text-white" href="/dashboard">Dashboard</a>
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
                            <a
                                href="/login"
                                className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
                            >
                                Sign in
                            </a>
                            <a
                                href="/register"
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                Create account
                            </a>
                            <a
                                href="/assessment/005.04-c01"
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

// --- Protected layout (requires login) ---
function ProtectedLayout() {
    const { user, loading } = useAuth();

    // Wait for auth to load
    if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

    // Redirect if not logged in
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800">
            <Sidebar />
            <div className="ml-60 flex flex-col flex-1 transition-all duration-300 ease-in-out">
                <HeaderBar />
                <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route index element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes (auth required) */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Dynamic activity route */}
                    <Route path="/assessment/:activity_id" element={<Assessment1 />} />

                    {/* Rubric manager (staff-only by UX convention) */}
                    <Route path="/rubrics/manage" element={<RubricManager />} />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
