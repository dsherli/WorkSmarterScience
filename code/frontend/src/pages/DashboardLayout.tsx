import { useState } from "react";
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
    X
} from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole: "teacher" | "student";
    onLogout: () => void;
}

export function DashboardLayout({ children, userRole, onLogout }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notificationCount] = useState(3);

    const teacherNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", active: true },
        { icon: BookOpen, label: "Classrooms", active: false },
        { icon: Users, label: "Students", active: false },
        { icon: MessageSquare, label: "AI Insights", active: false },
        { icon: Settings, label: "Settings", active: false }
    ];

    const studentNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", active: true },
        { icon: BookOpen, label: "My Classes", active: false },
        { icon: MessageSquare, label: "AI Assistant", active: false },
        { icon: Settings, label: "Settings", active: false }
    ];

    const navItems = userRole === "teacher" ? teacherNavItems : studentNavItems;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden"
                            >
                                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl">WorkSmartScience</span>
                            </div>
                        </div>

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
                                    <AvatarFallback>
                                        {userRole === "teacher" ? "DA" : "AS"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:block">
                                    <div className="text-sm">
                                        {userRole === "teacher" ? "Dr. Anderson" : "Alex Smith"}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">{userRole}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        } fixed lg:sticky lg:translate-x-0 top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r transition-transform duration-200 ease-in-out`}
                >
                    <nav className="p-4 space-y-2">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={index}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active
                                            ? "bg-blue-50 text-blue-600"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={onLogout}
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-0">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
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
