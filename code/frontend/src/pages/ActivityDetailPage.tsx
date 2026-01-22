import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { ArrowLeft, CheckCircle2, Clock, Calendar, Users, MessageSquare, Send, Bot, User as UserIcon, Edit3, RefreshCw, Loader2 } from 'lucide-react';
import { gradeSubmission } from '../services/aiService';
import type { ScienceActivitySubmission, ActivityAnswer } from './types';

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

type StudentSubmission = {
    id: number;
    studentId: number;
    studentName: string;
    email: string;
    status: string;
    submittedAt: string | null;
    aiScore: number;
    teacherScore: number | null;
    aiFeedback: string;
    teacherFeedback: string | null;
    answer: string;
    submission: ScienceActivitySubmission | null;
    answers: ActivityAnswer[];
    similarGroup?: number | null;
};

export default function ActivityDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const classroomId = searchParams.get('classroom');
    const activityCode = searchParams.get('activity') || id || '';

    const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [teacherScore, setTeacherScore] = useState('');
    const [teacherFeedback, setTeacherFeedback] = useState('');
    const [isRegrading, setIsRegrading] = useState(false);
    const [regradeError, setRegradeError] = useState<string | null>(null);
    const [activityDetails, setActivityDetails] = useState({
        classroomName: '',
        title: '',
        description: '',
        dueDate: '',
    });
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);

    useEffect(() => {
        if (!classroomId || !activityCode) {
            setSubmissions([]);
            setSubmissionsError('Select an activity from a classroom to view submissions.');
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            setSubmissionsError('Not authenticated');
            return;
        }

        const fetchSubmissions = async () => {
            setLoadingSubmissions(true);
            setSubmissionsError(null);
            try {
                const response = await fetch(
                    `/api/classrooms/${classroomId}/activities/${activityCode}/submissions/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData?.detail || 'Failed to load submissions');
                }
                const data = await response.json();
                const mapped: StudentSubmission[] = (data.submissions || []).map((item: any) => {
                    const student = item.student || {};
                    const submission: ScienceActivitySubmission | null = item.submission || null;
                    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim()
                        || student.username
                        || 'Student';
                    
                    // Get answers from the normalized answers array
                    const answers: ActivityAnswer[] = submission?.answers || [];
                    
                    // Format answers for display
                    let formattedAnswer = '';
                    if (answers.length > 0) {
                        formattedAnswer = answers
                            .sort((a, b) => a.question_number - b.question_number)
                            .map((ans) => `Q${ans.question_number}: ${ans.student_answer || '(no answer)'}`)
                            .join('\n\n');
                    }
                    
                    // Combine AI feedback from all answers
                    const aiFeedbackSummary = answers
                        .filter(a => a.ai_feedback)
                        .map(a => `Q${a.question_number}: ${a.ai_feedback}`)
                        .join('\n\n') || 'No AI feedback available yet.';
                    
                    return {
                        id: item.id,
                        studentId: student.id,
                        studentName: fullName,
                        email: student.email || '',
                        status: submission?.status || item.status || 'pending',
                        submittedAt: submission?.submitted_at || item.submitted_at || null,
                        aiScore: submission?.score ?? 0,
                        teacherScore: item.score ?? submission?.score ?? null,
                        aiFeedback: aiFeedbackSummary,
                        teacherFeedback: submission?.feedback_overview || null,
                        answer: formattedAnswer || 'No answer submitted yet.',
                        submission,
                        answers,
                        similarGroup: null,
                    };
                });

                setSubmissions(mapped);
                setActivityDetails({
                    classroomName: data.classroom?.name || '',
                    title: data.activity?.title || data.activity?.activity_id || `Activity ${activityCode}`,
                    description: data.activity?.lp_text || '',
                    dueDate: data.activity?.due_at || '',
                });
            } catch (error) {
                setSubmissions([]);
                setSubmissionsError(error instanceof Error ? error.message : 'Failed to load submissions');
            } finally {
                setLoadingSubmissions(false);
            }
        };

        fetchSubmissions();
    }, [activityCode, classroomId]);

    const submissionList = submissions;
    const submittedCount = submissionList.filter(s => s.status !== 'pending' && !!s.submittedAt).length;
    const gradedCount = submissionList.filter(s => s.status === 'graded').length;
    const avgAiScore = submittedCount > 0
        ? Math.round(
            submissionList
                .filter(s => typeof s.aiScore === 'number')
                .reduce((acc, s) => acc + (s.aiScore || 0), 0) / submittedCount
        )
        : 0;

    const handleStudentClick = (student: StudentSubmission) => {
        setSelectedStudent(student);
        setEditMode(false);
        setRegradeError(null);
        setTeacherScore(student.teacherScore?.toString() || student.aiScore.toString() || '0');
        setTeacherFeedback(student.teacherFeedback || student.aiFeedback || '');
    };

    const handleRegrade = async () => {
        if (!selectedStudent?.submission?.id) return;
        
        setIsRegrading(true);
        setRegradeError(null);
        
        try {
            const result = await gradeSubmission({
                submission_id: selectedStudent.submission.id,
            });
            
            // Update the selected student with new grading results
            setSelectedStudent(prev => {
                if (!prev) return null;
                
                // Update answers with new AI feedback
                const updatedAnswers = prev.answers.map(answer => {
                    const gradedAnswer = result.results.find(
                        r => r.question_number === answer.question_number
                    );
                    if (gradedAnswer && !gradedAnswer.error) {
                        return {
                            ...answer,
                            ai_feedback: gradedAnswer.feedback,
                            score: gradedAnswer.score,
                        };
                    }
                    return answer;
                });
                
                return {
                    ...prev,
                    aiScore: result.overall_score,
                    status: 'graded',
                    answers: updatedAnswers,
                    aiFeedback: updatedAnswers
                        .filter(a => a.ai_feedback)
                        .map(a => `Q${a.question_number}: ${a.ai_feedback}`)
                        .join('\n\n') || 'AI grading completed.',
                };
            });
            
            // Also update in the submissions list
            setSubmissions(prev => prev.map(s => {
                if (s.id === selectedStudent.id) {
                    return {
                        ...s,
                        aiScore: result.overall_score,
                        status: 'graded',
                    };
                }
                return s;
            }));
            
        } catch (error) {
            setRegradeError(error instanceof Error ? error.message : 'Failed to regrade submission');
        } finally {
            setIsRegrading(false);
        }
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

    const totalAssignments = submissionList.length;
    const pendingCount = Math.max(totalAssignments - submittedCount, 0);

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
                                <div className="text-sm text-gray-600 mb-1">{activityDetails.classroomName || 'Classroom'}</div>
                                <h1 className="text-3xl mb-2">{activityDetails.title || 'Activity Details'}</h1>
                                <p className="text-gray-600 mb-4">{activityDetails.description || 'Review the activity submissions from your students.'}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Due: {activityDetails.dueDate ? new Date(activityDetails.dueDate).toLocaleDateString() : 'No due date'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {submittedCount}/{totalAssignments} submitted
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 mb-2">
                            <span>Activity ID: {activityCode || id || 'N/A'}</span>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-sm">Submitted</span>
                                </div>
                                <p className="text-2xl">{submittedCount}/{totalAssignments}</p>
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
                                <p className="text-2xl">{pendingCount}</p>
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
                                {loadingSubmissions && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-sm text-gray-500">
                                            Loading submissions...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loadingSubmissions && submissionsError && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-sm text-red-600">
                                            {submissionsError}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loadingSubmissions && !submissionsError && submissionList.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-sm text-gray-500">
                                            No submissions yet. Encourage students to submit their work.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loadingSubmissions && !submissionsError && submissionList.map((submission) => (
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
                                                    onClick={(e: React.MouseEvent) => {
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
                                                Students: {(() => {
                                                    const names = group.studentIds
                                                        .map(id => submissionList.find(s => String(s.studentId) === id || String(s.id) === id)?.studentName)
                                                        .filter(Boolean);
                                                    return names.length ? names.join(', ') : 'Awaiting submissions';
                                                })()}
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
                                {/* Overall Score Summary */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-600">AI Score</div>
                                        <div className="text-2xl font-semibold">{selectedStudent.aiScore}%</div>
                                    </div>
                                    {selectedStudent.teacherScore !== null && (
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-600">Teacher Score</div>
                                            <div className="text-2xl font-semibold">{selectedStudent.teacherScore}%</div>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRegrade}
                                        disabled={isRegrading || !selectedStudent.submission}
                                        className="flex items-center gap-2"
                                    >
                                        {isRegrading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        {isRegrading ? 'Grading...' : 'Re-grade with AI'}
                                    </Button>
                                </div>
                                
                                {regradeError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {regradeError}
                                    </div>
                                )}

                                {/* Per-Answer Feedback */}
                                <div>
                                    <h3 className="text-lg font-medium mb-3">Answer Breakdown</h3>
                                    <div className="space-y-4">
                                        {selectedStudent.answers.length > 0 ? (
                                            selectedStudent.answers
                                                .sort((a, b) => a.question_number - b.question_number)
                                                .map((answer) => (
                                                    <Card key={answer.id || answer.question_number} className="p-4">
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-medium text-gray-700">
                                                                    Question {answer.question_number}
                                                                </h4>
                                                                {answer.score !== null && (
                                                                    <Badge variant="outline" className="bg-purple-50">
                                                                        Score: {answer.score}%
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">{answer.question_text}</p>
                                                        </div>
                                                        
                                                        {/* Student Answer */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <UserIcon className="w-3 h-3 text-gray-500" />
                                                                <span className="text-xs text-gray-500">Student Answer</span>
                                                            </div>
                                                            <div className="p-3 bg-gray-50 rounded text-sm">
                                                                {answer.student_answer || '(no answer)'}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* AI Feedback */}
                                                        {answer.ai_feedback && (
                                                            <div className="mb-3">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Bot className="w-3 h-3 text-purple-500" />
                                                                    <span className="text-xs text-purple-600">AI Feedback</span>
                                                                </div>
                                                                <div className="p-3 bg-purple-50 rounded text-sm whitespace-pre-wrap">
                                                                    {answer.ai_feedback}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Teacher Feedback */}
                                                        {answer.teacher_feedback && (
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Edit3 className="w-3 h-3 text-teal-500" />
                                                                    <span className="text-xs text-teal-600">Teacher Feedback</span>
                                                                </div>
                                                                <div className="p-3 bg-teal-50 rounded text-sm">
                                                                    {answer.teacher_feedback}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Card>
                                                ))
                                        ) : (
                                            <Card className="p-4 bg-gray-50">
                                                <p className="text-gray-500">No answers submitted yet.</p>
                                            </Card>
                                        )}
                                    </div>
                                </div>

                                {/* Teacher Feedback Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Edit3 className="w-4 h-4 text-teal-600" />
                                            <h3 className="text-sm text-gray-600">Overall Teacher Feedback</h3>
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
                                                    <label className="text-sm text-gray-600 mb-2 block">Override Score (0-100)</label>
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
                                                        Save Feedback
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
                                                        Final Score: {selectedStudent.teacherScore || selectedStudent.aiScore}%
                                                    </Badge>
                                                </div>
                                                <p className="text-sm">
                                                    {selectedStudent.teacherFeedback || 'No teacher feedback added yet. Click Edit to add feedback.'}
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
