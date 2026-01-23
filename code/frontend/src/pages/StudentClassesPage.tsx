import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
    BookOpen,
    Loader2,
    Calendar,
    Search,
    Plus,
    School
} from "lucide-react";
import { toast } from "sonner";

type Classroom = {
    id: number;
    name: string;
    description: string | null;
    grade_level: string;
    school: string;
    code: string;
    status: string;
    term: string | null;
    created_at: string;
    updated_at: string;
};

const CLASS_CARD_COLORS = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-green-500 to-green-600",
    "from-pink-500 to-pink-600",
    "from-orange-500 to-yellow-500",
];

export default function StudentClassesPage() {
    const { refresh } = useAuth();
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
    const [classesError, setClassesError] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState<string>("");
    const [joiningClass, setJoiningClass] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchClasses = useCallback(async () => {
        setLoadingClasses(true);
        setClassesError(null);

        try {
            const token = localStorage.getItem("access_token");

            const makeRequest = async (accessToken?: string | null) => {
                const headers: Record<string, string> = {};
                if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
                return fetch("/api/classrooms/enrolled/", { headers });
            };

            let response = await makeRequest(token);

            if (response.status === 401) {
                try {
                    await refresh?.();
                    const newToken = localStorage.getItem("access_token");
                    response = await makeRequest(newToken);
                } catch (error) {
                    console.warn("Failed to refresh token while loading classes", error);
                }
            }

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                const normalised = data
                    .map((item: any): Classroom | null => {
                        if (!item || typeof item !== "object") return null;

                        const numericId = typeof item.id === "number" ? item.id : Number(item.id);
                        if (isNaN(numericId)) return null;

                        return {
                            id: numericId,
                            name: item.name || "Untitled class",
                            description: item.description || null,
                            grade_level: item.grade_level || "",
                            school: item.school || "",
                            code: item.code || "",
                            status: item.status || "active",
                            term: item.term || null,
                            created_at: item.created_at || "",
                            updated_at: item.updated_at || "",
                        };
                    })
                    .filter(Boolean) as Classroom[];

                setClasses(normalised);
            } else {
                setClasses([]);
            }
        } catch (error) {
            console.error("Failed to load classes", error);
            setClasses([]);
            setClassesError("We couldn't load your classes right now.");
        } finally {
            setLoadingClasses(false);
        }
    }, [refresh]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleJoinClass = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = joinCode.trim();
        if (!trimmed) {
            toast.error("Please enter a class code.");
            return;
        }

        setJoiningClass(true);

        try {
            const token = localStorage.getItem("access_token");

            const makeRequest = async (accessToken?: string | null) => {
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

                return fetch("/api/classrooms/join/", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ join_code: trimmed }),
                });
            };

            let response = await makeRequest(token);

            if (response.status === 401) {
                try {
                    await refresh?.();
                    const newToken = localStorage.getItem("access_token");
                    response = await makeRequest(newToken);
                } catch (e) { }
            }

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message = payload?.detail || "We couldn't join that class. Try again.";
                throw new Error(message);
            }

            toast.success(`Successfully joined ${payload?.name || "the class"}!`);
            setJoinCode("");
            fetchClasses();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to join class");
        } finally {
            setJoiningClass(false);
        }
    };

    const filteredClasses = useMemo(() => {
        return classes
            .filter((c) => c.status !== "deleted")
            .filter((c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.school.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [classes, searchTerm]);

    const JoinForm = ({ showHeader = true, isCompact = false }: { showHeader?: boolean; isCompact?: boolean }) => (
        <div className={`space-y-4 w-full ${isCompact ? "max-w-md" : "max-w-sm"} mx-auto`}>
            {showHeader && (
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-medium">Join New Class</h2>
                </div>
            )}
            <form onSubmit={handleJoinClass} className={`space-y-4 text-left ${isCompact ? "flex items-end gap-3 space-y-0" : ""}`}>
                <div className="flex-1">
                    <label htmlFor="join-code" className={`block text-sm font-medium text-gray-700 ${isCompact ? "mb-1" : "mb-2"}`}>
                        Class Code
                    </label>
                    <Input
                        id="join-code"
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value)}
                        placeholder="e.g. 4523423"
                        autoComplete="off"
                        maxLength={10}
                        className="bg-white border-2 focus:border-teal-500 h-11"
                    />
                </div>
                {isCompact ? (
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700 h-11 px-8" disabled={joiningClass}>
                        {joiningClass ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Class"}
                    </Button>
                ) : (
                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-11" disabled={joiningClass}>
                        {joiningClass && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {joiningClass ? "Joining..." : "Join Class"}
                    </Button>
                )}
            </form>
            {!isCompact && (
                <p className="mt-2 text-xs text-gray-500">
                    Ask your teacher for the class code to join.
                </p>
            )}
        </div>
    );

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold mb-2">My Classes</h1>
                    <p className="text-gray-600">View and manage your enrolled classrooms</p>
                </div>
                {classes.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search classes..."
                                className="pl-10 w-64 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {loadingClasses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6 h-48 animate-pulse bg-white/50" />
                    ))}
                </div>
            ) : classesError ? (
                <Card className="p-12 text-center bg-white border-red-200 border-2">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-red-900 mb-1">Error loading classes</h3>
                    <p className="text-red-500">{classesError}</p>
                    <Button variant="outline" className="mt-4" onClick={fetchClasses}>Try Again</Button>
                </Card>
            ) : classes.length === 0 ? (
                /* Wider and Shorter Big Box Empty State */
                <div className="flex items-center justify-center py-4">
                    <Card className="p-10 text-center bg-white border-dashed border-2 flex flex-col items-center w-full max-w-6xl shadow-sm rounded-3xl">
                        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-teal-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1">No classes found</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Connect with your teacher to join a class and start your learning journey.
                        </p>

                        <div className="w-full max-w-2xl bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <JoinForm showHeader={true} isCompact={true} />
                        </div>
                    </Card>
                </div>
            ) : (
                /* Normal 2-column layout */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Join Form on the left */}
                    <Card className="p-6 h-fit bg-white">
                        <JoinForm />
                    </Card>

                    {/* Classes List on the right */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredClasses.length === 0 ? (
                            <Card className="p-12 text-center bg-white border-dashed border-2">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No matches found</h3>
                                <p className="text-gray-500">Try adjusting your search</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredClasses.map((classItem, index) => {
                                    const color = CLASS_CARD_COLORS[index % CLASS_CARD_COLORS.length];
                                    return (
                                        <Link
                                            key={classItem.id}
                                            to={`/dashboard/classroom/${classItem.id}`}
                                            className="block group"
                                        >
                                            <Card className="p-6 overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-teal-500 bg-white shadow-sm">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm ring-4 ring-white`}>
                                                        <BookOpen className="w-6 h-6" />
                                                    </div>
                                                    <Badge variant="outline" className="text-xs bg-gray-50 capitalize">
                                                        {classItem.status}
                                                    </Badge>
                                                </div>

                                                <h3 className="text-xl font-medium mb-1 group-hover:text-teal-600 transition-colors">
                                                    {classItem.name}
                                                </h3>

                                                <div className="space-y-2 mt-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <School className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{classItem.school || "No school specified"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{classItem.term || "Annual"}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="capitalize">{classItem.grade_level || "Any Grade"}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t flex items-center justify-between text-teal-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View Class Details
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </div>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
