import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, BookOpen, Loader2, Search, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface Classroom {
    id: number;
    name: string;
    description: string | null;
    grade_level: string;
    school: string;
    code: string;
    status: string;
}

interface CoursesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    role: string;
}

export default function CoursesDrawer({ isOpen, onClose, role }: CoursesDrawerProps) {
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const fetchClasses = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        setIsLoading(true);
        try {
            const endpoint = role === "teacher" ? "/api/classrooms/" : "/api/classrooms/enrolled/";
            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setClasses(data.filter((c: any) => c.status !== "deleted"));
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
        } finally {
            setIsLoading(false);
        }
    }, [role]);

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
        }
    }, [isOpen, fetchClasses]);

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = joinCode.trim();
        if (!trimmed) return toast.error("Please enter a code");

        setIsJoining(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("/api/classrooms/join/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ join_code: trimmed })
            });

            if (res.ok) {
                toast.success("Successfully joined!");
                setJoinCode("");
                fetchClasses();
            } else {
                const data = await res.json();
                toast.error(data.detail || "Failed to join");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsJoining(false);
        }
    };

    const filteredClasses = classes;

    return (
        <aside
            className={`fixed top-16 bottom-0 left-20 bg-white border-r z-30 w-64 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
                }`}
        >
            <div className="flex flex-col h-full w-64">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-[11px] font-bold text-teal-600 uppercase tracking-[0.2em]">All Classes</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 h-8 w-8">
                        <X className="w-5 h-5 text-gray-500" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                    {/* List Section */}
                    <div className="p-4 space-y-4">

                        {isLoading ? (
                            <div className="space-y-4 px-2 py-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
                                ))}
                            </div>
                        ) : filteredClasses.length === 0 ? (
                            <div className="text-center py-12 px-6">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                    <BookOpen className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">No courses found</p>
                                <p className="text-xs text-gray-500 mt-1">Join your first class to get started.</p>
                            </div>
                        ) : (
                            <div className="grid gap-1">
                                {filteredClasses.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/dashboard/classroom/${item.id}`}
                                        onClick={onClose}
                                        className="group p-3 rounded-xl hover:bg-teal-50 hover:border-teal-100 border border-transparent transition-all duration-200"
                                    >
                                        <div className="text-[13.5px] font-semibold text-teal-700 group-hover:text-teal-900 leading-tight">
                                            {item.name}
                                        </div>
                                        {role === "teacher" && (
                                            <div className="flex items-center gap-2 mt-1.5 opacity-70">
                                                <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded uppercase font-bold">
                                                    TEACH
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium truncate italic">
                                                    {item.school}
                                                </span>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Join/Create Section - Fixed at bottom */}
                {role === "student" && (
                    <div className="p-6 bg-teal-50/50 border-t border-teal-100 mt-auto">
                        <h3 className="text-xs font-bold text-teal-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <PlusCircle className="w-4 h-4" />
                            Join New Class
                        </h3>
                        <form onSubmit={handleJoinClass} className="space-y-3">
                            <div className="relative group">
                                <Input
                                    placeholder="Enter Class Code"
                                    className="h-11 bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 text-sm pl-4 rounded-xl shadow-sm transition-all"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
                            </div>
                            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-11 text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all" disabled={isJoining}>
                                {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isJoining ? "Joining..." : "Submit Code"}
                            </Button>
                            <p className="text-[10px] text-teal-600/60 text-center font-medium">
                                Need a code? Contact your instructor.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </aside>
    );
}
