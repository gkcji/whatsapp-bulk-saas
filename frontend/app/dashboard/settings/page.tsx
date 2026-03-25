"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, formatDateIST } from "@/lib/india";

const API = "http://localhost:5000/api";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) } });

export default function SettingsPage() {
  const router = useRouter();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [tab, setTab] = useState<"numbers" | "add">("numbers");
  const [form, setForm] = useState({ phoneNumber: "", phoneId: "", wabaId: "", accessToken: "", verifyToken: "" });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = () => apiFetch("/numbers").then(r => r.json()).then(d => setNumbers(d.numbers || []));

  useEffect(() => { if (!getToken()) { router.push("/login"); return; } load(); }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true); setError(""); setStatus("");
    const r = await apiFetch("/numbers", { method: "POST", body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setError(d.error); return; }
    setStatus("✅ Number registered & encrypted successfully!");
    setForm({ phoneNumber: "", phoneId: "", wabaId: "", accessToken: "", verifyToken: "" });
    setTab("numbers");
    load();
  };

  const handleSyncHealth = async (id: string) => {
    setSyncing(id);
    await apiFetch(`/numbers/${id}/sync-health`, { method: "POST" });
    setSyncing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this number?")) return;
    await apiFetch(`/numbers/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <header className="px-10 py-7 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">API Config & Numbers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Register WhatsApp numbers, manage credentials & API config</p>
        </div>
        <button onClick={() => setTab(tab === "add" ? "numbers" : "add")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "add" ? "bg-slate-100 text-slate-700" : "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"}`}>
          {tab === "add" ? "✕ Cancel" : "+ Add Number"}
        </button>
      </header>

      <div className="p-10 max-w-4xl mx-auto space-y-6">

        {/* Guide Banner */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start">
          <span className="text-3xl">🔑</span>
          <div>
            <h3 className="font-bold text-indigo-900 mb-1">Multi-Number Support</h3>
            <p className="text-sm text-indigo-700">Each number has its own encrypted access token, WABA ID, and quality tracking. You can add as many numbers as needed — all sending is routed per-number.</p>
          </div>
        </div>

        {/* Add Number Form */}
        {tab === "add" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="font-bold text-slate-800 text-lg mb-6">Register WhatsApp Number</h2>
            {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}
            {status && <p className="mb-4 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">{status}</p>}
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Phone Number (display)", key: "phoneNumber", placeholder: "+91 98765 43210" },
                { label: "Phone Number ID (Meta phoneId)", key: "phoneId", placeholder: "1012345678..." },
                { label: "WABA ID", key: "wabaId", placeholder: "1098765432..." },
                { label: "Verify Token", key: "verifyToken", placeholder: "my_verify_token" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder} required={f.key !== "verifyToken"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Permanent Access Token *</label>
                <textarea rows={3} required value={form.accessToken} onChange={e => setForm({ ...form, accessToken: e.target.value })}
                  placeholder="EAAGm0PX..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                <p className="text-xs text-slate-400 mt-1">Token is AES-256 encrypted before being saved to the database.</p>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={saving} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50">
                  {saving ? "Saving..." : "Register & Encrypt Number"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Numbers Table */}
        {tab === "numbers" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Registered Numbers</h2>
              <span className="text-xs text-slate-400">{numbers.length} number{numbers.length !== 1 ? "s" : ""}</span>
            </div>
            {numbers.length === 0 ? (
              <div className="p-12 flex flex-col items-center">
                <span className="text-5xl mb-4">📱</span>
                <p className="font-bold text-slate-600">No numbers registered yet</p>
                <p className="text-sm text-slate-400 mt-1 mb-4">Add your first WhatsApp number with Meta credentials</p>
                <button onClick={() => setTab("add")} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm">Add Number</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {numbers.map((n: any) => (
                  <div key={n.id} className="p-5 flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">📱</div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{n.phoneNumber}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">phoneId: {n.metaPhoneNumberId || n.phoneId}</p>
                    </div>
                    <div className="text-center">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${n.quality === 'HIGH' ? 'bg-emerald-50 text-emerald-600' : n.quality === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{n.quality}</span>
                      <p className="text-[10px] text-slate-400 mt-1">{n.tier}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">{n.sentToday}/{n.dailyLimit}</p>
                      <p className="text-[10px] text-slate-400">today/limit</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSyncHealth(n.id)} disabled={syncing === n.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 disabled:opacity-50">
                        {syncing === n.id ? "Syncing..." : "Sync Health"}
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
