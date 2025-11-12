import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Plus, FlaskConical, Leaf, Earth, Wrench } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

type ActivitySummary = {
    activity_id: string;
    activity_title: string | null;
    pe: string | null;
    lp: string | null;
    lp_text: string | null;
};

type ActivityDetail = ActivitySummary & {
    activity_task?: string | null;
    media?: { url: string; description: string; media_type: string }[];
    questions?: string[];
};

export default function ActivityDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = (user?.role || "").toLowerCase();
    const isTeacher = role === "teacher";
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<ActivitySummary[]>([]);
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<ActivitySummary | null>(null);
    const [selectedClassroom, setSelectedClassroom] = useState<string>("");
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // preview
    const [previewActivity, setPreviewActivity] = useState<ActivityDetail | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch("/api/activities/");
                if (!res.ok) throw new Error("Failed to fetch activities");
                const data = await res.json();
                if (Array.isArray(data)) {
                    const mapped = data
                        .map(
                            (item: any): ActivitySummary => ({
                                activity_id:
                                    typeof item.activity_id === "string" ? item.activity_id : "",
                                activity_title:
                                    typeof item.activity_title === "string"
                                        ? item.activity_title
                                        : null,
                                pe: typeof item.pe === "string" ? item.pe : null,
                                lp: typeof item.lp === "string" ? item.lp : null,
                                lp_text: typeof item.lp_text === "string" ? item.lp_text : null,
                            }),
                        )
                        .filter((item) => item.activity_id !== "");
                    setActivities(mapped);
                } else {
                    setActivities([]);
                }
            } catch (err) {
                toast.error("Failed to load activities");
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    // show classroom selection (only active)
    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) throw new Error("No token found");

                const res = await fetch("/api/classrooms/", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch classrooms");
                const data = await res.json();

                const activeClassrooms = data.filter((c: any) => c.status === "active");
                setClassrooms(activeClassrooms);
            } catch (err) {
                toast.error("Failed to load classrooms");
            }
        };

        fetchClassrooms();
    }, []);

    const handleAddToClassroom = () => {
        if (!isTeacher) {
            setSelectedActivity(null);
            setSelectedClassroom("");
            return;
        }

        if (!selectedActivity) {
            toast.error("No activity selected");
            return;
        }

        if (!selectedClassroom) {
            toast.error("Please select a classroom");
            return;
        }

        const classroom = classrooms.find(
            (c) => c.id.toString() === selectedClassroom
        );
        toast.success("Activity added successfully!", {
            description: `${selectedActivity?.activity_title} has been added to ${classroom?.name}`,
        });

        setSelectedActivity(null);
        setSelectedClassroom("");
    };

    const handleFilterClick = (filter: string) => {
        setSelectedFilter(selectedFilter === filter ? null : filter);
    };

    const handlePreview = async (activity: ActivitySummary) => {
        setPreviewActivity(activity);
        setPreviewLoading(true);
        try {
            const res = await fetch(`/api/activities/${activity.activity_id}/`);
            if (!res.ok) throw new Error("Failed to fetch activity preview");
            const data = await res.json();
            setPreviewActivity((prev) => ({
                ...(prev ?? activity),
                ...data,
            }));
        } catch (err) {
            toast.error("Failed to load preview");
        } finally {
            setPreviewLoading(false);
        }
    };

    const filteredActivities = selectedFilter
        ? activities.filter((a) => a.pe?.includes(selectedFilter))
        : activities;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl mb-2">Science Activities</h1>
                    <p className="text-gray-600">
                        {isTeacher
                            ? "Browse and assign activities to your classrooms"
                            : "Browse activities and jump into your assignments"}
                    </p>
                </div>
                <Button
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    onClick={() => setSelectedFilter(null)}
                >
                    Show All
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Physical Science */}
                <Card
                    className={`p-4 cursor-pointer hover:shadow-md transition-all ${selectedFilter === "PS" ? "ring-2 ring-blue-500" : ""
                        }`}
                    onClick={() => handleFilterClick("PS")}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white">
                            <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">
                                Physical Science (PS)
                            </div>
                            <div className="text-2xl">
                                {
                                    activities.filter((a) =>
                                        a.pe?.includes("PS")
                                    ).length
                                }
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Life Science */}
                <Card
                    className={`p-4 cursor-pointer hover:shadow-md transition-all ${selectedFilter === "LS" ? "ring-2 ring-green-500" : ""
                        }`}
                    onClick={() => handleFilterClick("LS")}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white">
                            <Leaf className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">
                                Life Science (LS)
                            </div>
                            <div className="text-2xl">
                                {
                                    activities.filter((a) =>
                                        a.pe?.includes("LS")
                                    ).length
                                }
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Earth & Space Science */}
                <Card
                    className={`p-4 cursor-pointer hover:shadow-md transition-all ${selectedFilter === "ESS"
                        ? "ring-2 ring-yellow-500"
                        : ""
                        }`}
                    onClick={() => handleFilterClick("ESS")}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-sky-400 flex items-center justify-center text-white">
                            <Earth className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">
                                Earth & Space Science (ESS)
                            </div>
                            <div className="text-2xl">
                                {
                                    activities.filter((a) =>
                                        a.pe?.includes("ESS")
                                    ).length
                                }
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Engineering & Tech */}
                <Card
                    className={`p-4 cursor-pointer hover:shadow-md transition-all ${selectedFilter === "ETS"
                        ? "ring-2 ring-purple-500"
                        : ""
                        }`}
                    onClick={() => handleFilterClick("ETS")}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">
                                Engineering & Tech (ETS)
                            </div>
                            <div className="text-2xl">
                                {
                                    activities.filter((a) =>
                                        a.pe?.includes("ETS")
                                    ).length
                                }
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Activities Grid */}
            <div>
                {loading ? (
                    <div className="col-span-3 flex justify-center py-10 text-gray-500">
                        Loading activities...
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activities found.</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredActivities.map((activity) => (
                            <Card
                                key={activity.activity_id}
                                className="group relative overflow-hidden p-6 hover:shadow-lg transition-all"
                            >
                                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-teal-400 to-cyan-600" />

                                <h3 className="mb-3 line-clamp-2 min-h-[3rem] group-hover:text-teal-600 transition-colors">
                                    {activity.activity_title}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                                        >
                                            PE
                                        </Badge>
                                        <p className="text-sm text-gray-600 flex-1">
                                            {activity.pe}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200"
                                        >
                                            LP
                                        </Badge>
                                        <p className="text-sm text-gray-600 flex-1">
                                            {activity.lp}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-3 mb-4 min-h-[4rem]">
                                    {activity.lp_text}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handlePreview(activity)}
                                    >
                                        Preview
                                    </Button>
                                    {isTeacher ? (
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                            onClick={() => setSelectedActivity(activity)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                            asChild
                                        >
                                            <Link to={`/assessment/${activity.activity_id}`}>
                                                Start
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add to Classroom Modal */}
            {isTeacher && (
                <Dialog
                    open={!!selectedActivity}
                    onOpenChange={() => setSelectedActivity(null)}
                >
                    <DialogContent className="sm:max-w-[500px] bg-white">
                        <DialogHeader>
                            <DialogTitle>Add Activity to Classroom</DialogTitle>
                            <DialogDescription>
                                Select a classroom to assign this activity to
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="classroom"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Classroom
                                </Label>
                                <Select
                                    value={selectedClassroom}
                                    onValueChange={setSelectedClassroom}
                                >
                                    <SelectTrigger
                                        id="classroom"
                                        className="bg-white"
                                    >
                                        <SelectValue placeholder="Choose a classroom" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {classrooms.map((classroom) => (
                                            <SelectItem
                                                key={classroom.id}
                                                value={classroom.id.toString()}
                                            >
                                                {classroom.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedActivity(null);
                                    setSelectedClassroom("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddToClassroom}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                            >
                                Add to Classroom
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Preview Modal */}
            <Dialog
                open={!!previewActivity}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewLoading(false);
                        setPreviewActivity(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader className="border-b border-slate-200 pb-4 mb-6">
                        <DialogTitle className="text-2xl font-semibold text-slate-900">
                            Activity Preview
                        </DialogTitle>
                        <DialogDescription className="text-slate-600">
                            Preview the activity questions and reference materials
                        </DialogDescription>
                    </DialogHeader>

                    {previewLoading ? (
                        <div className="py-10 text-center text-gray-500">Loading preview...</div>
                    ) : previewActivity ? (
                        <div className="w-full px-8 py-6 text-slate-800">
                            {/* Title */}
                            <section className="mb-10 text-left">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                                    {previewActivity.activity_title}
                                </h1>
                                <p className="text-slate-700 leading-relaxed max-w-3xl">
                                    {previewActivity.activity_task}
                                </p>
                            </section>

                            {/* Reference Media */}
                            {previewActivity.media && previewActivity.media.length > 0 && (
                                <section className="mb-10">
                                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                                        Reference Media
                                    </h2>
                                    <div className="mt-4 grid grid-cols-1 gap-6">
                                        {previewActivity.media.map((item: any, idx: number) => {
                                            const mediaUrl = resolveMediaUrl(item.url);
                                            return (
                                                <figure
                                                    key={idx}
                                                    className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                                                >
                                                    {item.media_type === "image" ? (
                                                        <img
                                                            src={mediaUrl}
                                                            alt={item.description || `reference ${idx + 1}`}
                                                            className="w-full h-auto object-contain"
                                                        />
                                                    ) : (
                                                        <video
                                                            controls
                                                            className="block w-full rounded-lg object-contain"
                                                        >
                                                            <source src={mediaUrl} type="video/mp4" />
                                                        </video>
                                                    )}
                                                    {item.description && (
                                                        <figcaption className="p-3 text-sm text-slate-600 bg-slate-50 border-t border-slate-100">
                                                            {item.description}
                                                        </figcaption>
                                                    )}
                                                </figure>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}


                            {/* Questions */}
                            {previewActivity.questions && previewActivity.questions.length > 0 && (
                                <section className="space-y-6 mb-10">
                                    {previewActivity.questions.map((q: string, index: number) => (
                                        <div
                                            key={index}
                                            className="border-l-4 border-teal-500 bg-white p-4 rounded-md shadow-sm"
                                        >
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                                Question {index + 1}
                                            </h3>
                                            <p className="text-slate-700 leading-relaxed">{q}</p>
                                        </div>
                                    ))}
                                </section>
                            )}

                            {/* Footer */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between">
                                <Button
                                    variant="outline"
                                    className="hover:bg-slate-100"
                                    onClick={() => setPreviewActivity(null)}
                                >
                                    Close Preview
                                </Button>
                                {!isTeacher && (
                                    <Button
                                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                        onClick={() => {
                                            if (!previewActivity?.activity_id) return;
                                            const targetId = previewActivity.activity_id;
                                            setPreviewActivity(null);
                                            navigate(`/assessment/${targetId}`);
                                        }}
                                    >
                                        Start Activity
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-500">
                            No preview data found.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
