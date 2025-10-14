import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
    const [username, setU] = useState("");
    const [email, setE] = useState("");
    const [password, setP] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { refresh } = useAuth();

    useEffect(() => {
        fetch("/api/auth/csrf/", { credentials: "include" }).catch(() => { });
    }, []);

    const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"));
        return match ? match.pop() : undefined;
    };

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const csrftoken = getCookie("csrftoken");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (csrftoken) headers["X-CSRFToken"] = csrftoken;

            const res = await fetch("/api/auth/register/", {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify({ username, email, password }),
            });
            if (res.ok) {
                await refresh?.();
                navigate("/login");
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || "Registration failed");
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
                        <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
                        <p className="mt-2 text-slate-300 text-sm">It only takes a minute.</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="px-8 py-8 space-y-5">
                    <div>
                        <label htmlFor="reg-username" className="mb-1 block text-sm font-medium text-slate-700">
                            Username
                        </label>
                        <input
                            id="reg-username"
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900
                         placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            placeholder="your_username"
                            value={username}
                            onChange={(e) => setU(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            id="reg-email"
                            type="email"
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900
                         placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setE(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            id="reg-password"
                            type="password"
                            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900
                         placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setP(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow
                       bg-gradient-to-br from-blue-500 to-indigo-600 hover:shadow-lg transition
                       disabled:opacity-60"
                    >
                        {loading ? "Creating…" : "Create account"}
                    </button>

                    <p className="text-center text-xs text-slate-600">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-indigo-600">
                            Sign in
                        </Link>
                    </p>
                </form>
            </section>
        </div>
    );
}
