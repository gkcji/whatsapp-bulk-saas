"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatINR, formatDateIST } from "@/lib/india";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
const apiFetch = (path: string) =>
  fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` } });

const STATUS_COLORS: Record<string, string> = {
  SENT:      "bg-blue-50 text-blue-600",
  DELIVERED: "bg-emerald-50 text-emerald-600",
  READ:      "bg-purple-50 text-purple-600",
  FAILED:    "bg-red-50 text-red-600",
  PENDING:   "bg-amber-50 text-amber-600",
};

type Contact = { id: string; name?: string; phone: string };
type Message = { id: string; contact: Contact; status: string; createdAt: string; cost: number; clickLogs: any[] };
type Reply   = { id: string; contact: Contact; body: string; createdAt: string };

export default function CampaignReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sent"|"delivered"|"read"|"failed"|"clicked"|"replies">("sent");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch(`/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data?.campaign) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <span className="text-5xl">❌</span>
      <p className="text-slate-600 font-bold">Campaign not found</p>
      <button onClick={() => router.push("/dashboard/campaigns")} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">← Back</button>
    </div>
  );

  const { campaign, breakdown } = data;
  const { sent = [], delivered = [], read = [], failed = [], clicked = [], replies = [] } = breakdown || {};

  const pct = campaign.totalContacts > 0 ? Math.round((campaign.sent / campaign.totalContacts) * 100) : 0;

  const tabs = [
    { key: "sent",      label: "📤 Sent",      count: sent.length,      color: "text-blue-600" },
    { key: "delivered", label: "✅ Delivered", count: delivered.length,  color: "text-emerald-600" },
    { key: "read",      label: "👁️ Read",      count: read.length,       color: "text-purple-600" },
    { key: "failed",    label: "❌ Failed",    count: failed.length,     color: "text-red-600" },
    { key: "clicked",   label: "🔗 Clicked",   count: clicked.length,    color: "text-orange-600" },
    { key: "replies",   label: "💬 Replies",   count: replies.length,    color: "text-teal-600" },
  ] as const;

  const activeData: any[] = activeTab === "replies" ? replies :
    activeTab === "sent"      ? sent :
    activeTab === "delivered" ? delivered :
    activeTab === "read"      ? read :
    activeTab === "failed"    ? failed : clicked;

  return (
    <>
      {/* Header */}
      <header className="px-10 py-6 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => router.push("/dashboard/campaigns")}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{campaign.name}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {campaign.number?.phoneNumber} · {campaign.template?.templateName} · {formatDateIST(campaign.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide
          ${campaign.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" :
            campaign.status === "RUNNING"   ? "bg-indigo-50 text-indigo-600 animate-pulse" :
            campaign.status === "FAILED"    ? "bg-red-50 text-red-600" :
                                              "bg-amber-50 text-amber-600"}`}>
          {campaign.status}
        </span>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Sent",   value: campaign.sent,           icon: "📤", color: "border-blue-200 bg-blue-50",     text: "text-blue-700" },
            { label: "Delivered",    value: campaign.delivered,      icon: "✅", color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
            { label: "Read",         value: campaign.read,           icon: "👁️", color: "border-purple-200 bg-purple-50",  text: "text-purple-700" },
            { label: "Failed",       value: campaign.failed,         icon: "❌", color: "border-red-200 bg-red-50",        text: "text-red-700" },
            { label: "Replies",      value: replies.length,          icon: "💬", color: "border-teal-200 bg-teal-50",      text: "text-teal-700" },
            { label: "Cost (INR)",   value: formatINR(campaign.cost||0), icon: "₹", color: "border-amber-200 bg-amber-50", text: "text-amber-700" },
          ].map(k => (
            <div key={k.label} className={`rounded-2xl border p-4 ${k.color}`}>
              <p className="text-xl mb-1">{k.icon}</p>
              <p className={`text-2xl font-black ${k.text}`}>{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-700">Delivery Progress</span>
            <span className="text-sm font-bold text-indigo-600">{pct}% of {campaign.totalContacts} contacts</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-6 mt-4 text-xs text-slate-500">
            <span>📤 Sent: <strong className="text-blue-600">{sent.length}</strong></span>
            <span>✅ Delivered: <strong className="text-emerald-600">{delivered.length}</strong></span>
            <span>👁️ Read: <strong className="text-purple-600">{read.length}</strong></span>
            <span>❌ Failed: <strong className="text-red-600">{failed.length}</strong></span>
            <span>💬 Replied: <strong className="text-teal-600">{replies.length}</strong></span>
          </div>
        </div>

        {/* Tabs + Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className={`px-5 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all
                  ${activeTab === t.key ? `border-indigo-500 ${t.color}` : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {t.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black
                  ${activeTab === t.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          {activeData.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-slate-400">
              <span className="text-4xl mb-3">📭</span>
              <p className="font-bold">No data for this category yet</p>
              <p className="text-xs mt-1">Check back after the campaign is fully processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5 text-left">Contact</th>
                    <th className="py-3 px-5 text-left">Phone</th>
                    {activeTab === "replies" ?
                      <th className="py-3 px-5 text-left">Reply Message</th> :
                      <th className="py-3 px-5 text-left">Status</th>
                    }
                    {activeTab === "clicked" && <th className="py-3 px-5 text-left">URL Clicked</th>}
                    <th className="py-3 px-5 text-left">Time (IST)</th>
                    {activeTab !== "replies" && <th className="py-3 px-5 text-right">Cost</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeData.map((item: any) => {
                    const contact: Contact = item.contact;
                    const isReply = activeTab === "replies";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">
                              {(contact.name || contact.phone)?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700">{contact.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-slate-500 font-mono text-xs">{contact.phone}</td>
                        {isReply ? (
                          <td className="py-3 px-5 text-slate-700 max-w-xs truncate">{item.body}</td>
                        ) : (
                          <td className="py-3 px-5">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${STATUS_COLORS[item.status] || "bg-slate-50 text-slate-600"}`}>
                              {item.status}
                            </span>
                          </td>
                        )}
                        {activeTab === "clicked" && (
                          <td className="py-3 px-5 text-xs text-blue-600 max-w-[200px] truncate">
                            {item.clickLogs?.[0]?.url || "—"}
                          </td>
                        )}
                        <td className="py-3 px-5 text-xs text-slate-400">{formatDateIST(item.createdAt)}</td>
                        {!isReply && (
                          <td className="py-3 px-5 text-xs font-bold text-amber-600 text-right">
                            {formatINR(item.cost || 0)}
                          </td>
                        )}
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
