import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GraduationCap, Sparkles } from "lucide-react";

export default function Register() {
    const [username, setU] = useState("");
    const [firstName, setFirst] = useState("");
    const [lastName, setLast] = useState("");
    const [email, setE] = useState("");
    const [password, setP] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { refresh } = useAuth();
    const location = useLocation();

    const roleFromState = (location.state as { role?: string })?.role;
    const [role] = useState(roleFromState || "student");

    useEffect(() => {
    }, [role]);

    useEffect(() => {
        fetch("/api/auth/csrf/", { credentials: "include" })
            .then((res) => {
                return res.text();
            })
            .then((t) => console.log("CSRF response text:", t))
            .catch((err) => console.error("CSRF fetch failed:", err));
    }, []);

    const getCookie = (name: string) => {
        const match = document.cookie.match(
            new RegExp("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")
        );
        return match ? match.pop() : undefined;
    };

    function validateEmail(value: string) {
        setE(value);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError("Invalid email address");
        } else {
            setEmailError(null);
        }
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (emailError) return;

        setLoading(true);
        try {
            const csrftoken = getCookie("csrftoken");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            if (csrftoken) headers["X-CSRFToken"] = csrftoken;

            const payload: Record<string, unknown> = {
                username,
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                role,
            };

            const res = await fetch("/api/auth/register/", {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = {};
            }

            if (res.ok) {
                await refresh?.();
                navigate("/login");
            } else {
                setError(data.detail || "Registration failed");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)_1fr] gap-8 items-center">
                <div className="hidden lg:block lg:col-start-1">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl">ScienceHub</span>
                    </div>
                    <h1 className="text-4xl mb-4">Join the Future of Science Education</h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Create your account and start transforming your classroom with AI-powered learning.
                    </p>
                </div>

                <section className="w-full max-w-lg mx-auto lg:col-start-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white px-8 py-8 relative overflow-hidden">
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-sm text-teal-100">
                                    Welcome to WorkSmartScience
                                </span>
                            </div>
                            <h2 className="text-2xl mb-2">Create your account</h2>
                            <p className="text-teal-100 text-sm">Start your learning journey today</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="px-8 py-8 space-y-5">
                        {/* hidden: role */}
                        <input type="hidden" name="role" value={role} />

                        {/* username */}
                        <div>
                            <label htmlFor="reg-username" className="mb-2 block text-sm text-gray-700">
                                Username
                            </label>
                            <input
                                id="reg-username"
                                className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900
                                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                                placeholder="Choose a unique username"
                                value={username}
                                onChange={(e) => setU(e.target.value)}
                                required
                            />
                        </div>

                        {/* first name / last name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="reg-first" className="mb-2 block text-sm text-gray-700">
                                    First Name
                                </label>
                                <input
                                    id="reg-first"
                                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 
                                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                                    placeholder="First name"
                                    value={firstName}
                                    onChange={(e) => setFirst(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="reg-last" className="mb-2 block text-sm text-gray-700">
                                    Last Name
                                </label>
                                <input
                                    id="reg-last"
                                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 
                                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                                    placeholder="Last name"
                                    value={lastName}
                                    onChange={(e) => setLast(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* email */}
                        <div>
                            <label htmlFor="reg-email" className="mb-2 block text-sm text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 
                                focus:outline-none focus:ring-2 transition ${emailError
                                        ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                                        : "border-gray-200 bg-gray-50 focus:ring-teal-500/20 focus:border-teal-500"
                                    }`}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => validateEmail(e.target.value)}
                                required
                            />
                            {emailError && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">{emailError}</p>
                            )}
                        </div>

                        {/* password */}
                        <div>
                            <label htmlFor="reg-password" className="mb-2 block text-sm text-gray-700">
                                Password
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 
                                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setP(e.target.value)}
                                required
                            />
                        </div>

                        {/* error */}
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg px-4 py-3 text-sm text-white shadow-lg bg-gradient-to-r from-teal-600 to-cyan-600 
                            hover:from-teal-700 hover:to-cyan-700 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating your account…" : "Create Account"}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link to="/login" className="text-teal-600 hover:text-teal-700 transition">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}
