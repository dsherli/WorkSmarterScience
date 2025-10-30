import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user and activities concurrently with JWT Authorization if present
        const fetchData = async () => {
            try {
                const access = localStorage.getItem("access");
                const authHeader = access ? { Authorization: `Bearer ${access}` } : {} as Record<string, string>;

                const [userRes, activitiesRes] = await Promise.all([
                    fetch("/api/auth/user/", { headers: { ...authHeader, "Cache-Control": "no-store" } }),
                    fetch("/api/activities/", { headers: { ...authHeader } }),
                ]);

                const userData = userRes.ok ? await userRes.json() : null;
                const activityData = activitiesRes.ok ? await activitiesRes.json() : [];

                setUser(userData);
                setActivities(Array.isArray(activityData) ? activityData : []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
            <div className="grid gap-6 md:grid-cols-3">
                {/* Card 1 */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
                    <h3 className="font-semibold text-slate-900">
                        Interactive Assessments
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Jump back into your latest assessment and pick up where you left off.
                    </p>
                    <Link
                        to="/assessment/005.04-c01" //
                        className="mt-4 inline-block rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-md"
                    >
                        Continue
                    </Link>
                </div>

                {/* Card 2 */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
                    <h3 className="font-semibold text-slate-900">Progress</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        See scores and topic mastery trends.
                    </p>
                    <button className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow hover:bg-amber-600">
                        View Progress
                    </button>
                </div>

                {/* Card 3 */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-slate-400 to-slate-500" />
                    <h3 className="font-semibold text-slate-900">Resources</h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Reference sheets and practice sets.
                    </p>
                    <button className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        Open Library
                    </button>
                </div>
            </div>

            {/* Science Activities Section */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                    Science Activities
                </h2>

                {loading ? (
                    <div className="col-span-3 flex justify-center py-10 text-slate-400">
                        Loading activities...
                    </div>
                ) : activities.length === 0 ? (
                    <p className="text-slate-500 text-sm">No activities found.</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {activities.map((a, idx) => (
                            <Link
                                key={idx}
                                to={`/assessment/${a.activity_id}`}
                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
                            >
                                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1 group-hover:text-emerald-600">
                                    {a.activity_title}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    <strong>PE:</strong> {a.pe}
                                </p>
                                <p className="text-sm text-slate-600">
                                    <strong>LP:</strong> {a.lp}
                                </p>
                                <p className="mt-2 text-sm text-slate-700 line-clamp-3">
                                    {a.lp_text}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
