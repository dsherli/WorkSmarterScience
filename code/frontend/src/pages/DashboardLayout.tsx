import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
    GraduationCap,
    LayoutDashboard,
    BookOpen,
    Users,
    MessageSquare,
    Settings,
    LogOut,
    Bell,
    Menu,
    X,
    Activity
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notificationCount] = useState(3);
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.role || "";

    const teacherNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", page: "" },
        { icon: BookOpen, label: "My Classrooms", page: "classrooms" },
        { icon: Activity, label: "Activity Library", page: "activity-library" },
        { icon: Users, label: "Students", page: "students" },
        { icon: MessageSquare, label: "AI Insights", page: "ai-insights" }
    ];

    const studentNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", page: "" },
        { icon: BookOpen, label: "My Classes", page: "classes" },
        { icon: MessageSquare, label: "AI Assistant", page: "ai-assistant" }
    ];

    const navItems = role === "teacher" ? teacherNavItems : studentNavItems;

    const avatarText = user
        ? (user.first_name || user.username).slice(0, 2).toUpperCase()
        : "US";

    return (
        <div className="min-h-screen">
            {/* Top Navigation */}
            <nav className="bg-white border-b sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Left section */}
                        <div className="flex items-center gap-4">
                            {/* Sidebar toggle (mobile only) */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden"
                            >
                                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>

                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-semibold">WorkSmartScience</span>
                            </div>
                        </div>

                        {/* Right section */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className="relative">
                                <Bell className="w-5 h-5" />
                                {notificationCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
                                        {notificationCount}
                                    </Badge>
                                )}
                            </Button>

                            <div className="flex items-center gap-2">
                                <Avatar>
                                    <AvatarFallback>{avatarText}</AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:block">
                                    <div className="text-sm">
                                        {user?.first_name
                                            ? `${user.first_name} ${user.last_name || ""}`
                                            : user?.username}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">{role}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Layout */}
            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        } fixed lg:sticky lg:translate-x-0 top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r transition-transform duration-200 ease-in-out`}
                >
                    <nav className="p-4 space-y-2">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            const fullPath = `/dashboard/${item.page}`;
                            const isActive =
                                item.page === ""
                                    ? location.pathname === "/dashboard"
                                    : location.pathname.startsWith(fullPath);

                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        navigate(fullPath);
                                        if (location.pathname === fullPath) {
                                            navigate(0);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border border-teal-200"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-50"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={logout}
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-0 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
