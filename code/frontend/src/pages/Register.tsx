// pages/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
    const [username, setU] = useState("");
    const [email, setE] = useState("");
    const [password, setP] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { refresh } = useAuth();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const res = await fetch("/api/auth/register/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, email, password }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.detail || "Registration failed");
            return;
        }
        await refresh();
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen grid place-items-center">
            <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 w-full max-w-md space-y-4">
                <h1 className="text-xl font-semibold">Create account</h1>
                <input className="w-full border rounded px-3 py-2" placeholder="Username" value={username} onChange={e => setU(e.target.value)} required />
                <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={e => setE(e.target.value)} required />
                <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setP(e.target.value)} required />
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button className="w-full rounded px-4 py-2 bg-black text-white">Sign up</button>
            </form>
        </div>
    );
}