import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    BookOpen,
    Clock,
    CheckCircle2,
    MessageSquare,
    Award,
    Calendar,
    Bot
} from "lucide-react";

const mockClasses = [
    {
        id: 1,
        name: "Biology 101",
        teacher: "Dr. Anderson",
        color: "from-blue-500 to-blue-600",
        progress: 78,
        nextClass: "Today, 1:00 PM"
    },
    {
        id: 2,
        name: "Chemistry 201",
        teacher: "Mr. Rodriguez",
        color: "from-purple-500 to-purple-600",
        progress: 65,
        nextClass: "Tomorrow, 10:00 AM"
    },
    {
        id: 3,
        name: "Physics 301",
        teacher: "Ms. Chen",
        color: "from-green-500 to-green-600",
        progress: 82,
        nextClass: "Wed, 2:00 PM"
    }
];

type Assignment = {
    activity_id: string;
    activity_title: string | null;
    pe: string | null;
    lp: string | null;
    lp_text: string | null;
};

const mockRecentActivity = [
    {
        id: 1,
        type: "submission",
        title: "Submitted Newton Laws Discussion",
        time: "2 hours ago",
        icon: CheckCircle2,
        color: "text-green-500"
    },
    {
        id: 2,
        type: "ai-help",
        title: "Asked AI for help on Cell Structure Quiz",
        time: "4 hours ago",
        icon: Bot,
        color: "text-purple-500"
    },
    {
        id: 3,
        type: "grade",
        title: "Received feedback on Chemical Bonding Lab",
        time: "Yesterday",
        icon: Award,
        color: "text-blue-500"
    }
];

export function StudentDashboard() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
    const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadAssignments = async () => {
            setLoadingAssignments(true);
            setAssignmentsError(null);

            try {
                const response = await fetch("/api/activities/", {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    const normalised = data
                        .map((item: any): Assignment => ({
                            activity_id:
                                typeof item.activity_id === "string" ? item.activity_id : "",
                            activity_title:
                                typeof item.activity_title === "string"
                                    ? item.activity_title
                                    : null,
                            pe: typeof item.pe === "string" ? item.pe : null,
                            lp: typeof item.lp === "string" ? item.lp : null,
                            lp_text: typeof item.lp_text === "string" ? item.lp_text : null,
                        }))
                        .filter((item) => item.activity_id !== "");

                    setAssignments(normalised);
                } else {
                    setAssignments([]);
                }
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Failed to load assignments", error);
                setAssignments([]);
                setAssignmentsError("We couldn't load your assignments. Please try again.");
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingAssignments(false);
                }
            }
        };

        loadAssignments();

        return () => {
            controller.abort();
        };
    }, []);

    const upcomingAssignments = assignments.slice(0, 3);
    const uniquePeCount = useMemo(() => {
        const set = new Set<string>();
        assignments.forEach((assignment) => {
            if (assignment.pe) {
                set.add(assignment.pe);
            }
        });
        return set.size;
    }, [assignments]);
    const assignmentsWithLpCount = useMemo(
        () => assignments.filter((assignment) => Boolean(assignment.lp)).length,
        [assignments],
    );

    const assignmentSummary = (() => {
        if (loadingAssignments) return "Loading your assignments...";
        if (assignmentsError) return assignmentsError;
        if (assignments.length === 0) return "No assignments are currently available.";
        if (assignments.length === 1) return "You have 1 assignment ready to explore.";
        return `You have ${assignments.length} assignments ready to explore.`;
    })();

    const displayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ""}`
        : user?.username || "Student";

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl mb-2">Welcome back, {displayName}</h1>
                <p className="text-gray-600">{assignmentSummary}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Active Classes"
                    value={String(mockClasses.length)}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="Assignments Available"
                    value={loadingAssignments ? "..." : String(assignments.length)}
                    color="bg-orange-500"
                />
                <StatCard
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Unique PEs"
                    value={loadingAssignments ? "..." : String(uniquePeCount)}
                    color="bg-green-500"
                />
                <StatCard
                    icon={<Award className="w-5 h-5" />}
                    label="With Learning Plans"
                    value={loadingAssignments ? "..." : String(assignmentsWithLpCount)}
                    color="bg-purple-500"
                />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="classes">My Classes</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Overview */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upcoming Assignments */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl">Upcoming Assignments</h2>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link to="/dashboard/activity-library">View All</Link>
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {loadingAssignments && (
                                    <p className="text-sm text-gray-500">Loading assignments...</p>
                                )}
                                {!loadingAssignments && assignmentsError && (
                                    <p className="text-sm text-red-600">{assignmentsError}</p>
                                )}
                                {!loadingAssignments &&
                                    !assignmentsError &&
                                    upcomingAssignments.length === 0 && (
                                        <p className="text-sm text-gray-500">
                                            No assignments are available right now.
                                        </p>
                                    )}
                                {!loadingAssignments &&
                                    !assignmentsError &&
                                    upcomingAssignments.map((assignment) => (
                                        <div
                                            key={assignment.activity_id}
                                            className="p-3 border rounded-lg hover:border-blue-500 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2 gap-3">
                                                <div className="flex-1">
                                                    <h3 className="mb-1">
                                                        {assignment.activity_title || "Untitled Activity"}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {assignment.pe
                                                            ? `PE: ${assignment.pe}`
                                                            : "Performance expectation coming soon"}
                                                    </p>
                                                </div>
                                                {assignment.lp && (
                                                    <Badge variant="secondary">LP {assignment.lp}</Badge>
                                                )}
                                            </div>
                                            {assignment.lp_text && (
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {assignment.lp_text}
                                                </p>
                                            )}
                                            <div className="mt-3">
                                                <Button size="sm" className="w-full" asChild>
                                                    <Link to={`/assessment/${assignment.activity_id}`}>
                                                        Open Activity
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl">Recent Activity</h2>
                            </div>
                            <div className="space-y-3">
                                {mockRecentActivity.map((activity) => {
                                    const IconComponent = activity.icon;
                                    return (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${activity.color}`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p>{activity.title}</p>
                                                <p className="text-sm text-gray-500">{activity.time}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    {/* AI Assistant */}
                    <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                <Bot className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl mb-1">Need Help?</h2>
                                <p className="text-gray-600">Ask AI if you are stuck on topics or assignments</p>
                            </div>
                            <Button size="lg">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Ask AI
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* Classes */}
                <TabsContent value="classes">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {mockClasses.map((classItem) => (
                            <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${classItem.color} flex items-center justify-center text-white mb-4`}>
                                    <BookOpen className="w-12 h-12" />
                                </div>
                                <h3 className="text-xl mb-2">{classItem.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">{classItem.teacher}</p>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Overall Progress</span>
                                            <span>{classItem.progress} percent</span>
                                        </div>
                                        <Progress value={classItem.progress} />
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        Next class {classItem.nextClass}
                                    </div>

                                    <Button className="w-full">View Class</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Assignments */}
                <TabsContent value="assignments">
                    <div className="space-y-4">
                        {loadingAssignments && (
                            <Card className="p-4 text-sm text-gray-500">Loading assignments...</Card>
                        )}
                        {!loadingAssignments && assignmentsError && (
                            <Card className="p-4 text-sm text-red-600">{assignmentsError}</Card>
                        )}
                        {!loadingAssignments && !assignmentsError && assignments.length === 0 && (
                            <Card className="p-4 text-sm text-gray-500">
                                No assignments are available right now. Check back soon!
                            </Card>
                        )}
                        {!loadingAssignments && !assignmentsError && assignments.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assignments.map((assignment) => (
                                    <Card
                                        key={assignment.activity_id}
                                        className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg">
                                                    {assignment.activity_title || "Untitled Activity"}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                                                    <Badge variant="outline">ID {assignment.activity_id}</Badge>
                                                    {assignment.pe && (
                                                        <Badge variant="secondary">PE {assignment.pe}</Badge>
                                                    )}
                                                    {assignment.lp && (
                                                        <Badge variant="outline">LP {assignment.lp}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {assignment.lp_text && (
                                            <p className="text-sm text-gray-600 line-clamp-3">
                                                {assignment.lp_text}
                                            </p>
                                        )}
                                        <div className="flex justify-end mt-auto">
                                            <Button size="sm" asChild>
                                                <Link to={`/assessment/${assignment.activity_id}`}>
                                                    Start Activity
                                                </Link>
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Activity */}
                <TabsContent value="activity">
                    <Card className="p-6">
                        <h2 className="text-xl mb-4">Your Learning Activity</h2>
                        <div className="space-y-4">
                            {mockRecentActivity.map((activity) => {
                                const IconComponent = activity.icon;
                                return (
                                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                        <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="mb-1">{activity.title}</p>
                                            <p className="text-sm text-gray-500">{activity.time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <div className="text-sm text-gray-600">{label}</div>
            </div>
            <div className="text-2xl">{value}</div>
        </Card>
    );
}

export default StudentDashboard;
