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
    UsersRound,
    MessageSquare,
    Settings,
    LogOut,
    Bell,
    Menu,
    X,
    Activity,
    Sparkles,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import CoursesDrawer from "../components/CoursesDrawer";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [coursesDrawerOpen, setCoursesDrawerOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const [notificationCount] = useState(3);
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.role || "";

    const teacherNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", page: "" },
        { icon: BookOpen, label: "My Classses", page: "classrooms" },
        { icon: Activity, label: "Activity Library", page: "activity-library" },
        { icon: Users, label: "Students", page: "students" },
        { icon: UsersRound, label: "Groups", page: "groups" },
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

    const displayName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
        : "User";

    const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <div className="min-h-screen bg-white">
            {/* Top Navigation */}
            <nav className="bg-white border-b sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-semibold">WorkSmarterScience</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className="relative">
                                <Bell className="w-5 h-5" />
                                {notificationCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs text-white bg-red-500 border-none">
                                        {notificationCount}
                                    </Badge>
                                )}
                            </Button>

                            <div className="relative">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2 pr-2 hover:opacity-80 transition-opacity"
                                >
                                    <Avatar className="w-8 h-8 border ring-1 ring-black/5 shadow-sm">
                                        <AvatarFallback className="text-[10px] bg-teal-50 text-teal-700 font-bold">{avatarText}</AvatarFallback>
                                    </Avatar>
                                </button>

                                {profileMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setProfileMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 pt-4 pb-3.5 px-3.5 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="flex items-center gap-3 mb-3 px-0.5">
                                                <Avatar className="w-12 h-12 border-2 border-teal-100 p-0.5">
                                                    <AvatarFallback className="text-sm bg-teal-50 text-teal-700 font-bold">{avatarText}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                        {displayName}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate leading-tight">
                                                        {user?.email}
                                                    </p>
                                                    <span className="text-[11px] font-medium text-teal-600 mt-0.5">
                                                        {displayRole}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 pt-2">
                                                <button
                                                    onClick={logout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                                >
                                                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex relative">
                {/* Primary Narrow Sidebar (Canvas style) */}
                <aside className={`fixed top-16 left-0 z-50 w-20 h-[calc(100vh-4rem)] bg-teal-800 border-r flex flex-col items-center py-6 shadow-xl scrollbar-hide overflow-y-auto overflow-x-hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Nav Items Group */}
                    <div className="flex flex-col items-center w-full gap-2">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            const fullPath = item.page === "" ? "/dashboard" : `/dashboard/${item.page}`;
                            const isClasses = item.label === "My Classes" || item.label === "My Classrooms";

                            const isActive = item.page === ""
                                ? (location.pathname === "/dashboard" || location.pathname === "/dashboard/")
                                : location.pathname.startsWith(fullPath);

                            const isSelected = (isClasses && coursesDrawerOpen) || (isActive && !coursesDrawerOpen);

                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (isClasses) {
                                            setCoursesDrawerOpen(!coursesDrawerOpen);
                                        } else {
                                            setCoursesDrawerOpen(false);
                                            navigate(fullPath);
                                        }
                                    }}
                                    className={`flex flex-col items-center gap-1 group w-full py-2 transition-all relative ${isSelected ? "text-white" : "text-teal-300 hover:text-white"
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-all ${isSelected ? "bg-teal-700 shadow-inner ring-2 ring-white/10" : "group-hover:bg-teal-700/50"
                                        }`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-medium tracking-tight px-1 text-center leading-tight">
                                        {item.label}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-[0_0_8px_white]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-auto w-full border-t border-teal-700/50 pt-6 flex flex-col items-center gap-4">
                        <button className="text-teal-300 hover:text-white transition-colors">
                            <Settings className="w-6 h-6" />
                        </button>
                        <button onClick={logout} className="text-teal-300 hover:text-red-400 transition-colors">
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </aside>

                <CoursesDrawer
                    isOpen={coursesDrawerOpen}
                    onClose={() => setCoursesDrawerOpen(false)}
                    role={role}
                />

                {/* Main Content Area */}
                <main
                    className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 
                        ${!sidebarOpen ? "ml-0" : coursesDrawerOpen ? "lg:ml-[21rem]" : "lg:ml-20"} 
                        ${sidebarOpen ? "ml-20" : "ml-0"}
                    `}
                >
                    <div className="p-0 h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
