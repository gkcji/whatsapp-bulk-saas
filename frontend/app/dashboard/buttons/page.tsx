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

function timeAgo(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ButtonTrackingPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "logs">("stats");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        apiFetch("/tracking/buttons"),
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

  // Aggregate by payload
  const payloadMap: Record<string, { payload: string; buttonText: string; clicks: number; campaigns: Set<string>; contacts: Set<string>; last: string }> = {};
  for (const log of logs) {
    const key = log.payload || log.buttonText || "unknown";
    if (!payloadMap[key]) payloadMap[key] = { payload: key, buttonText: log.buttonText || key, clicks: 0, campaigns: new Set(), contacts: new Set(), last: log.clickedAt };
    payloadMap[key].clicks++;
    if (log.campaignId) payloadMap[key].campaigns.add(log.campaignId);
    if (log.contactId) payloadMap[key].contacts.add(log.contactId);
    if (log.clickedAt && new Date(log.clickedAt) > new Date(payloadMap[key].last)) payloadMap[key].last = log.clickedAt;
  }
  const payloadList = Object.values(payloadMap).sort((a, b) => b.clicks - a.clicks);
  const topButton = payloadList[0];

  const filteredStats = payloadList.filter(b =>
    b.buttonText.toLowerCase().includes(search.toLowerCase()) ||
    b.payload.toLowerCase().includes(search.toLowerCase())
  );

  const recentLogs = [...logs].slice(0, 30);

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Button Tracking</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Track WhatsApp Quick Reply & Interactive button clicks — live from Meta webhooks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm transition-all shadow-sm hover:bg-slate-50 flex items-center gap-2">🔄 Refresh</button>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setActiveTab("stats")} className={`px-4 py-1.5 font-bold text-sm rounded-md transition-all ${activeTab === "stats" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Button Stats</button>
            <button onClick={() => setActiveTab("logs")} className={`px-4 py-1.5 font-bold text-sm rounded-md transition-all ${activeTab === "logs" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Raw Logs</button>
          </div>
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Button Clicks", value: loading ? "—" : (stats?.totalButtons ?? 0).toLocaleString("en-IN"), color: "text-indigo-600", icon: "👆" },
            { label: "Top Button", value: loading ? "—" : (topButton ? `"${topButton.buttonText}"` : "None"), color: "text-emerald-600", icon: "🏆" },
            { label: "Unique Payloads", value: loading ? "—" : payloadList.length.toLocaleString("en-IN"), color: "text-blue-600", icon: "🎯" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                <span className="text-2xl">{kpi.icon}</span>
              </div>
              <h3 className={`text-3xl font-black ${kpi.color} break-words`}>{kpi.value}</h3>
              {i === 1 && topButton && (
                <p className="text-xs text-slate-400 mt-1">{topButton.clicks.toLocaleString("en-IN")} total clicks</p>
              )}
            </div>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Button Performance</h2>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search payload or text..."
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              />
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredStats.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-5xl mb-4">👆</span>
                <p className="font-bold text-slate-600">No button clicks tracked yet</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">
                  When customers tap Quick Reply or interactive buttons in your WhatsApp messages, they'll appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-700">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 bg-white">
                      <th className="py-4 px-6">Button Info</th>
                      <th className="py-4 px-4 text-center">Campaigns</th>
                      <th className="py-4 px-4 text-center">Total Clicks</th>
                      <th className="py-4 px-4 text-center">Unique Users</th>
                      <th className="py-4 px-4 text-center">Last Click</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStats.map((btn, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl border border-indigo-100">👆</div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm mb-0.5">"{btn.buttonText}"</p>
                              <p className="font-mono text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-max">{btn.payload}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="text-xs font-bold text-slate-500">{btn.campaigns.size}</span>
                        </td>
                        <td className="py-5 px-4 text-center font-black text-slate-800 text-lg">{btn.clicks.toLocaleString("en-IN")}</td>
                        <td className="py-5 px-4 text-center font-bold text-slate-500">{btn.contacts.size.toLocaleString("en-IN")}</td>
                        <td className="py-5 px-4 text-center text-xs text-slate-400">{timeAgo(btn.last)}</td>
                        <td className="py-5 px-6 text-right">
                          <button
                            onClick={() => router.push("/dashboard/campaigns")}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 ml-auto"
                          >
                            🎯 Retarget {btn.contacts.size} Users
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Raw Logs Tab */}
        {activeTab === "logs" && (
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden font-mono text-xs" style={{ minHeight: 400 }}>
            <div className="p-4 border-b border-slate-800 bg-black flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-sm font-bold text-slate-300">Live Button Webhook Logs</h2>
              </div>
              <span className="text-[10px] text-slate-500">{logs.length} events recorded</span>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto text-emerald-400" style={{ maxHeight: 500 }}>
              {loading ? (
                <p className="text-slate-500">Loading logs...</p>
              ) : recentLogs.length === 0 ? (
                <p className="text-slate-600">No button webhook events yet. Waiting for customers to tap buttons...</p>
              ) : (
                recentLogs.map((log: any, i) => (
                  <div key={i} className="flex gap-4 flex-wrap">
                    <span className="text-slate-600 shrink-0">[{new Date(log.clickedAt).toISOString()}]</span>
                    <span className="text-indigo-400 font-bold shrink-0">BUTTON_REPLY</span>
                    <span className="text-slate-300 break-all">
                      {`{ payload: "${log.payload}", text: "${log.buttonText || "—"}", contactId: "${log.contactId || "—"}", campaignId: "${log.campaignId || "—"}" }`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
