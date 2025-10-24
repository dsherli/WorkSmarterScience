import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, User, ArrowRight, GraduationCap, Sparkles } from "lucide-react";
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
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)_1fr] gap-8 items-center">
                {/* Left Side - Branding */}
                <div className="hidden lg:block lg:col-start-1">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl">ScienceHub</span>
                    </div>

                    <h1 className="text-4xl mb-4">Welcome Back to ScienceHub</h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Sign in to continue your learning journey with AI-powered tools.
                    </p>

                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <p className="text-sm text-gray-600">
                            Continue exploring and collaborating in your courses.
                        </p>
                    </div>
                </div>

                {/* Center - Form */}
                <section className="w-full max-w-lg mx-auto lg:col-start-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white px-8 py-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-sm text-teal-100">Welcome back</span>
                            </div>
                            <h2 className="text-2xl mb-2">Sign in to your account</h2>
                            <p className="text-teal-100 text-sm">Access your personalized dashboard</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="px-8 py-8 space-y-5">
                        {/* Username */}
                        <div>
                            <label htmlFor="login-username" className="mb-2 block text-sm text-gray-700">
                                Username
                            </label>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    id="login-username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-sm text-gray-900
                                        placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                                    placeholder="your_username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="login-password" className="mb-2 block text-sm text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 pl-9 pr-10 py-2.5 text-sm text-gray-900
                                        placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg px-4 py-3 text-sm text-white shadow-lg bg-gradient-to-r from-teal-600 to-cyan-600 
                                hover:from-teal-700 hover:to-cyan-700 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2"
                        >
                            {loading ? "Signing in…" : "Sign In"}
                            {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-sm text-gray-600">
                                Don’t have an account?{" "}
                                <Link to="/register" className="text-teal-600 hover:text-teal-700 transition">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </form>
                </section>
                <div className="hidden lg:block" />
            </div>
        </div>
    );
}
