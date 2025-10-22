import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { refresh } = useAuth();

    useEffect(() => {
        fetch("/api/auth/csrf/", { credentials: "include" }).catch(() => { });
    }, []);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/token/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.access) {
                // JWT
                localStorage.setItem("access", data.access);
                localStorage.setItem("refresh", data.refresh);

                await refresh?.();

                navigate("/dashboard");
            } else {
                setError(data.detail || "Invalid username or password");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800 flex items-center justify-center px-6 py-12">
            <section className="w-full max-w-lg bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl shadow-[0_16px_64px_rgba(15,23,42,0.10)] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white px-10 py-10 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10" />
                    <div className="relative">
                        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
                        <p className="mt-2 text-slate-300 text-sm">Sign in to continue.</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="px-8 py-8 space-y-5">
                    {/* Username */}
                    <div>
                        <label htmlFor="login-username" className="mb-1 block text-sm font-medium text-slate-700">
                            Username
                        </label>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                id="login-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-slate-900
                           placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                placeholder="your_username"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-9 pr-10 py-2.5 text-sm text-slate-900
                           placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow
                       bg-gradient-to-br from-blue-500 to-indigo-600 hover:shadow-lg transition disabled:opacity-60"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                        {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                    </button>

                    <p className="text-center text-xs text-slate-600">
                        Don’t have an account?{" "}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-indigo-600">
                            Create one
                        </Link>
                    </p>
                </form>
            </section>
        </div>
    );
}
