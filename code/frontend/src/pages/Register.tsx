import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const GREEN = "#064e3b";
const AMBER = "#f59e0b";

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
                await refresh();
                navigate("/dashboard");
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
        <div className="min-h-[calc(100vh-56px)] grid place-items-center">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-xl">
                    {/* Brand */}
                    <div className="mb-6 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center text-amber-300" style={{ backgroundColor: GREEN }}>
                            V
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Create your account</h1>
                            <p className="text-xs text-gray-400">It only takes a minute</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="mb-1 block text-sm text-gray-300" htmlFor="reg-username">Username</label>
                            <input
                                id="reg-username"
                                className="w-full rounded-lg border border-gray-700 bg-gray-950/60 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                                placeholder="your_username"
                                value={username}
                                onChange={(e) => setU(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-gray-300" htmlFor="reg-email">Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                className="w-full rounded-lg border border-gray-700 bg-gray-950/60 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setE(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-gray-300" htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                className="w-full rounded-lg border border-gray-700 bg-gray-950/60 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setP(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-black shadow transition disabled:opacity-60"
                            style={{ backgroundColor: AMBER }}
                            disabled={loading}
                        >
                            {loading ? "Creating…" : "Create account"}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            Already have an account?{" "}
                            <Link to="/login" className="text-amber-400 hover:text-amber-300">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
