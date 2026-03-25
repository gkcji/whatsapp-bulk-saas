"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, formatIndian, formatDateIST } from "@/lib/india";

const API = "http://localhost:5000/api";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) } });

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [createMode, setCreateMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", numberId: "", templateId: "", audienceId: "", scheduledAt: "" });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [c, n, t, a] = await Promise.all([
      apiFetch("/campaigns").then(r => r.json()),
      apiFetch("/numbers").then(r => r.json()),
      apiFetch("/templates").then(r => r.json()),
      apiFetch("/audience").then(r => r.json()),
    ]);
    setCampaigns(c.campaigns || []);
    setNumbers(n.numbers || []);
    setTemplates(t.templates || []);
    setAudiences(a.audiences || []);
    setLoading(false);
  };

  useEffect(() => { if (!getToken()) { router.push("/login"); return; } load(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const r = await apiFetch("/campaigns", { method: "POST", body: JSON.stringify(form) });
    const d = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(d.error || "Failed"); return; }
    setCreateMode(false);
    setForm({ name: "", numberId: "", templateId: "", audienceId: "", scheduledAt: "" });
    load();
  };

  const handlePause = async (id: string) => {
    await apiFetch(`/campaigns/${id}/pause`, { method: "POST" });
    load();
  };

  const handleResume = async (id: string) => {
    await apiFetch(`/campaigns/${id}/resume`, { method: "POST" });
    load();
  };

  return (
    <>
      <header className="px-10 py-7 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campaign Sender</h1>
          <p className="text-slate-500 text-sm mt-0.5">Broadcast WhatsApp messages at scale — tracked in real-time</p>
        </div>
        <button onClick={() => setCreateMode(!createMode)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${createMode ? "bg-slate-100 text-slate-700" : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700"}`}>
          {createMode ? "✕ Cancel" : "🚀 New Campaign"}
        </button>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto space-y-6">

        {/* Create Form */}
        {createMode && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Configure Campaign</h2>
            {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Campaign Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Diwali 2025 Blast" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">WhatsApp Number *</label>
                <select required value={form.numberId} onChange={e => setForm({ ...form, numberId: e.target.value, templateId: "" })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800">
                  <option value="">-- Select Number --</option>
                  {numbers.map((n: any) => <option key={n.id} value={n.id}>{n.phoneNumber} ({n.quality})</option>)}
                </select>
                {numbers.length === 0 && <p className="text-xs text-red-500 mt-1">⚠️ No numbers found. <a href="/dashboard/settings" className="underline">Add a number first</a></p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Template *</label>
                <select required value={form.templateId} onChange={e => setForm({ ...form, templateId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800">
                  <option value="">-- Select Template --</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.templateName} ({t.language})</option>
                  ))}
                </select>
                {templates.length === 0 && <p className="text-xs text-amber-500 mt-1">⚠️ No templates. <a href="/dashboard/templates" className="underline">Sync templates first</a></p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Audience</label>
                <select value={form.audienceId} onChange={e => setForm({ ...form, audienceId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800">
                  <option value="">All My Contacts</option>
                  {audiences.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a._count?.contacts || 0} contacts)</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800" />
              </div>

              <div className="flex items-end">
                <button type="submit" disabled={submitting} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><span className="animate-spin">⏳</span> Queuing...</> : "🚀 Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Campaign Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">All Campaigns</h2>
            <span className="text-xs text-slate-400">{campaigns.length} total</span>
          </div>
          {loading ? (
            <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div></div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 flex flex-col items-center">
              <span className="text-5xl mb-4">📭</span>
              <p className="font-bold text-slate-600">No campaigns yet</p>
              <button onClick={() => setCreateMode(true)} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Create First Campaign</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-white">
                  <tr>
                    <th className="py-4 px-6 text-left">Campaign</th>
                    <th className="py-4 px-4 text-left">Number</th>
                    <th className="py-4 px-4 text-left">Template</th>
                    <th className="py-4 px-4 text-left">Funnel</th>
                    <th className="py-4 px-4 text-left">Progress</th>
                    <th className="py-4 px-4 text-left">Cost</th>
                    <th className="py-4 px-4 text-left">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c: any) => {
                    const pct = c.totalContacts > 0 ? Math.round((c.sent / c.totalContacts) * 100) : 0;
                    return (
                      <tr key={c.id}
                        onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                        className="hover:bg-indigo-50 cursor-pointer transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="py-4 px-4 text-slot-600 text-xs">{c.number?.phoneNumber || "—"}</td>
                        <td className="py-4 px-4 text-xs text-indigo-600 font-mono">{c.template?.templateName || "—"}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-3 text-xs font-bold">
                            <span className="text-slate-600">{c.sent} <span className="text-slate-400 font-normal">sent</span></span>
                            <span className="text-emerald-600">{c.delivered} <span className="text-slate-400 font-normal">dlvd</span></span>
                            <span className="text-blue-500">{c.read} <span className="text-slate-400 font-normal">read</span></span>
                            <span className="text-red-500">{c.failed} <span className="text-slate-400 font-normal">fail</span></span>
                          </div>
                        </td>
                        <td className="py-4 px-4 w-36">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>{pct}%</span><span>{c.totalContacts} contacts</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${c.status === 'RUNNING' ? 'bg-indigo-500 animate-pulse' : c.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-amber-600">${c.cost?.toFixed(3)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${c.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-600' : c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : c.status === 'FAILED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {c.status === 'RUNNING' && (
                              <button onClick={() => handlePause(c.id)} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100">Pause</button>
                            )}
                            {c.status === 'PAUSED' && (
                              <button onClick={() => handleResume(c.id)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100">Resume</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
