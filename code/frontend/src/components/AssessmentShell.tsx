// src/components/AssessmentShell.tsx
export default function AssessmentShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode; }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800">
            <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600" />
                        <span className="font-semibold tracking-tight">PersonalVTA</span>
                    </div>
                    <nav className="hidden gap-6 text-sm text-slate-200/90 sm:flex">
                        <a className="hover:text-white" href="/">Home</a>
                        <a className="hover:text-white" href="/assessment.html">Legacy</a>
                    </nav>
                </div>
            </header>

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_-20%,rgba(16,185,129,0.10),transparent)]" />
                <div className="mx-auto max-w-6xl px-4 py-10">
                    <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_16px_64px_rgba(15,23,42,0.08)] backdrop-blur-md">
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
                        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
                        <div className="mt-6">{children}</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
