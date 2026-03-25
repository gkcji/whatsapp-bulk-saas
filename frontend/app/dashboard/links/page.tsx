"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDateIST } from "@/lib/india";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

function timeAgo(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function LinkTrackingPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        apiFetch("/tracking/clicks"),
        apiFetch("/tracking/stats"),
      ]);
      const logsData = await logsRes.json();
      const statsData = await statsRes.json();
      setLogs(logsData.logs || []);
      setStats(statsData);
    } catch (e) {
      setLogs([]);
    }
    setLoading(false);
  };

  // Aggregate clicks per URL
  const urlMap: Record<string, { url: string; clicks: number; unique: Set<string>; last: string }> = {};
  for (const log of logs) {
    if (!urlMap[log.url]) urlMap[log.url] = { url: log.url, clicks: 0, unique: new Set(), last: log.clickedAt };
    urlMap[log.url].clicks++;
    if (log.contactId) urlMap[log.url].unique.add(log.contactId);
    if (new Date(log.clickedAt) > new Date(urlMap[log.url].last)) urlMap[log.url].last = log.clickedAt;
  }
  const urlList = Object.values(urlMap).sort((a, b) => b.clicks - a.clicks);

  const filtered = urlList.filter(u => u.url.toLowerCase().includes(search.toLowerCase()));

  const recentLogs = [...logs].slice(0, 20);

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Link Click Tracking</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Monitor URL clicks from WhatsApp campaigns — tracked in real-time from your webhooks.</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2">
          🔄 Refresh
        </button>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Clicks", value: loading ? "—" : (stats?.totalClicks ?? 0).toLocaleString("en-IN"), color: "text-indigo-600", bg: "bg-indigo-50", icon: "🔗" },
            { label: "Unique Clickers", value: loading ? "—" : (stats?.uniqueClickers ?? 0).toLocaleString("en-IN"), color: "text-emerald-600", bg: "bg-emerald-50", icon: "👤" },
            { label: "Tracked URLs", value: loading ? "—" : urlList.length.toLocaleString("en-IN"), color: "text-blue-600", bg: "bg-blue-50", icon: "📎" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                <span className={`text-2xl`}>{kpi.icon}</span>
              </div>
              <h3 className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* URL Click Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Tracked URLs</h2>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search URLs..."
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
              />
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-5xl mb-4">🔗</span>
                <p className="font-bold text-slate-600">No link clicks tracked yet</p>
                <p className="text-sm text-slate-400 mt-1">When customers click URLs in your campaign messages, they'll appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-700">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 bg-white">
                      <th className="py-4 px-6">URL</th>
                      <th className="py-4 px-4 text-center">Clicks</th>
                      <th className="py-4 px-4 text-center">Unique</th>
                      <th className="py-4 px-4 text-center">Last Click</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((link, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-700 truncate max-w-[280px] font-medium">{link.url}</p>
                        </td>
                        <td className="py-4 px-4 text-center font-black text-slate-800">{link.clicks.toLocaleString("en-IN")}</td>
                        <td className="py-4 px-4 text-center font-bold text-slate-500">{link.unique.size.toLocaleString("en-IN")}</td>
                        <td className="py-4 px-4 text-center text-xs text-slate-400">{timeAgo(link.last)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Click Log */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base font-bold text-slate-800">Recent Clicks</h2>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center px-4">
                  <p className="text-slate-400 text-sm">No click events yet</p>
                </div>
              ) : (
                recentLogs.map((log: any, i) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <span className="text-lg mt-0.5">👆</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 truncate font-medium">{log.url}</p>
                      {log.contactId && <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{log.contactId.slice(0, 12)}…</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(log.clickedAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
