import { useEffect, useState } from 'react';

interface Activity {
  activity_id: string;
  activity_title: string;
  pe: string;
  lp: string;
  lp_text: string;
}

interface Mapping {
  activity_code: string;
  rubric_id: number;
  rubric_title: string;
  assignment_id?: string;
  created_at?: string;
}

function getCsrfToken(): string | null {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

export default function RubricManager() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mappings, setMappings] = useState<Record<string, Mapping>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [actsRes, mapRes] = await Promise.all([
          fetch('/api/activities/', { credentials: 'include' }),
          fetch('/api/grading/rubrics/mappings/', { credentials: 'include' }),
        ]);
        if (!actsRes.ok) throw new Error('Failed to load activities');
        if (!mapRes.ok) throw new Error('Failed to load mappings');
        const acts = await actsRes.json();
        const maps: Mapping[] = await mapRes.json();
        const mapDict: Record<string, Mapping> = {};
        maps.forEach((m) => (mapDict[m.activity_code] = m));
        setActivities(acts);
        setMappings(mapDict);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpload(activity_code: string, file: File) {
    setBusy(activity_code);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('activity_code', activity_code);
      const csrf = getCsrfToken();
      const res = await fetch('/api/grading/rubrics/import/', {
        method: 'POST',
        body: form,
        credentials: 'include',
        headers: {
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || 'Upload failed');
      }
      if (body.mapping) {
        setMappings((prev) => ({ ...prev, [body.mapping.activity_code]: body.mapping }));
      }
      setSuccess(`Imported rubric "${body.rubric_title}" and mapped to ${activity_code}`);
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleSetMapping(activity_code: string, rubric_id: number) {
    setBusy(activity_code);
    setError(null);
    setSuccess(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/grading/rubrics/mappings/set/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        body: JSON.stringify({ activity_code, rubric_id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to set mapping');
      setMappings((prev) => ({ ...prev, [body.activity_code]: body }));
      setSuccess(`Mapped activity ${activity_code} to rubric #${body.rubric_id}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to set mapping');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Rubric Manager</h1>
        <p className="mt-1 text-slate-600">Upload a rubric JSON and map it to each assessment (activity) on one page.</p>
        {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>}
        {success && <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">{success}</div>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading activities...</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activities.map((a) => {
              const mapping = mappings[a.activity_id];
              return (
                <div key={a.activity_id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="truncate font-semibold text-slate-900">{a.activity_title}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      <span className="font-mono">{a.activity_id}</span> · PE: {a.pe}
                    </div>
                    {mapping ? (
                      <div className="mt-2 text-sm text-emerald-700">
                        Mapped to: <span className="font-semibold">{mapping.rubric_title}</span> (#{mapping.rubric_id})
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-slate-500">No rubric mapped yet</div>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(a.activity_id, f);
                          e.currentTarget.value = '';
                        }}
                        disabled={busy === a.activity_id}
                      />
                      Upload JSON
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Rubric ID"
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        id={`rubric-id-${a.activity_id}`}
                        disabled={busy === a.activity_id}
                      />
                      <button
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                        onClick={() => {
                          const el = document.getElementById(`rubric-id-${a.activity_id}`) as HTMLInputElement | null;
                          const id = el?.value ? parseInt(el.value, 10) : NaN;
                          if (!isNaN(id)) handleSetMapping(a.activity_id, id);
                        }}
                        disabled={busy === a.activity_id}
                      >
                        Map ID
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
