"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function NumberHealthPage() {
  const router = useRouter();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/numbers");
      const d = await res.json();
      setNumbers(d.numbers || []);
    } catch(e) {}
    setLoading(false);
  };

  const syncHealth = async (id: string) => {
    setSyncingId(id);
    try {
      await apiFetch(`/numbers/${id}/sync-health`, { method: "POST" });
      await loadNumbers();
    } catch(e) {}
    setSyncingId(null);
  };

  const syncAll = async () => {
    for (const n of numbers) {
      await syncHealth(n.id);
    }
  };

  const getQualityColor = (qty: string) => {
     if(qty === 'HIGH') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
     if(qty === 'MEDIUM') return 'text-amber-600 bg-amber-50 border-amber-200';
     if(qty === 'LOW') return 'text-red-600 bg-red-50 border-red-200';
     return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getProgressColor = (percent: number) => {
     if(percent >= 100) return 'bg-red-500';
     if(percent >= 80) return 'bg-amber-500';
     return 'bg-indigo-500';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Number Health & Limits</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Monitor Meta quality ratings natively to prevent sudden business bans or routing restrictions.</p>
        </div>
        <button onClick={syncAll} disabled={syncingId !== null || loading} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-bold text-sm transition-all border border-slate-200">
          Sync All Health Profiles
        </button>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* WARNING BANNER FOR LOW QUALITY */}
        {numbers.some(n => n.quality === 'LOW' || n.quality === 'MEDIUM') && (
           <div className="bg-amber-50 border-l-4 border-l-amber-500 p-6 rounded-xl border border-amber-200 shadow-sm flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                 <h3 className="font-bold text-amber-800">Critical Meta Warning</h3>
                 <p className="text-sm text-amber-700 mt-1">One or more of your connected numbers have dropped below High Quality. To prevent permanent bans, stop sending promotional templates immediately and wait 7 days for the quality score to recover organically via inbound replies.</p>
              </div>
           </div>
        )}

        {/* HEALTH DASHBOARD GRID */}
        {loading ? (
          <div className="flex items-center justify-center p-20 text-slate-500">Loading numbers...</div>
        ) : numbers.length === 0 ? (
          <div className="text-center p-20 bg-white rounded-xl border border-slate-200">
            <span className="text-4xl">📱</span>
            <p className="font-bold text-slate-700 mt-4">No numbers connected</p>
            <p className="text-sm text-slate-500 mt-1">Connect a number in Settings to start monitoring health.</p>
            <button onClick={() => router.push("/dashboard/settings")} className="mt-4 px-4 py-2 bg-indigo-600 font-bold text-white text-sm rounded shadow">Go to Settings</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
             {numbers.map(num => {
                const percent = (num.sentToday / Math.max(num.dailyLimit, 1)) * 100;
                return (
                   <div key={num.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      
                      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                         <div>
                            <h2 className="font-bold text-slate-800 text-lg">{num.phoneNumber}</h2>
                            <p className="text-xs font-mono text-slate-500 mt-1">WABA: {num.wabaId}</p>
                         </div>
                         <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded border ${getQualityColor(num.quality)}`}>
                            {num.quality}
                         </span>
                      </div>

                      <div className="p-6 space-y-6 flex-1">
                         
                         {/* Tier Display */}
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pricing Limit</span>
                            <span className="font-bold text-slate-800 text-sm bg-slate-100 px-3 py-1 rounded-md">{num.tier}</span>
                         </div>

                         {/* Daily Limit Block */}
                         <div>
                            <div className="flex justify-between items-end mb-2">
                               <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Daily Send Limit</span>
                               <div className="text-right">
                                  <span className={`font-black text-xl ${percent >= 100 ? 'text-red-500' : 'text-slate-800'}`}>{num.sentToday.toLocaleString()}</span>
                                  <span className="text-slate-400 font-bold text-xs ml-1">/ {num.dailyLimit.toLocaleString()}</span>
                               </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 shadow-inner">
                               <div className={`h-full transition-all ${getProgressColor(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                            </div>
                            {percent >= 100 && <p className="text-xs text-red-500 font-bold mt-2 float-right">Limit Reached</p>}
                         </div>

                      </div>

                      {/* Footer Warning */}
                      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                         {num.quality === 'LOW' ? (
                            <span className="text-xs font-bold text-red-600 flex items-center gap-1">⚠️ High user block rate detected.</span>
                         ) : num.quality === 'MEDIUM' ? (
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">⚠️ Quality dropping. Check template feedback.</span>
                         ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">✅ Health optimal natively.</span>
                         )}
                         <button onClick={() => syncHealth(num.id)} disabled={syncingId === num.id} className="text-[10px] font-bold text-indigo-500 hover:bg-slate-200 px-2 py-1 rounded transition-colors uppercase disabled:opacity-50">
                           {syncingId === num.id ? "Syncing..." : "Sync"}
                         </button>
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
