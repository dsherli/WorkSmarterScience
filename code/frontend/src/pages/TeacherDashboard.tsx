import { useAuth } from "../auth/AuthContext";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { toast } from "sonner";

import {
    BookOpen,
    Users,
    Activity,
    Plus,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    MessageSquare,
    X,
    Pencil,
    Trash2,
} from "lucide-react";

const createClassroomSchema = z.object({
    name: z.string().min(1, "Classroom name is required").min(3, "Classroom name must be at least 3 characters"),
    school: z.string().min(1, "School name is required").min(3, "School name must be at least 3 characters"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    description: z.string().optional(),
});

const editClassroomSchema = z.object({
    name: z.string().min(1, "Classroom name is required").min(3, "Classroom name must be at least 3 characters"),
    status: z.enum(["active", "archived"]),
    description: z.string().optional(),
});

const mockActivities = [
    {
        id: 1,
        title: "Cell Structure and Function Quiz (Mock)",
        classroom: "Biology 101",
        submitted: 24,
        total: 28,
        needsReview: 5,
        dueDate: "Today, 3:00 PM",
        status: "open"
    },
    {
        id: 3,
        title: "Chemical Reactions Worksheet (Mock)",
        classroom: "Chemistry 201",
        submitted: 24,
        total: 24,
        needsReview: 0,
        dueDate: "Yesterday",
        status: "closed"
    },
];

const mockRecentFeedback = [
    {
        id: 1,
        student: "Emma Johnson",
        activity: "Cell Structure Quiz (Mock)",
        aiScore: 85,
        status: "pending"
    },
    {
        id: 2,
        student: "Liam Smith",
        activity: "Photosynthesis Lab (Mock)",
        aiScore: 92,
        status: "pending"
    },
];

export function TeacherDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateClassroomOpen, setIsCreateClassroomOpen] = useState(false);
    const [selectedClassroomCode, setSelectedClassroomCode] = useState<string | null>(null);
    const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
    const [studentEmail, setStudentEmail] = useState("");
    const [addedStudents, setAddedStudents] = useState<string[]>([]);
    const [deleteClassroomId, setDeleteClassroomId] = useState<number | null>(null);
    const [editClassroom, setEditClassroom] = useState<any>(null);
    const [isEditClassroomOpen, setIsEditClassroomOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'dashboard' | 'classroom' | 'activity'>('dashboard');
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

    const colors = [
        "from-blue-500 to-blue-600",
        "from-purple-500 to-purple-600",
        "from-green-500 to-green-600",
        "from-pink-500 to-pink-600",
        "from-orange-500 to-yellow-500",
    ];

    const getRandomColor = (id: number) => colors[id % colors.length];

    const displayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ""}`
        : user?.username || "Teacher";

    const form = useForm<z.infer<typeof createClassroomSchema>>({
        resolver: zodResolver(createClassroomSchema),
        defaultValues: {
            name: "",
            description: "",
            gradeLevel: "",
            school: "",
        },
    });

    const editForm = useForm<z.infer<typeof editClassroomSchema>>({
        resolver: zodResolver(editClassroomSchema),
        defaultValues: {
            name: "",
            status: "active",
        },
    });

    //--------------------------------------------------------- classroom -----------------------------------------------------

    const fetchClassrooms = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return toast.error("Not authenticated");

        try {
            setIsLoading(true);
            const res = await fetch("/api/classrooms/", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();

                const filtered = data
                    .filter((c) => c.status !== "deleted")
                    .sort((a, b) => {
                        const order = { active: 1, archived: 2 };
                        if (order[a.status] !== order[b.status]) {
                            return order[a.status] - order[b.status];
                        }
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                    });

                setClassrooms(filtered);
            } else {
                toast.error("Failed to fetch classrooms");
            }
        } catch {
            toast.error("Network error while loading classrooms");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const handleCreateClassroom = async (values) => {
        const token = localStorage.getItem("access_token");

        const payload = JSON.stringify({
            name: values.name,
            grade_level: values.gradeLevel,
            school: values.school,
            description: values.description || "",
            status: "active",
            term: ""
        });

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };

        try {
            const response = await fetch("/api/classrooms/", {
                method: "POST",
                headers,
                body: payload,
            });

            const data = await response.json().catch(() => null);

            if (response.ok) {
                toast.success("Classroom created successfully!");
                form.reset();
                setIsCreateClassroomOpen(false);
                await fetchClassrooms();
                setActiveTab("classrooms");
                navigate("/dashboard/classrooms");
            } else {
                toast.error(`Failed: ${data?.detail || JSON.stringify(data)}`);
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const openEditClassroom = (classroom: any) => {
        setEditClassroom(classroom);
        editForm.reset({
            name: classroom.name,
            status: classroom.status || "active",
            description: classroom.description || "",
        });
        setIsEditClassroomOpen(true);
    };

    const navigate = useNavigate();

    const handleViewClassroom = (classroomId: number) => {
        navigate(`/dashboard/classroom/${classroomId}`);
    };

    const handleViewActivity = (activityId: string) => {
        setSelectedActivityId(activityId);
        setCurrentView('activity');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedClassroomId(null);
        setSelectedActivityId(null);
    };

    const handleEditClassroom = async (values: z.infer<typeof editClassroomSchema>) => {
        if (!editClassroom) return;
        const token = localStorage.getItem("access_token");
        if (!token) return toast.error("Not authenticated");

        try {
            const response = await fetch(`/api/classrooms/${editClassroom.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: values.name,
                    status: values.status,
                    description: values.description || "",
                }),
            });

            if (response.ok) {
                toast.success("Classroom updated successfully!");
                setIsEditClassroomOpen(false);
                setEditClassroom(null);
                editForm.reset();
                fetchClassrooms();
            } else {
                const data = await response.json();
                toast.error(data?.detail || "Failed to update classroom");
            }
        } catch {
            toast.error("Network error while updating classroom");
        }
    };

    const handleDeleteClassroom = async () => {
        if (!deleteClassroomId) return;
        const token = localStorage.getItem("access_token");
        if (!token) return toast.error("Not authenticated");

        try {
            const response = await fetch(`/api/classrooms/${deleteClassroomId}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "deleted" }),
            });

            if (response.ok) {
                toast.success("Classroom deleted");
                setClassrooms(prev => prev.filter(c => c.id !== deleteClassroomId));
                setDeleteClassroomId(null);
            } else {
                const data = await response.json();
                toast.error(data?.detail || "Failed to delete classroom");
            }
        } catch {
            toast.error("Network error while deleting classroom");
        }
    };

    //--------------------------------------------------------- student -----------------------------------------------------

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (studentEmail && studentEmail.includes('@')) {
            setAddedStudents([...addedStudents, studentEmail]);
            setStudentEmail("");
            toast.success("Student added!", {
                description: `${studentEmail} has been added to the list.`,
            });
        }
    };

    const handleRemoveStudent = (email: string) => {
        setAddedStudents(addedStudents.filter(s => s !== email));
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] w-full bg-gray-50 p-[50px] space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl mb-2">Welcome back, {displayName}</h1>
                <p className="text-gray-600">Here is what is happening in your classrooms today</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    label="Total Students"
                    value="100 (Mock)"
                    change="+4 this week"
                    color="bg-blue-500"
                />
                <StatCard
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Active Activities"
                    value="10 (Mock)"
                    change="3 due today"
                    color="bg-purple-500"
                />
                <StatCard
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Avg Completion"
                    value="87% (Mock)"
                    change="+5 percent from last week"
                    color="bg-green-500"
                />
                <StatCard
                    icon={<MessageSquare className="w-5 h-5" />}
                    label="AI Interactions"
                    value="234 (Mock)"
                    change="Today"
                    color="bg-orange-500"
                />
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback Review</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Activities */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl">Recent Activities (Mock 11-04-25)</h2>
                                <Button size="sm" variant="ghost">View All</Button>
                            </div>
                            <div className="space-y-3">
                                {mockActivities.slice(0, 3).map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))}
                            </div>
                        </Card>

                        {/* Pending Reviews */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl">Pending Reviews (Mock 11-04-25)</h2>
                                <Button size="sm" variant="ghost">View All</Button>
                            </div>
                            <div className="space-y-3">
                                {mockRecentFeedback.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{item.student.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div>{item.student}</div>
                                                <div className="text-sm text-gray-500">{item.activity}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="p-6">
                        <h2 className="text-xl mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Button
                                className="h-auto py-4 flex flex-col gap-2"
                                variant="outline"
                                onClick={() => setIsCreateClassroomOpen(true)}
                            >
                                <Plus className="w-5 h-5" />
                                Create Classroom
                            </Button>
                            <Button
                                className="h-auto py-4 flex flex-col gap-2"
                                variant="outline"
                                onClick={() => setIsAddStudentsOpen(true)}
                            >
                                <Users className="w-5 h-5" />
                                Add Students
                            </Button>
                            <Button className="h-auto py-4 flex flex-col gap-2" variant="outline">
                                <MessageSquare className="w-5 h-5" />
                                View AI Insights
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* Classrooms */}
                <TabsContent value="classrooms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classrooms.length === 0 ? (
                            <p className="text-gray-500 text-sm">No classrooms found.</p>
                        ) : (
                            classrooms.map((classroom) => (
                                <Card key={classroom.id} className="p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRandomColor(classroom.id)} flex items-center justify-center text-white`}>
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg">{classroom.name}</h3>
                                                    <Badge
                                                        variant={classroom.status === "active" ? "default" : "secondary"}
                                                        className={
                                                            classroom.status === "active"
                                                                ? "bg-teal-500 text-white"
                                                                : "bg-gray-200 text-gray-600"
                                                        }
                                                    >
                                                        {classroom.status === "active" ? "Active" : "Archived"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {classroom.school} • {classroom.grade_level}
                                                </p>
                                                {classroom.description && (
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {classroom.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="ghost">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white">
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={() => openEditClassroom(classroom)}
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                    onSelect={() => setDeleteClassroomId(classroom.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleViewClassroom(classroom.id)}
                                        >
                                            View Classroom
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedClassroomCode(classroom.code)}
                                        >
                                            Code
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Activities */}
                <TabsContent value="activities">
                    <div className="space-y-3">
                        {mockActivities.map((activity) => (
                            <Card key={activity.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg">{activity.title}</h3>
                                            <Badge variant={activity.status === "closed" ? "destructive" : "default"}>
                                                {activity.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>{activity.classroom}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {activity.dueDate}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Button>View Details</Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Feedback */}
                <TabsContent value="feedback">
                    <Card className="p-6">
                        <h2 className="text-xl mb-4">AI Feedback Awaiting Review</h2>
                        <div className="space-y-3">
                            {mockActivities.filter(a => a.needsReview > 0).map((activity) => (
                                <div key={activity.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="mb-1">{activity.title}</h3>
                                            <p className="text-sm text-gray-600">{activity.classroom}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="destructive" className="text-xs">
                                                {activity.needsReview} pending reviews
                                            </Badge>
                                            <Button>Review Feedback</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Classroom Modal */}
            <Dialog open={isCreateClassroomOpen} onOpenChange={setIsCreateClassroomOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Classroom</DialogTitle>
                        <DialogDescription>
                            Add a new classroom to organize your students and activities.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateClassroom)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Classroom Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Biology 101 - Period 1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="school"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>School</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Lincoln High School" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gradeLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Grade Level</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select grade level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white">
                                                {["Elementary", "Middle", "High"].map((grade) => (
                                                    <SelectItem key={grade} value={grade.toLowerCase()}>
                                                        {grade} School
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter a brief description of this classroom..."
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline" className="bg-white"
                                    onClick={() => {
                                        form.reset();
                                        setIsCreateClassroomOpen(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Create Classroom
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Classroom Code Modal */}
            <Dialog open={!!selectedClassroomCode} onOpenChange={() => setSelectedClassroomCode(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Classroom Code</DialogTitle>
                        <DialogDescription>
                            Share this code with students to join the classroom
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8">
                        <div className="text-center">
                            <div className="inline-block bg-gradient-to-br from-teal-500 to-cyan-600 text-white px-8 py-6 rounded-2xl shadow-lg">
                                <p className="text-sm mb-2 opacity-90">Join Code</p>
                                <p className="text-5xl tracking-wider font-mono">{selectedClassroomCode}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline" className="bg-white w-full"
                            onClick={() => setSelectedClassroomCode(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Students Modal */}
            <Dialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Students</DialogTitle>
                        <DialogDescription>
                            Enter student email addresses to add them to your classroom
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <form onSubmit={handleAddStudent} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="student@example.com"
                                value={studentEmail}
                                onChange={(e) => setStudentEmail(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit">Add</Button>
                        </form>

                        {addedStudents.length > 0 && (
                            <div className="space-y-2">
                                <Label>Added Students ({addedStudents.length})</Label>
                                <div className="border rounded-lg max-h-64 overflow-y-auto">
                                    {addedStudents.map((email, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs">
                                                        {email.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{email}</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemoveStudent(email)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {addedStudents.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No students added yet. Enter an email above to get started.
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline" className="bg-white"
                            onClick={() => {
                                setIsAddStudentsOpen(false);
                                setAddedStudents([]);
                                setStudentEmail("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (addedStudents.length > 0) {
                                    toast.success("Students added successfully!", {
                                        description: `${addedStudents.length} student(s) have been added.`,
                                    });
                                    setIsAddStudentsOpen(false);
                                    setAddedStudents([]);
                                    setStudentEmail("");
                                }
                            }}
                            disabled={addedStudents.length === 0}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Classroom Modal */}
            <Dialog open={isEditClassroomOpen} onOpenChange={setIsEditClassroomOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Classroom</DialogTitle>
                        <DialogDescription>
                            Update the classroom details
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleEditClassroom)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Classroom Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., Biology 101 - Period 1"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white">
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter classroom description"
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        editForm.reset();
                                        setIsEditClassroomOpen(false);
                                        setEditClassroom(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>


            {/* Delete Classroom Confirmation */}
            <AlertDialog open={deleteClassroomId !== null} onOpenChange={(open) => !open && setDeleteClassroomId(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this classroom?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the classroom and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteClassroom}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    change: string;
    color: string;
}

function StatCard({ icon, label, value, change, color }: StatCardProps) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <div className="text-sm text-gray-600">{label}</div>
            </div>
            <div className="text-2xl mb-1">{value}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {change}
            </div>
        </Card>
    );
}

interface ActivityItemProps {
    activity: typeof mockActivities[0];
}

function ActivityItem({ activity }: ActivityItemProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span>{activity.title}</span>
                    {activity.needsReview > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {activity.needsReview} to review
                        </Badge>
                    )}
                </div>
                <div className="text-sm text-gray-500">{activity.classroom} • Due {activity.dueDate}</div>
            </div>
            <div className="text-sm text-gray-600">
                {activity.submitted}/{activity.total}
            </div>
        </div>
    );
}


export default TeacherDashboard;
