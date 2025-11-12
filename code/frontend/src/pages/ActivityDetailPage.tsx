import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Calendar, Users, MessageSquare, Send, Bot, User as UserIcon, Edit3 } from 'lucide-react';

interface StudentSubmission {
    id: string;
    studentName: string;
    email: string;
    status: 'submitted' | 'pending' | 'graded';
    submittedAt?: string;
    answer: string;
    aiScore: number;
    aiFeedback: string;
    teacherScore?: number;
    teacherFeedback?: string;
    similarGroup?: number;
}

const mockActivity = {
    id: '1',
    title: 'Photosynthesis Lab Report (This is Mock Page. I am working on it now.)',
    description: 'Analyze the process of photosynthesis and explain how plants convert light energy into chemical energy.',
    dueDate: '2025-11-10',
    totalPoints: 100,
    classroomName: 'Biology - Period 3',
};

const mockSubmissions: StudentSubmission[] = [
    {
        id: '1',
        studentName: 'Emma Johnson',
        email: 'emma.j@school.edu',
        status: 'graded',
        submittedAt: '2025-11-08 14:30',
        answer: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar. It occurs in the chloroplasts of plant cells, specifically in structures called thylakoids. The process has two main stages: light-dependent reactions and the Calvin cycle.',
        aiScore: 92,
        aiFeedback: 'Excellent explanation of photosynthesis! You correctly identified the key components and mentioned both stages. Consider adding more detail about what happens in each stage.',
        teacherScore: 95,
        teacherFeedback: 'Great work, Emma! Your explanation is clear and accurate. I added a few points for your excellent lab methodology.',
        similarGroup: 1,
    },
    {
        id: '2',
        studentName: 'Liam Smith',
        email: 'liam.s@school.edu',
        status: 'graded',
        submittedAt: '2025-11-08 16:45',
        answer: 'Plants make food using sunlight through photosynthesis. The chlorophyll in leaves captures light energy and converts CO2 and H2O into glucose (C6H12O6) and releases oxygen. This happens in chloroplasts and involves light reactions and dark reactions (Calvin cycle).',
        aiScore: 88,
        aiFeedback: 'Good understanding of the basic concept. You mentioned the key molecules and products. Try to explain more about the mechanism of each stage.',
        teacherScore: 88,
        teacherFeedback: 'Well done! Your chemical equation is accurate.',
        similarGroup: 1,
    },
    {
        id: '3',
        studentName: 'Olivia Brown',
        email: 'olivia.b@school.edu',
        status: 'submitted',
        submittedAt: '2025-11-09 10:20',
        answer: 'Photosynthesis converts light energy to chemical energy. Plants take in CO2 from air and water from soil. Chlorophyll absorbs sunlight in the leaves. The light energy splits water molecules releasing oxygen as waste product and creates ATP and NADPH which power the Calvin cycle to make glucose.',
        aiScore: 85,
        aiFeedback: 'Very good! You understand the energy conversion and the role of ATP and NADPH. Excellent mention of water splitting. Consider organizing your answer into the two main stages more clearly.',
        similarGroup: 2,
    },
    {
        id: '4',
        studentName: 'Noah Davis',
        email: 'noah.d@school.edu',
        status: 'submitted',
        submittedAt: '2025-11-09 09:15',
        answer: 'In photosynthesis, light energy is captured by chlorophyll molecules in the thylakoid membranes. During light reactions, water is split producing oxygen, ATP, and NADPH. The Calvin cycle then uses ATP and NADPH to fix CO2 into organic molecules like glucose. This process is crucial for life on Earth as it produces oxygen and organic compounds.',
        aiScore: 95,
        aiFeedback: 'Excellent comprehensive answer! You clearly explained both stages and mentioned the importance to life on Earth. Outstanding work!',
        similarGroup: 2,
    },
    {
        id: '5',
        studentName: 'Ava Wilson',
        email: 'ava.w@school.edu',
        status: 'pending',
        answer: '',
        aiScore: 0,
        aiFeedback: '',
    },
    {
        id: '6',
        studentName: 'Ethan Martinez',
        email: 'ethan.m@school.edu',
        status: 'submitted',
        submittedAt: '2025-11-09 13:00',
        answer: 'Photosynthesis is how plants make energy from sunlight. It happens in leaves. Plants need sunlight, water, and CO2. They produce oxygen and glucose.',
        aiScore: 65,
        aiFeedback: 'You have the basic idea, but your answer needs more detail. Explain WHERE in the plant cell this occurs, and describe the TWO main stages of photosynthesis. What are the light-dependent and light-independent reactions?',
        similarGroup: 3,
    },
];

const similarGroups = [
    {
        id: 1,
        name: 'High Understanding Group',
        count: 2,
        avgScore: 90,
        keyThemes: ['Detailed stages explanation', 'Mentioned chloroplasts', 'Light and Calvin cycle'],
        studentIds: ['1', '2'],
    },
    {
        id: 2,
        name: 'Advanced Comprehension',
        count: 2,
        avgScore: 90,
        keyThemes: ['ATP and NADPH mentioned', 'Energy conversion focus', 'Water splitting'],
        studentIds: ['3', '4'],
    },
    {
        id: 3,
        name: 'Basic Understanding',
        count: 1,
        avgScore: 65,
        keyThemes: ['Surface-level explanation', 'Missing key details', 'Needs elaboration'],
        studentIds: ['6'],
    },
];

export default function ActivityDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [teacherScore, setTeacherScore] = useState('');
    const [teacherFeedback, setTeacherFeedback] = useState('');

    const submittedCount = mockSubmissions.filter(s => s.status !== 'pending').length;
    const gradedCount = mockSubmissions.filter(s => s.status === 'graded').length;
    const avgAiScore = Math.round(
        mockSubmissions.filter(s => s.status !== 'pending').reduce((acc, s) => acc + s.aiScore, 0) / submittedCount
    );

    const handleStudentClick = (student: StudentSubmission) => {
        setSelectedStudent(student);
        setEditMode(false);
        setTeacherScore(student.teacherScore?.toString() || student.aiScore.toString());
        setTeacherFeedback(student.teacherFeedback || student.aiFeedback);
    };

    const handleSaveFeedback = () => {
        console.log('Saving feedback:', { teacherScore, teacherFeedback });
        setEditMode(false);
        if (selectedStudent) {
            selectedStudent.teacherScore = parseInt(teacherScore);
            selectedStudent.teacherFeedback = teacherFeedback;
            selectedStudent.status = 'graded';
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'graded') {
            return <Badge className="bg-green-500 text-white">Graded</Badge>;
        } else if (status === 'submitted') {
            return <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">Needs Grading</Badge>;
        } else {
            return <Badge variant="secondary" className="bg-gray-200 text-gray-600">Pending</Badge>;
        }
    };

    const startGroupDiscussion = (groupId: number) => {
        console.log('Starting discussion for group:', groupId);
        alert(`Discussion session created for ${similarGroups.find(g => g.id === groupId)?.name}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4 hover:bg-white/50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Classroom
                    </Button>

                    <Card className="p-6 bg-white/80 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="text-sm text-gray-600 mb-1">{mockActivity.classroomName}</div>
                                <h1 className="text-3xl mb-2">{mockActivity.title}</h1>
                                <p className="text-gray-600 mb-4">{mockActivity.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Due: {new Date(mockActivity.dueDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {submittedCount}/{mockSubmissions.length} submitted
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 mb-2">
                            <span>Activity ID: {id}</span>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm">Submitted</span>
                                </div>
                                <p className="text-2xl">{submittedCount}/{mockSubmissions.length}</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Edit3 className="w-4 h-4" />
                                    <span className="text-sm">Graded</span>
                                </div>
                                <p className="text-2xl">{gradedCount}/{submittedCount}</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Bot className="w-4 h-4" />
                                    <span className="text-sm">Avg AI Score</span>
                                </div>
                                <p className="text-2xl">{avgAiScore}%</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">Pending</span>
                                </div>
                                <p className="text-2xl">{mockSubmissions.length - submittedCount}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Student Submissions Table */}
                <Card className="mb-6 bg-white/80 backdrop-blur-sm">
                    <div className="p-6">
                        <h2 className="text-xl mb-4">Student Submissions</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted At</TableHead>
                                    <TableHead>AI Score</TableHead>
                                    <TableHead>Teacher Score</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockSubmissions.map((submission) => (
                                    <TableRow
                                        key={submission.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => submission.status !== 'pending' && handleStudentClick(submission)}
                                    >
                                        <TableCell>
                                            <div>
                                                <div>{submission.studentName}</div>
                                                <div className="text-sm text-gray-500">{submission.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                        <TableCell className="text-gray-600">
                                            {submission.submittedAt || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {submission.status !== 'pending' ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50">
                                                        {submission.aiScore}%
                                                    </Badge>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {submission.teacherScore ? (
                                                <Badge variant="outline" className="bg-gradient-to-r from-teal-50 to-cyan-50">
                                                    {submission.teacherScore}%
                                                </Badge>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {submission.status !== 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStudentClick(submission);
                                                    }}
                                                >
                                                    {submission.status === 'graded' ? 'View' : 'Grade'}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Similar Responses Groups */}
                <Card className="bg-white/80 backdrop-blur-sm">
                    <div className="p-6">
                        <h2 className="text-xl mb-4">Similar Response Groups</h2>
                        <div className="space-y-3">
                            {similarGroups.map((group) => (
                                <Card key={group.id} className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg">{group.name}</h3>
                                                <Badge variant="outline">{group.count} students</Badge>
                                                <Badge variant="outline" className="bg-white">Avg: {group.avgScore}%</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {group.keyThemes.map((theme, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-white rounded text-sm text-gray-700">
                                                        {theme}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Students: {group.studentIds.map(id => mockSubmissions.find(s => s.id === id)?.studentName).join(', ')}
                                            </div>
                                        </div>
                                        <Button
                                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                                            onClick={() => startGroupDiscussion(group.id)}
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Start Discussion
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Student Submission Sheet */}
            <Sheet open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    {selectedStudent && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedStudent.studentName}'s Submission</SheetTitle>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                {/* Student Answer */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserIcon className="w-4 h-4 text-gray-600" />
                                        <h3 className="text-sm text-gray-600">Student Answer</h3>
                                    </div>
                                    <Card className="p-4 bg-gray-50">
                                        <p>{selectedStudent.answer}</p>
                                    </Card>
                                </div>

                                {/* AI Feedback */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot className="w-4 h-4 text-purple-600" />
                                        <h3 className="text-sm text-gray-600">AI Evaluation</h3>
                                    </div>
                                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                                        <div className="mb-2">
                                            <Badge variant="outline" className="bg-white">
                                                AI Score: {selectedStudent.aiScore}%
                                            </Badge>
                                        </div>
                                        <p className="text-sm">{selectedStudent.aiFeedback}</p>
                                    </Card>
                                </div>

                                {/* Teacher Feedback Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Edit3 className="w-4 h-4 text-teal-600" />
                                            <h3 className="text-sm text-gray-600">Teacher Evaluation</h3>
                                        </div>
                                        {!editMode && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditMode(true)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>

                                    <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50">
                                        {editMode ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm text-gray-600 mb-2 block">Score (0-100)</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={teacherScore}
                                                        onChange={(e) => setTeacherScore(e.target.value)}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-600 mb-2 block">Feedback</label>
                                                    <Textarea
                                                        value={teacherFeedback}
                                                        onChange={(e) => setTeacherFeedback(e.target.value)}
                                                        rows={4}
                                                        className="bg-white"
                                                        placeholder="Enter your feedback for the student..."
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                                                        onClick={handleSaveFeedback}
                                                    >
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Save & Send to Student
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setEditMode(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="mb-2">
                                                    <Badge variant="outline" className="bg-white">
                                                        Teacher Score: {selectedStudent.teacherScore || selectedStudent.aiScore}%
                                                    </Badge>
                                                </div>
                                                <p className="text-sm">
                                                    {selectedStudent.teacherFeedback || selectedStudent.aiFeedback}
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                </div>

                                {/* Similar Group Info */}
                                {selectedStudent.similarGroup && (
                                    <div>
                                        <h3 className="text-sm text-gray-600 mb-2">Group Classification</h3>
                                        <Card className="p-3 bg-gradient-to-r from-cyan-50 to-teal-50">
                                            <p className="text-sm">
                                                This student is in: <span className="font-medium">
                                                    {similarGroups.find(g => g.id === selectedStudent.similarGroup)?.name}
                                                </span>
                                            </p>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
