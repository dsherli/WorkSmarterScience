import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { resolveMediaUrl } from "../utils/media";

export default function Assessment1() {
    const { activity_id } = useParams();
    const [activity, setActivity] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activity_id) return;
        fetch(`/api/activities/${activity_id}/`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                setActivity(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching activity:", err);
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

    function handleSubmit() {
        setSubmitted(true);
        alert("Responses submitted! (Demo only)");
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
                                const mediaUrl = resolveMediaUrl(item.url);
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
                            );})}
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
