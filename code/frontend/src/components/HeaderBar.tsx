import { useState, useRef, useEffect } from "react";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function HeaderBar() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleLogout() {
        try {
            await logout();
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
            });
            window.location.href = "/login";
        } catch (err) {
            window.location.href = "/login";
        }
    }

    const fullName = user
        ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
        : "Guest User";
    const email = user?.email ?? "guest@example.com";

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 rounded-full border border-white/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition"
                    >
                        <span>{fullName}</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-white font-semibold">
                            {user?.first_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5">
                            <div className="p-4 border-b border-slate-100">
                                <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                                <p className="text-xs text-slate-500 truncate">{email}</p>
                            </div>
                            <ul className="p-2">
                                <li>
                                    <button
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        onClick={() => alert("Not Yet!")}
                                    >
                                        <Settings size={16} />
                                        Profile Settings
                                    </button>
                                </li>
                            </ul>

                            <div className="border-t border-slate-100 p-2">
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
