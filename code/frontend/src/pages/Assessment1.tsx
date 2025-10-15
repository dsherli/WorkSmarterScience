import { useState } from "react";
import { Link } from "react-router-dom";
import reactionsTable from "../assets/chemical-reactions/reactions-table.png";

export default function Assessment1() {
    // Shared images for the entire assessment (0–2 recommended)
    const sharedImages: string[] = [
        reactionsTable,
    ];

    // Bare-bones text questions
    const questions = [
        { id: "q1", prompt: "Which information in the table would you use to tell Miranda whether any liquids could be the same substance? Explain why." },
        { id: "q2", prompt: "What conclusion can you make on whether any of the liquids are the same? Explain why based on the information in the table." },
    ];

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const answered = Object.values(answers).filter((v) => v?.trim()).length;
    const progress = Math.round((answered / questions.length) * 100);

    function handleSubmit() {
        setSubmitted(true);
        alert("Responses submitted! (Demo only)");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600" />
                        <span className="font-semibold tracking-tight">PersonalVTA</span>
                    </div>
                    <nav className="hidden gap-6 text-sm text-slate-200/90 sm:flex">
                        <Link className="hover:text-white" to="/">Home</Link>
                        <Link className="hover:text-white" to="/assessments/1">Assessment</Link>
                        <Link className="hover:text-white" to="/dashboard">Dashboard</Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-12">
                {/* Title card */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_-20%,rgba(16,185,129,0.10),transparent)]" />
                    <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-8 backdrop-blur-md shadow-[0_16px_64px_rgba(15,23,42,0.08)]">
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Matching Unknown Liquids</h1>
                        <p className="mt-1 text-slate-600">Provide detailed, text-based answers using the reference image(s) below.</p>
                    </div>
                </section>

                <div className="mt-8 grid gap-6">
                    {/* Shared image strip */}
                    {sharedImages.length > 0 && (
                        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
                            <h2 className="font-semibold text-slate-900">
                                Reference Image{sharedImages.length > 1 ? "s" : ""}
                            </h2>
                            <div className="mt-4 grid grid-cols-1 gap-4">
                                {sharedImages.map((src, i) => (
                                    <div key={i}>
                                        <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                            <img
                                                className="block h-auto w-full object-contain"
                                                src={src}
                                                alt="Reference table image"
                                            />
                                        </figure>
                                        <div className="mt-2 text-right">
                                            <a
                                                href={src}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                                            >
                                                View full size ↗
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Requested description below the image */}
                            <p className="mt-4 text-slate-700">
                                Miranda found four different bottles filled with unknown pure liquids. She measured the mass, volume, and boiling point of these liquids, and calculated the density which are displayed in Table 1.
                            </p>
                        </section>
                    )}

                    {/* Progress */}
                    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Progress</span>
                            <span className="text-sm text-slate-600">{answered}/{questions.length} answered</span>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                            <div
                                className="h-2 rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </section>

                    {/* Questions */}
                    {questions.map((q, index) => (
                        <section key={q.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
                            <div className="flex items-baseline justify-between">
                                <h3 className="font-semibold text-slate-900">Question {index + 1}</h3>
                            </div>
                            <p className="mt-2 text-slate-700">{q.prompt}</p>
                            <textarea
                                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                rows={6}
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ""}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            />
                        </section>
                    ))}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <Link
                            to="/"
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                            Back
                        </Link>
                        <button
                            className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
                            onClick={handleSubmit}
                        >
                            {submitted ? "Resubmit" : "Submit"}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="border-t border-slate-200/60 bg-white/70">
                <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} PersonalVTA
                </div>
            </footer>
        </div>
    );
}
