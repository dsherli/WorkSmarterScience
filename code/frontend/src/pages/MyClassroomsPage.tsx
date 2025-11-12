import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "../components/ui/select";

// ------------------ SCHEMAS ------------------

const createClassroomSchema = z.object({
    name: z
        .string()
        .min(1, "Classroom name is required")
        .min(3, "Classroom name must be at least 3 characters"),
    school: z
        .string()
        .min(1, "School name is required")
        .min(3, "School name must be at least 3 characters"),
    gradeLevel: z.string().min(1, "Grade level is required"),
    description: z.string().optional(),
});

const editClassroomSchema = z.object({
    name: z
        .string()
        .min(1, "Classroom name is required")
        .min(3, "Classroom name must be at least 3 characters"),
    status: z.enum(["active", "archived"]),
    description: z.string().optional(),
});

// ------------------ COMPONENT ------------------

export default function ClassroomsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateClassroomOpen, setIsCreateClassroomOpen] = useState(false);
    const [deleteClassroomId, setDeleteClassroomId] = useState<number | null>(
        null
    );
    const [editClassroom, setEditClassroom] = useState<any>(null);
    const [isEditClassroomOpen, setIsEditClassroomOpen] = useState(false);
    const [selectedClassroomCode, setSelectedClassroomCode] = useState<string | null>(null);

    const colors = [
        "from-blue-500 to-blue-600",
        "from-purple-500 to-purple-600",
        "from-green-500 to-green-600",
        "from-pink-500 to-pink-600",
        "from-orange-500 to-yellow-500",
    ];
    const getRandomColor = (id: number) => colors[id % colors.length];

    // ------------------ FETCH CLASSROOMS ------------------

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
                    .filter(
                        (c) => c.status !== "deleted" && c.created_by_id === user?.id
                    )
                    .sort((a, b) => {
                        const order = { active: 1, archived: 2 };
                        if (order[a.status] !== order[b.status]) {
                            return order[a.status] - order[b.status];
                        }
                        return (
                            new Date(b.updated_at).getTime() -
                            new Date(a.updated_at).getTime()
                        );
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

    const handleViewClassroom = (classroomId: number) => {
        navigate(`/dashboard/classroom/${classroomId}`);
    };

    // ------------------ FORMS ------------------

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

    // ------------------ CRUD HANDLERS ------------------

    const handleCreateClassroom = async (values: z.infer<typeof createClassroomSchema>) => {
        const token = localStorage.getItem("access_token");
        if (!token) return toast.error("Not authenticated");

        try {
            const response = await fetch("/api/classrooms/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: values.name,
                    grade_level: values.gradeLevel,
                    school: values.school,
                    description: values.description || "",
                }),
            });

            const data = await response.json().catch(() => null);
            if (response.ok) {
                toast.success("Classroom created successfully!");
                form.reset();
                setIsCreateClassroomOpen(false);
                fetchClassrooms();
            } else {
                toast.error(`Failed: ${data?.detail || response.status}`);
            }
        } catch {
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
                setClassrooms((prev) =>
                    prev.filter((c) => c.id !== deleteClassroomId)
                );
                setDeleteClassroomId(null);
            } else {
                const data = await response.json();
                toast.error(data?.detail || "Failed to delete classroom");
            }
        } catch {
            toast.error("Network error while deleting classroom");
        }
    };

    // ------------------ RENDER ------------------

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-gray-600">
                Loading classrooms...
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-semibold">My Classrooms</h1>
                <Button
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    onClick={() => setIsCreateClassroomOpen(true)}
                >
                    Create Classroom
                </Button>
            </div>

            {classrooms.length === 0 ? (
                <p className="text-gray-500">No classrooms found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classrooms.map((classroom) => (
                        <Card
                            key={classroom.id}
                            className="p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRandomColor(
                                            classroom.id
                                        )} flex items-center justify-center text-white`}
                                    >
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg">{classroom.name}</h3>
                                            <Badge
                                                variant={
                                                    classroom.status === "active"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className={
                                                    classroom.status === "active"
                                                        ? "bg-teal-500 text-white"
                                                        : "bg-gray-200 text-gray-600"
                                                }
                                            >
                                                {classroom.status === "active"
                                                    ? "Active"
                                                    : "Archived"}
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
                    ))}
                </div>
            )}
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
            {/* Edit Modal */}
            <Dialog open={isEditClassroomOpen} onOpenChange={setIsEditClassroomOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Classroom</DialogTitle>
                        <DialogDescription>Update the classroom details</DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form
                            onSubmit={editForm.handleSubmit(handleEditClassroom)}
                            className="space-y-4"
                        >
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Classroom Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Biology 101" {...field} />
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
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
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
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={deleteClassroomId !== null}
                onOpenChange={(open) => !open && setDeleteClassroomId(null)}
            >
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to delete this classroom?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            classroom and remove all associated data.
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
