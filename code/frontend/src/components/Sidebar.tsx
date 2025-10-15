import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Sidebar() {
    const { pathname } = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const linkClass = (path: string) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${pathname === path
            ? "bg-emerald-100 text-emerald-700"
            : "text-slate-700 hover:bg-slate-100 hover:text-emerald-600"
        }`;

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-60"
                }`}
        >
            {/* logo + toggle */}
            <div
                className={`flex h-16 items-center justify-between border-b border-slate-200 ${collapsed ? "justify-center px-0" : "px-3"
                    }`}
            >
                <div
                    className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""
                        }`}
                >
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600" />
                    {!collapsed && (
                        <span className="font-semibold text-slate-800">PersonalVTA</span>
                    )}
                </div>

                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 transition"
                    >
                        <X size={18} />
                    </button>
                )}

                {collapsed && (
                    <div
                        onClick={() => setCollapsed(false)}
                        className="absolute top-5 left-1/2 -translate-x-1/2 cursor-pointer"
                        title="Expand sidebar"
                    >
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow hover:brightness-110 transition" />
                    </div>
                )}
            </div>

            {/* menu */}
            <nav
                className={`mt-4 flex flex-col space-y-1 ${collapsed ? "items-center px-0" : "px-3"
                    }`}
            >
                <Link to="/dashboard" className={linkClass("/dashboard")}>
                    <span className="text-lg">🏠</span>
                    {!collapsed && "Dashboard"}
                </Link>
                <Link to="/assessments/1" className={linkClass("/assessments/1")}>
                    <span className="text-lg">📋</span>
                    {!collapsed && "Assessment"}
                </Link>

                <hr
                    className={`my-2 border-slate-200 transition-all ${collapsed ? "w-8 mx-auto" : "w-full"
                        }`}
                />

                <Link to="/resources" className={linkClass("/resources")}>
                    <span className="text-lg">📚</span>
                    {!collapsed && "Resources"}
                </Link>
                <Link to="/settings" className={linkClass("/settings")}>
                    <span className="text-lg">⚙️</span>
                    {!collapsed && "Settings"}
                </Link>
            </nav>
        </aside>
    );
}
