"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000/api";
import { formatINR, formatIST, formatIndian } from "@/lib/india";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/analytics/overview");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const kpis = [
    { label: "Total Sent", value: loading ? "—" : formatIndian(data?.sentMessages ?? 0), color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Delivered", value: loading ? "—" : formatIndian(data?.deliveredMessages ?? 0), color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Read", value: loading ? "—" : formatIndian(data?.readMessages ?? 0), color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Replies", value: loading ? "—" : formatIndian(data?.repliedMessages ?? 0), color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Failed", value: loading ? "—" : formatIndian(data?.failedMessages ?? 0), color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const dailyStats = data?.dailyStats || [];
  const maxSent = Math.max(...dailyStats.map((d: any) => d.sent || 0), 1);
  const templateStats = data?.campaignStats || [];

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      <header className="px-10 py-8 bg-white border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Analytics & Reporting</h1>
        <p className="text-slate-500 mt-1 font-medium text-sm">Monitor campaign performance, delivery rates, and agent efficiency in real-time.</p>
      </header>

      <div className="p-10 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           {kpis.map((kpi, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                </div>
                <h3 className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</h3>
             </div>
           ))}
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* DAILY STATS CHART */}
           <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-lg font-bold text-slate-800">Daily Traffic Volume (Last 7 Days)</h2>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : dailyStats.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">No data available</div>
              ) : (
                <div className="h-64 flex items-end gap-4 justify-between relative mt-4">
                   <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                      <div className="w-full border-b border-slate-400"></div>
                      <div className="w-full border-b border-slate-400"></div>
                      <div className="w-full border-b border-slate-400"></div>
                      <div className="w-full border-b border-slate-400"></div>
                   </div>

                   {dailyStats.map((day: any, i: number) => {
                      const h = (day.sent / maxSent) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center w-full group relative z-10">
                           <div className="w-full max-w-[60px] flex flex-col items-center justify-end h-64 gap-1">
                              <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                                 {day.sent} Sent • {day.replied} Replied
                              </div>
                              <div className="w-full bg-indigo-500 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: `${h}%` }}></div>
                           </div>
                           <span className="text-xs font-bold text-slate-500 mt-3">{new Date(day.date).toLocaleDateString('en-US', {weekday: 'short'})}</span>
                        </div>
                      );
                   })}
                </div>
              )}
           </div>

           {/* CAMPAIGN PERFORMANCE STATS */}
           <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Campaigns</h2>
              <div className="flex-1 flex flex-col gap-6 justify-start overflow-y-auto">
                 {loading ? (
                   <div className="text-slate-500">Loading...</div>
                 ) : templateStats.length === 0 ? (
                   <div className="text-slate-500 text-sm">No campaigns sent yet.</div>
                 ) : templateStats.slice(0, 5).map((t: any) => {
                    const total = t.sent || 1;
                    const readPct = Math.round((t.read / total) * 100) || 0;
                    return (
                      <div key={t.id}>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-700 truncate">{t.name}</span>
                            <span className="text-xs font-bold text-indigo-600">{readPct}% Read</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                            <div className="bg-indigo-500 h-full" style={{ width: `${readPct}%` }}></div>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
           
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Platform Summary</h2>
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-sm text-slate-700">Total Contacts</span>
                    <span className="font-bold text-sm text-indigo-600">{data?.totalContacts?.toLocaleString() || 0}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-sm text-slate-700">Total Campaigns</span>
                    <span className="font-bold text-sm text-indigo-600">{data?.totalCampaigns?.toLocaleString() || 0}</span>
                 </div>
              </div>
           </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
               <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Aggregate Spend</h2>
               <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Total API Cost (INR)</p>
                    <p className="text-xs text-slate-500">Calculated from sent campaigns</p>
                  </div>
                  <span className="font-black text-3xl text-rose-600">{formatINR(data?.totalSpend || 0)}</span>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
}
