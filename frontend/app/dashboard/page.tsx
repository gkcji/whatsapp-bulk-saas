"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, toIndianShort, formatIndian } from "@/lib/india";

const API = "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string) =>
  fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` } });

// ── Inline SVG Icons ──────────────────────────────────────
const I = {
  users:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  campaign: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>,
  message:  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>,
  wallet:   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  delivered:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  read:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  phone:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
  inbox:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>,
  flow:     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  arrow:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>,
  plus:     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
  up:       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>,
  dot:      <svg className="w-2 h-2" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg>,
};

// ── Mini bar chart SVG component ──────────────────────────
function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div key={i} className={`flex-1 rounded-sm ${color} opacity-${i === values.length - 1 ? "100" : "40"}`} style={{ height: `${(v / max) * 100}%`, minHeight: 2 }} />
      ))}
    </div>
  );
}

// ── Funnel bar ────────────────────────────────────────────
function FunnelBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-800">{value.toLocaleString()}</span>
          {sub && <span className="text-[10px] text-slate-400 ml-1.5">{sub}</span>}
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning");
  const [userName, setUserName] = useState("there");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    const name = typeof window !== "undefined" ? localStorage.getItem("userName") || "there" : "there";
    setUserName(name);
    if (!getToken()) { router.push("/login"); return; }
    apiFetch("/dashboard/stats").then(r => r.json()).then(d => {
      setStats(d.stats);
      setCampaigns(d.recentCampaigns || []);
      setNumbers(d.numbers || []);
      setLoading(false);
    }).catch(() => router.push("/login"));
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <p className="text-sm text-slate-500 font-medium">Loading your workspace…</p>
      </div>
    </div>
  );

  const sent      = stats?.messagesSent      ?? 0;
  const delivered = stats?.messagesDelivered ?? 0;
  const read      = stats?.messagesRead      ?? 0;
  const failed    = stats?.messagesFailed    ?? 0;
  const replied   = stats?.messagesReplied   ?? 0;
  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : "0.0";
  const readRate     = delivered > 0 ? ((read / delivered) * 100).toFixed(1) : "0.0";

  // Array to render a flat sparkline that ends in the current amount
  const sparklines: any = {
    contacts: [0, 0, 0, 0, 0, 0, stats?.totalContacts ?? 0],
    campaigns: [0, 0, 0, 0, 0, 0, stats?.totalCampaigns ?? 0],
    messages: [0, 0, 0, 0, 0, 0, sent],
    wallet: [0, 0, 0, 0, 0, 0, stats?.walletBalance ?? 0],
  };

  const kpis = [
    { label: "Total Contacts", value: toIndianShort(stats?.totalContacts ?? 0), sub: `${stats?.totalNumbers ?? 0} numbers active`, icon: I.users, spark: sparklines.contacts, sparkColor:"bg-indigo-500", gradient:"from-indigo-500 to-violet-600", textGrad:"text-indigo-600", bg:"bg-indigo-50 border-indigo-100" },
    { label: "Campaigns", value: formatIndian(stats?.totalCampaigns ?? 0), sub: `${formatIndian(stats?.pendingQueue ?? 0)} msgs queued`, icon: I.campaign, spark: sparklines.campaigns, sparkColor:"bg-violet-500", gradient:"from-violet-500 to-purple-600", textGrad:"text-violet-600", bg:"bg-violet-50 border-violet-100" },
    { label: "Messages Sent", value: toIndianShort(sent), sub: `${deliveryRate}% delivery rate`, icon: I.message, spark: sparklines.messages, sparkColor:"bg-sky-500", gradient:"from-sky-500 to-blue-600", textGrad:"text-sky-600", bg:"bg-sky-50 border-sky-100" },
    { label: "Wallet Balance", value: formatINR(stats?.walletBalance ?? 0), sub: `${formatINR(stats?.totalSpend ?? 0)} total spent`, icon: I.wallet, spark: sparklines.wallet, sparkColor:"bg-amber-500", gradient:"from-amber-500 to-orange-500", textGrad:"text-amber-600", bg:"bg-amber-50 border-amber-100" },
  ];

  const statusColor: any = {
    RUNNING:   "bg-indigo-50 text-indigo-700 border-indigo-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED:    "bg-red-50 text-red-700 border-red-200",
    DRAFT:     "bg-slate-50 text-slate-600 border-slate-200",
    PAUSED:    "bg-amber-50 text-amber-700 border-amber-200",
  };
  const qualityDot: any = { HIGH: "bg-emerald-500", MEDIUM: "bg-amber-400", LOW: "bg-red-400" };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP HEADER ─────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{greeting} 👋</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Here's what's happening with your WhatsApp campaigns today</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">LIVE DATA</span>
            </div>
            <button onClick={() => router.push("/dashboard/campaigns")}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/25 transition-all">
              {I.plus} New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-7 space-y-6 max-w-[1440px] mx-auto">

        {/* ── KPI CARDS ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${k.bg} border flex items-center justify-center ${k.textGrad}`}>
                  {k.icon}
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                  {I.up}
                  <span className="text-[10px] font-bold">Live</span>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{k.value}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{k.label}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{k.sub}</p>
              <div className="mt-4">
                <MiniBar values={k.spark} color={k.sparkColor} />
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── LEFT: Message Funnel + Campaigns ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Message Funnel Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Message Funnel</h2>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Real-time delivery &amp; engagement breakdown</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-lg font-black text-slate-900">{deliveryRate}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delivery</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-lg font-black text-slate-900">{readRate}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Read Rate</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <FunnelBar label="Sent" value={sent} max={sent} color="bg-indigo-500" sub="total dispatched" />
                <FunnelBar label="Delivered" value={delivered} max={sent} color="bg-sky-500" sub={`${deliveryRate}% of sent`} />
                <FunnelBar label="Read / Opened" value={read} max={sent} color="bg-emerald-500" sub={`${readRate}% of delivered`} />
                <FunnelBar label="Replied (Inbound)" value={replied} max={sent} color="bg-violet-500" />
                <FunnelBar label="Failed" value={failed} max={sent} color="bg-red-400" />
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Recent Campaigns</h2>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Latest activity across your sending numbers</p>
                </div>
                <button onClick={() => router.push("/dashboard/campaigns")} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                  View all {I.arrow}
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="py-14 flex flex-col items-center text-center px-6">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-300 mb-4">{I.campaign}</div>
                  <p className="font-bold text-slate-700">No campaigns yet</p>
                  <p className="text-slate-400 text-sm mt-1 mb-5">Create your first campaign to start sending</p>
                  <button onClick={() => router.push("/dashboard/campaigns")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/25 hover:bg-indigo-700 transition-all">
                    {I.plus} Create Campaign
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {campaigns.slice(0, 5).map((c: any) => {
                    const total = c.totalContacts || 1;
                    const pct = Math.round((c.sent / total) * 100);
                    return (
                      <div key={c.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        {/* Status dot + name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.status === "RUNNING" ? "bg-indigo-500 animate-pulse" : c.status === "COMPLETED" ? "bg-emerald-500" : c.status === "FAILED" ? "bg-red-400" : "bg-slate-300"}`} />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{c.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{c.template?.templateName || "No template"} · {c.number?.phoneNumber || "—"}</p>
                          </div>
                        </div>
                        {/* Funnel numbers */}
                        <div className="hidden md:flex items-center gap-3 text-xs font-bold shrink-0">
                          <span className="text-slate-700">{c.sent}<span className="text-slate-400 font-normal"> sent</span></span>
                          <span className="text-emerald-600">{c.delivered}<span className="text-slate-400 font-normal"> dlvd</span></span>
                          <span className="text-blue-500">{c.read}<span className="text-slate-400 font-normal"> read</span></span>
                        </div>
                        {/* Progress + status */}
                        <div className="shrink-0 w-28">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                            <span>{pct}%</span><span>{c.totalContacts} total</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${c.status === "RUNNING" ? "bg-indigo-500" : c.status === "COMPLETED" ? "bg-emerald-500" : "bg-slate-300"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${statusColor[c.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {c.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: "Shared Inbox",    desc: "View & reply messages", href: "/dashboard/inbox",    icon: I.inbox,    color: "text-sky-600 bg-sky-50 border-sky-100" },
                  { label: "Flow Builder",    desc: "Automate responses",   href: "/dashboard/flows",    icon: I.flow,     color: "text-violet-600 bg-violet-50 border-violet-100" },
                  { label: "Audience CRM",    desc: "Manage contacts",      href: "/dashboard/audience", icon: I.users,    color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                  { label: "Add Number",      desc: "Register WhatsApp no.", href: "/dashboard/settings", icon: I.phone,    color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                ].map(a => (
                  <button key={a.href} onClick={() => router.push(a.href)}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group text-left">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${a.color}`}>{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{a.label}</p>
                      <p className="text-xs text-slate-400 font-medium">{a.desc}</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">{I.arrow}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number Health */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Number Health</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Daily limits & quality scores</p>
                </div>
                <button onClick={() => router.push("/dashboard/settings")} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Manage →</button>
              </div>

              {numbers.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center px-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-3">{I.phone}</div>
                  <p className="font-bold text-slate-600 text-sm">No numbers yet</p>
                  <p className="text-slate-400 text-xs mt-1 mb-4">Register your Meta WABA number</p>
                  <button onClick={() => router.push("/dashboard/settings")} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all">
                    Add Number
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {numbers.slice(0, 4).map((n: any) => {
                    const used = n.sentToday || 0;
                    const limit = n.dailyLimit || 1000;
                    const pct = Math.min((used / limit) * 100, 100);
                    const barColor = pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-emerald-500";
                    return (
                      <div key={n.id} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${qualityDot[n.quality] || "bg-slate-300"}`} />
                            <span className="font-bold text-slate-800 text-sm truncate">{n.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              n.quality === "HIGH" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              n.quality === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-red-50 text-red-600 border-red-200"
                            }`}>{n.quality || "—"}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                          <span>{n.tier || "Standard"}</span>
                          <span>{used.toLocaleString()} / {limit.toLocaleString()} today</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats summary card */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-lg shadow-indigo-500/25 p-6 text-white">
              <h3 className="font-bold text-sm mb-1 text-white/90">Platform Summary</h3>
              <p className="text-white/60 text-xs font-medium mb-5">All-time across this account</p>
              <div className="space-y-4">
                {[
                  { label: "Templates", value: stats?.totalTemplates ?? 0, icon: "📋" },
                  { label: "Contacts", value: stats?.totalContacts ?? 0, icon: "👥" },
                  { label: "Total Spend", value: formatINR(stats?.totalSpend ?? 0), icon: "💰" },
                  { label: "In Queue", value: stats?.pendingQueue ?? 0, icon: "⏳" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-white/80 text-xs font-semibold">{item.label}</span>
                    </div>
                    <span className="font-black text-sm text-white">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-white/20">
                <button onClick={() => router.push("/dashboard/campaigns")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold text-sm transition-all border border-white/20">
                  {I.plus} Launch New Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
