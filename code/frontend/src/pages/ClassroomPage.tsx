import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Classroom, Student, Enrollment } from './types';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

import 'react-datepicker/dist/react-datepicker.css';

import { toast } from 'sonner';

import {
    Copy,
    Check,
    Calendar,
    Users,
    Activity,
    TrendingUp,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    FlaskConical,
    Leaf,
    Earth,
    Wrench,
    ArrowLeft,
    Search,
    Beaker,
    Cpu,
    ChevronRight,
} from 'lucide-react';

function StudentRow({ student }: { student: Student }) {
    return (
        <TableRow>
            <TableCell>{student.first_name} {student.last_name}</TableCell>
            <TableCell className="text-gray-600">{student.email}</TableCell>
            <TableCell>
            </TableCell>
        </TableRow>
    );
}

export default function ClassroomPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [selectedActivity, setSelectedActivity] = useState('');
    const [dueDate, setDueDate] = useState('');

    const [step, setStep] = useState<'category' | 'activity' | 'date'>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dueTime, setDueTime] = useState({ hour: '11', minute: '59', period: 'PM' });
    const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
    const [dueDateParts, setDueDateParts] = useState({
        month: '',
        day: '',
        year: '',
    });

    const mockClassroom = {
        id: '1',
        name: 'Biology - Period 3',
        code: 'BIO-P3-2024',
        studentCount: 28,
        activeActivities: 5,
        averageCompletion: 78,
        averageScore: 85,
    };

    const mockActivities = [
        { id: 'A1', title: 'Genetics Worksheet', status: 'active', dueDate: '2025-11-10', submitted: 3, total: 5, avgScore: 88 },
        { id: 'A2', title: 'Microscope Lab', status: 'completed', dueDate: '2025-10-31', submitted: 5, total: 5, avgScore: 91 },
        { id: 'A3', title: 'Ecology Poster Project', status: 'active', dueDate: '2025-11-20', submitted: 2, total: 5, avgScore: 79 },
    ];

    useEffect(() => {
        if (!selectedCategory) return;

        fetch(`/api/activities/released/?category=${selectedCategory}`)
            .then((res) => res.json())
            .then((data) => {
                setActivities(data);
            })
            .catch((err) => console.error('Failed to fetch activities', err));
    }, [selectedCategory]);

    const handleAddActivity = () => {
        if (!selectedActivity) {
            toast.error('Please select an activity first');
            return;
        }

        if (!dueDate) {
            toast.error('Please set a valid due date');
            return;
        }

        toast.success(`Added "${selectedActivity}" to this classroom`);
        setSelectedActivity('');
        setShowAddModal(false);
    };

    useEffect(() => {
        const fetchClassroom = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Not authenticated');
                return;
            }

            try {
                setIsLoading(true);
                const res = await fetch(`/api/classrooms/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data: Classroom = await res.json();
                    setClassroom(data);
                } else {
                    toast.error('Failed to fetch classroom');
                }
            } catch {
                toast.error('Network error while loading classroom');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassroom();
    }, [id]);

    useEffect(() => {
        const { year, month, day } = dueDateParts;
        if (year && month && day) {
            const y = year;
            const m = month.toString().padStart(2, '0');
            const d = day.toString().padStart(2, '0');
            setDueDate(`${y}-${m}-${d}`);
        } else {
            setDueDate('');
        }
    }, [dueDateParts]);

    const copyCode = () => {
        if (!classroom) return;
        navigator.clipboard.writeText(classroom.code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const getStatusColor = (status: string) => {
        return status === 'completed'
            ? 'bg-gray-300 text-gray-700'
            : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white';
    };

    const getEngagementColor = (engagement: number) => {
        if (engagement >= 90) return 'text-green-600';
        if (engagement >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600">
                Loading...
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600">
                No classroom found.
            </div>
        );
    }

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setStep('activity');
    };

    const selectedActivityData =
        selectedCategory && selectedActivity
            ? activities.find((a: any) => String(a.activity_id || a.id) === selectedActivity)
            : null;

    const handleActivitySelect = (activityId: string) => {
        setSelectedActivity(activityId);
        setStep('date');
    };

    const fetchCategoryCounts = async () => {
        try {
            const res = await fetch('/api/activities/counts/');
            if (res.ok) {
                const data = await res.json();
                setCategoryCounts(data);
            } else {
            }
        } catch (err) {
        }
    };

    const handleOpenAddModal = () => {
        setShowAddModal(true);
        setStep('category');
        setSelectedCategory(null);
        setSelectedActivity('');
        setSearchQuery('');
        setDueDate('');
        setDueDateParts({ month: '', day: '', year: '' });
        fetchCategoryCounts();
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 py-8">
            <div className="max-w-[95%] mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <Card className="p-6 bg-white/80 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl mb-2">{classroom.name}</h1>
                                <div className="flex items-center gap-2">
                                    <code className="px-3 py-1 bg-gray-100 rounded text-sm">{classroom.code}</code>
                                    <Button size="sm" variant="ghost" onClick={copyCode}>
                                        {copiedCode ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <Button
                                onClick={handleOpenAddModal}
                                className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700"
                            >
                                Add Activity
                            </Button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Students</p>
                                    <p className="text-2xl">{classroom.enrollments.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Active Activities</p>
                                    <p className="text-2xl">{mockClassroom.activeActivities}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Avg Completion</p>
                                    <p className="text-2xl">{mockClassroom.averageCompletion}%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-lg">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Avg Score</p>
                                    <p className="text-2xl">{mockClassroom.averageScore}%</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="activities" className="space-y-4">
                    <TabsList className="bg-white/80 backdrop-blur-sm">
                        <TabsTrigger value="activities">Activities</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    {/* Activities */}
                    <TabsContent value="activities">
                        <div className="space-y-3">
                            {mockActivities.map((activity) => {
                                return (
                                    <Card
                                        key={activity.id}
                                        // -------------------------------------------------------------------------------------
                                        // will change later onClick={() => navigate(`/activities/${activity.id}`)}
                                        // -------------------------------------------------------------------------------------
                                        onClick={() => navigate(`/dashboard/activities`)}
                                        className="p-5 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <FileText className="w-5 h-5 text-teal-600" />
                                                    <h3 className="text-lg">{activity.title}</h3>
                                                    <Badge
                                                        variant={activity.status === 'completed' ? 'secondary' : 'default'}
                                                        className={getStatusColor(activity.status)}
                                                    >
                                                        {activity.status === 'completed' ? 'Completed' : 'Active'}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Due: {new Date(activity.dueDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Submitted: {activity.submitted}/{activity.total}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4" />
                                                        Avg Score: {activity.avgScore}%
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Progress
                                                        value={(activity.submitted / activity.total) * 100}
                                                        className="flex-1 h-2"
                                                    />
                                                    <span className="text-sm text-gray-600 min-w-[60px]">
                                                        {Math.round((activity.submitted / activity.total) * 100)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {activity.status === 'active' && activity.submitted < activity.total && (
                                                <div className="ml-4 flex items-center gap-2 text-orange-600">
                                                    <Clock className="w-5 h-5" />
                                                    <span className="text-sm">
                                                        {activity.total - activity.submitted} pending
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </TabsContent>

                    {/* Students */}
                    <TabsContent value="students">
                        <Card className="bg-white/80 backdrop-blur-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classroom.enrollments.map((enrollment: Enrollment) => {
                                        const student = enrollment.student;
                                        return (
                                            <TableRow key={enrollment.id}>
                                                <TableCell>{`${student.first_name} ${student.last_name}`.trim() || student.username}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                {/* add other metrics when available */}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>

                            </Table>
                        </Card>
                    </TabsContent>

                    {/* Analytics */}
                    <TabsContent value="analytics">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-6 bg-white/80 backdrop-blur-sm">
                                <h3 className="text-lg mb-4">Performance Overview</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">Overall Completion Rate</span>
                                            <span>{mockClassroom.averageCompletion}%</span>
                                        </div>
                                        <Progress value={mockClassroom.averageCompletion} className="h-3" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">Average Score</span>
                                            <span>{mockClassroom.averageScore}%</span>
                                        </div>
                                        <Progress value={mockClassroom.averageScore} className="h-3" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">Student Engagement</span>
                                            <span>86%</span>
                                        </div>
                                        <Progress value={86} className="h-3" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-white/80 backdrop-blur-sm">
                                <h3 className="text-lg mb-4">Recent Trends</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            <span>Completion Rate</span>
                                        </div>
                                        <span className="text-green-600">+5%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            <span>Average Score</span>
                                        </div>
                                        <span className="text-green-600">+3%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-orange-600" />
                                            <span>Pending Submissions</span>
                                        </div>
                                        <span className="text-orange-600">12</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add Activity Dialog */}
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-none backdrop-blur-0">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Add Activity to Classroom</DialogTitle>
                            <DialogDescription className="py-4">
                                {step === 'category' && 'Choose a science category to explore activities'}
                                {step === 'activity' && 'Select an activity from the library'}
                                {step === 'date' && 'Set a due date for this activity'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            {/* Step 1: Category Selection */}
                            {step === 'category' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        {
                                            id: 'PS',
                                            name: 'Physical Science',
                                            icon: FlaskConical,
                                            bg: 'from-orange-50 to-yellow-50',
                                            color: 'from-orange-400 to-yellow-400',
                                        },
                                        {
                                            id: 'LS',
                                            name: 'Life Science',
                                            icon: Leaf,
                                            bg: 'from-green-50 to-emerald-50',
                                            color: 'from-green-400 to-emerald-400',
                                        },
                                        {
                                            id: 'ESS',
                                            name: 'Earth & Space Science',
                                            icon: Earth,
                                            bg: 'from-blue-50 to-sky-50',
                                            color: 'from-blue-400 to-sky-400',
                                        },
                                        {
                                            id: 'ETS',
                                            name: 'Engineering & Tech',
                                            icon: Wrench,
                                            bg: 'from-purple-50 to-indigo-50',
                                            color: 'from-purple-400 to-indigo-400',
                                        },
                                    ].map((category) => {
                                        const Icon = category.icon;
                                        return (
                                            <Card
                                                key={category.id}
                                                className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${selectedCategory === category.id
                                                    ? 'border-teal-500 bg-gradient-to-br ' + category.bg
                                                    : 'border-transparent bg-white'
                                                    }`}
                                                onClick={() => handleCategorySelect(category.id)}
                                            >
                                                <div className="flex flex-col items-center text-center space-y-3">
                                                    <div
                                                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}
                                                    >
                                                        <Icon className="w-8 h-8 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{category.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {categoryCounts[category.id] ?? 0} activities
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Step 2: Activity Selection */}
                            {step === 'activity' && selectedCategory && (
                                <div className="space-y-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setStep('category')}
                                        className="mb-2"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to categories
                                    </Button>

                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {activities
                                            .filter((a) => a.category === selectedCategory)
                                            .filter((a) =>
                                                a.activity_title.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((activity) => (
                                                <Card
                                                    key={activity.activity_id || activity.id}
                                                    className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${selectedActivity === String(activity.activity_id || activity.id)
                                                        ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50'
                                                        : 'border-transparent bg-white hover:bg-gray-50'
                                                        }`}
                                                    onClick={() =>
                                                        handleActivitySelect(String(activity.activity_id || activity.id))
                                                    }
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium mb-1">
                                                                {activity.activity_title}
                                                            </h4>
                                                            <div className="flex gap-2">
                                                                {activity.pe && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs bg-white"
                                                                    >
                                                                        {activity.pe}
                                                                    </Badge>
                                                                )}
                                                                {activity.lp && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs bg-white"
                                                                    >
                                                                        Learning Performance {activity.lp}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {selectedActivity ===
                                                            String(activity.activity_id || activity.id) && (
                                                                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 ml-3" />
                                                            )}
                                                    </div>
                                                </Card>
                                            ))}
                                    </div>

                                    {activities.filter((a) => a.category === selectedCategory).length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No activities found matching your search
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Date Selection */}
                            {step === 'date' && selectedActivityData && (
                                <div className="space-y-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setStep('activity')}
                                        className="mb-2"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to activities
                                    </Button>

                                    <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium mb-1">
                                                    {selectedActivityData.activity_title}
                                                </h4>
                                                <div className="flex gap-2">
                                                    {selectedActivityData.pe && (
                                                        <Badge variant="outline" className="text-xs bg-white">
                                                            {selectedActivityData.pe}
                                                        </Badge>
                                                    )}
                                                    {selectedActivityData.lp && (
                                                        <Badge variant="outline" className="text-xs bg-white">
                                                            Grade {selectedActivityData.lp}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                        </div>
                                    </Card>

                                    {/* Date & Time Picker */}
                                    <div className="space-y-6">
                                        <label className="text-sm font-medium block">
                                            Select Due Date &amp; Time
                                        </label>

                                        <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/50 rounded-xl p-6 border border-teal-100 isolate">
                                            {/* Date Grid */}
                                            <div className="mb-6">
                                                <p className="text-xs uppercase tracking-wider text-teal-600 mb-3">
                                                    Date
                                                </p>
                                                <div className="grid grid-cols-3 gap-4 items-end">
                                                    {[
                                                        { id: 'month', label: 'Month', max: 12, placeholder: 'MM' },
                                                        { id: 'day', label: 'Day', max: 31, placeholder: 'DD' },
                                                        { id: 'year', label: 'Year', max: 9999, placeholder: 'YYYY' },
                                                    ].map((field) => (
                                                        <div key={field.id} className="space-y-2">
                                                            <label className="text-xs text-gray-500 block text-center">
                                                                {field.label}
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                value={dueDateParts[field.id]}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (!/^\d*$/.test(val)) return;
                                                                    setDueDateParts((prev) => ({
                                                                        ...prev,
                                                                        [field.id]: val,
                                                                    }));
                                                                }}
                                                                onBlur={(e) => {
                                                                    const num = parseInt(e.target.value, 10);
                                                                    if (!isNaN(num)) {
                                                                        let val = num;
                                                                        if (field.id === 'month')
                                                                            val = Math.min(12, Math.max(1, num));
                                                                        if (field.id === 'day')
                                                                            val = Math.min(31, Math.max(1, num));
                                                                        if (field.id === 'year') {
                                                                            const minYear = new Date().getFullYear();
                                                                            const maxYear = minYear + 10;
                                                                            val = Math.min(
                                                                                maxYear,
                                                                                Math.max(minYear, num)
                                                                            );
                                                                        }
                                                                        setDueDateParts((prev) => ({
                                                                            ...prev,
                                                                            [field.id]: val.toString(),
                                                                        }));
                                                                    }
                                                                }}
                                                                placeholder={field.placeholder}
                                                                className="text-center text-2xl h-16 bg-white border-2 border-teal-200 focus:border-teal-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Time Grid */}
                                            <div>
                                                <p className="text-xs uppercase tracking-wider text-teal-600 mb-3">
                                                    Time
                                                </p>
                                                <div className="grid grid-cols-3 gap-4 items-end">
                                                    {/* Hour */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-gray-500 block text-center">
                                                            Hour
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            value={dueTime.hour}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (!/^\d*$/.test(val)) return;
                                                                setDueTime((prev) => ({ ...prev, hour: val }));
                                                            }}
                                                            onBlur={(e) => {
                                                                const num = parseInt(e.target.value, 10);
                                                                if (!isNaN(num)) {
                                                                    const val = Math.min(12, Math.max(1, num));
                                                                    setDueTime((prev) => ({
                                                                        ...prev,
                                                                        hour: val.toString(),
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder="HH"
                                                            className="text-center text-2xl h-16 bg-white border-2 border-cyan-200 focus:border-cyan-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        />
                                                    </div>

                                                    {/* Minute */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-gray-500 block text-center">
                                                            Minute
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            value={dueTime.minute}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (!/^\d*$/.test(val)) return;
                                                                setDueTime((prev) => ({ ...prev, minute: val }));
                                                            }}
                                                            onBlur={(e) => {
                                                                const num = parseInt(e.target.value, 10);
                                                                if (!isNaN(num)) {
                                                                    const val = Math.min(59, Math.max(0, num));
                                                                    setDueTime((prev) => ({
                                                                        ...prev,
                                                                        minute: val
                                                                            .toString()
                                                                            .padStart(2, '0'),
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder="MM"
                                                            className="text-center text-2xl h-16 bg-white border-2 border-cyan-200 focus:border-cyan-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                        />
                                                    </div>

                                                    {/* AM/PM */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-gray-500 block text-center">
                                                            Period
                                                        </label>
                                                        <div className="flex gap-2 items-stretch">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDueTime((prev) => ({
                                                                        ...prev,
                                                                        period: 'AM',
                                                                    }))
                                                                }
                                                                className={`flex-1 h-16 rounded-lg transition-all flex items-center justify-center ${dueTime.period === 'AM'
                                                                    ? 'bg-teal-600 text-white scale-105 shadow-md'
                                                                    : 'bg-white border-2 border-cyan-200 text-gray-600 hover:border-cyan-300'
                                                                    }`}
                                                            >
                                                                AM
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDueTime((prev) => ({
                                                                        ...prev,
                                                                        period: 'PM',
                                                                    }))
                                                                }
                                                                className={`flex-1 h-16 rounded-lg transition-all flex items-center justify-center ${dueTime.period === 'PM'
                                                                    ? 'bg-teal-600 text-white scale-105 shadow-md'
                                                                    : 'bg-white border-2 border-cyan-200 text-gray-600 hover:border-cyan-300'
                                                                    }`}
                                                            >
                                                                PM
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        {dueDateParts.month && dueDateParts.day && dueDateParts.year && (
                                            <div className="p-4 bg-teal-600 text-white rounded-lg shadow-md isolate">
                                                <div className="flex items-center justify-center gap-3 mb-2">
                                                    <Clock className="w-5 h-5" />
                                                    <p className="text-sm opacity-90">Assignment Due</p>
                                                </div>
                                                <p className="font-medium text-xl text-center">
                                                    {new Date(
                                                        parseInt(dueDateParts.year, 10),
                                                        parseInt(dueDateParts.month, 10) - 1,
                                                        parseInt(dueDateParts.day, 10)
                                                    ).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-center text-lg mt-1 opacity-95">
                                                    at {dueTime.hour}:{dueTime.minute} {dueTime.period}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedActivity('');
                                    setDueDate('');
                                    setShowAddModal(false);
                                    setDueDateParts({ month: '', day: '', year: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            {step === 'date' && (
                                <Button
                                    onClick={handleAddActivity}
                                    disabled={!dueDate}
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                >
                                    Add to Classroom
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
