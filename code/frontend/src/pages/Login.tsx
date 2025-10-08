import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, User, ArrowRight } from "lucide-react";

const GREEN = "#064e3b";  // dark green
const AMBER = "#f59e0b";  // amber

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ensure CSRF cookie
    fetch("/api/auth/csrf/", { credentials: "include" }).catch(() => { });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"));
        return match ? match.pop() : undefined;
      };
      const csrftoken = getCookie("csrftoken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrftoken) headers["X-CSRFToken"] = csrftoken;

      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        navigate("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Invalid username or password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center"> {/* 56px header */}
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-xl">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-amber-300" style={{ backgroundColor: GREEN }}>
              V
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Welcome back</h1>
              <p className="text-xs text-gray-400">Sign in to continue</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="mb-1 block text-sm text-gray-300">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950/60 pl-9 pr-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  placeholder="your_username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm text-gray-300">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950/60 pl-9 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-black shadow transition
                         disabled:opacity-60"
              style={{ backgroundColor: AMBER }}
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
            </button>

            <p className="text-center text-xs text-gray-400">
              Don’t have an account?{" "}
              <Link to="/register" className="text-amber-400 hover:text-amber-300">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
