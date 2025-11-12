import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useSubmissionActions } from "../hooks/useRubric";
import type { AssessmentSubmission } from "../services/rubricService";

export default function Assessment1() {
    const { activity_id } = useParams();
    const [activity, setActivity] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState(false);
    const [gradingResult, setGradingResult] = useState<AssessmentSubmission | null>(null);
    const { create: createSubmission, grade: gradeSubmission } = useSubmissionActions();

    useEffect(() => {
        if (!activity_id) return;
        fetch(`/api/activities/${activity_id}/`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                setActivity(data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
            });
    }, [activity_id]);

    if (loading)
        return (
            <div className="p-10 text-center text-slate-600">Loading activity...</div>
        );

    if (!activity)
        return (
            <div className="p-10 text-center text-red-500">
                Failed to load activity.
            </div>
        );

    const questions = activity.questions || [];
    const answered = Object.values(answers).filter((v) => v?.trim()).length;
    const progress = Math.round((answered / questions.length) * 100);

    async function handleSubmit() {
        if (!activity_id) return;
        
        setSubmitted(true);
        setGrading(true);
        setGradingResult(null);

        try {
            // Combine all answers into one text
            const combinedAnswers = questions
                .map((q: string, i: number) => {
                    const answer = answers[i]?.trim();
                    return answer ? `Question ${i + 1}: ${q}\n\nAnswer: ${answer}` : '';
                })
                .filter(Boolean)
                .join('\n\n---\n\n');

            // Create submission without forcing a rubric; backend will auto-map via ActivityRubricMap
            const submission = await createSubmission({
                activity_id: parseInt(activity_id),
                question_text: activity.activity_task || questions.join(' '),
                answer_text: combinedAnswers,
                status: 'submitted' as const,
            });

            // Automatically grade with AI
            if (submission.id) {
                const gradedSubmission = await gradeSubmission(submission.id);
                setGradingResult(gradedSubmission);
            }
        } catch (error) {
            console.error('Error submitting/grading:', error);
            alert('Error submitting assignment. Please try again.');
        } finally {
            setGrading(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 text-slate-800">
            {/* Title card */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_-20%,rgba(16,185,129,0.10),transparent)]" />
                <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-8 backdrop-blur-md shadow-[0_16px_64px_rgba(15,23,42,0.08)]">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {activity.activity_title}
                    </h1>
                    <p className="mt-1 text-slate-600">{activity.activity_task}</p>
                </div>
            </section>

            <div className="mt-8 grid gap-6">
                {/* Shared image */}
                {activity.media && activity.media.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold text-slate-900">Reference Media</h2>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activity.media.map((item: any, idx: number) => {
                                const mediaUrl = item.url;
                                return (
                                    <figure key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        {item.media_type === "image" ? (
                                            <img
                                                src={mediaUrl}
                                                alt={item.description || `reference ${idx + 1}`}
                                                className="block w-full h-auto object-contain"
                                            />
                                        ) : (
                                            <video controls className="block w-full rounded-lg">
                                                <source src={mediaUrl} type="video/mp4" />
                                            </video>
                                        )}
                                        {item.description && (
                                            <figcaption className="p-2 text-sm text-slate-600">{item.description}</figcaption>
                                        )}
                                    </figure>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Progress bar */}
                <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Progress</span>
                        <span className="text-sm text-slate-600">
                            {answered}/{questions.length} answered
                        </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                        <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </section>

                {/* Questions from DB */}
                {questions.map((prompt: string, index: number) => (
                    <section
                        key={index}
                        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm"
                    >
                        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
                        <h3 className="font-semibold text-slate-900">
                            Question {index + 1}
                        </h3>
                        <p className="mt-2 text-slate-700">{prompt}</p>
                        <textarea
                            className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={6}
                            placeholder="Type your answer here..."
                            value={answers[index] || ""}
                            onChange={(e) =>
                                setAnswers({ ...answers, [index]: e.target.value })
                            }
                        />
                    </section>
                ))}

                {/* AI Grading Results */}
                {grading && (
                    <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/95 p-6 shadow-sm">
                        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600" />
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                            <div>
                                <h3 className="font-semibold text-blue-900">Grading with AI...</h3>
                                <p className="text-sm text-blue-700">This may take 10-30 seconds</p>
                            </div>
                        </div>
                    </section>
                )}

                {gradingResult && (
                    <section className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50/95 p-6 shadow-lg">
                        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-green-600" />
                        
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-emerald-900">
                                    {gradingResult.question_levels?.length ? '� Question Ratings' : '�📊 Grading Results'}
                                </h3>
                                {!gradingResult.question_levels?.length && (
                                    <div className="text-right">
                                        <div className="text-3xl font-extrabold text-emerald-600">
                                            {gradingResult.final_score}/{gradingResult.max_score}
                                        </div>
                                        <div className="text-sm font-medium text-emerald-700">
                                            {gradingResult.percentage?.toFixed(1)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!gradingResult.question_levels?.length && (
                                <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
                                    <div
                                        className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                                        style={{ width: `${gradingResult.percentage || 0}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Question Level Breakdown */}
                        {gradingResult.question_levels && gradingResult.question_levels.length > 0 && (
                            <div className="mb-6">
                                <div className="space-y-3">
                                    {gradingResult.question_levels.map((q, idx) => {
                                        const levelColor = q.level === 'Proficient'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : q.level === 'Developing'
                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                            : 'bg-red-100 text-red-800 border-red-200';
                                        return (
                                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-slate-900">Question {q.index}</h5>
                                                        <p className="mt-1 text-sm text-slate-700">{q.question}</p>
                                                        <p className="mt-2 text-sm text-slate-700">{q.explanation}</p>
                                                    </div>
                                                    <span className={`ml-4 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${levelColor}`}>
                                                        {q.level}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Criterion Breakdown (legacy) */}
                        {!gradingResult.question_levels?.length && gradingResult.criterion_scores && gradingResult.criterion_scores.length > 0 && (
                            <div className="mb-6">
                                <h4 className="mb-3 font-semibold text-slate-900">Detailed Breakdown:</h4>
                                <div className="space-y-3">
                                    {gradingResult.criterion_scores.map((score, idx) => {
                                        const percentage = score.criterion_max_points
                                            ? (score.points_earned / score.criterion_max_points) * 100
                                            : 0;
                                        
                                        const getScoreColor = (pct: number) => {
                                            if (pct >= 90) return 'text-green-600';
                                            if (pct >= 80) return 'text-emerald-600';
                                            if (pct >= 70) return 'text-yellow-600';
                                            if (pct >= 60) return 'text-orange-600';
                                            return 'text-red-600';
                                        };

                                        return (
                                            <div
                                                key={score.id || idx}
                                                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-slate-900">
                                                            {score.criterion_name}
                                                        </h5>
                                                        <p className="mt-2 text-sm text-slate-700">
                                                            {score.feedback}
                                                        </p>
                                                    </div>
                                                    <div className="ml-4 text-right">
                                                        <div className={`text-lg font-bold ${getScoreColor(percentage)}`}>
                                                            {score.points_earned}/{score.criterion_max_points}
                                                        </div>
                                                        <div className="text-xs text-slate-600">
                                                            {percentage.toFixed(0)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Overall Feedback */}
                        {gradingResult.feedback && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <h4 className="mb-2 font-semibold text-blue-900">Overall Feedback:</h4>
                                <p className="text-sm text-blue-800">{gradingResult.feedback}</p>
                            </div>
                        )}

                        {/* Teacher Feedback (if reviewed) */}
                        {gradingResult.teacher_feedback && (
                            <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                                <h4 className="mb-2 font-semibold text-purple-900">Teacher Comments:</h4>
                                <p className="text-sm text-purple-800">{gradingResult.teacher_feedback}</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <Link
                        to="/dashboard"
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                        Back to Dashboard
                    </Link>
                    <button
                        className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
                        onClick={handleSubmit}
                    >
                        {submitted ? "Resubmit" : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
