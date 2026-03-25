"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
import { formatINR, formatIST, formatIndian, MSG_COST_INR } from "@/lib/india";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function BillingCostPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/billing/summary");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const recharge = async () => {
    if (amount <= 0) return alert("Enter valid amount");
    setAdding(true);
    try {
      await apiFetch("/billing/recharge", { method: "POST", body: JSON.stringify({ amount }) });
      setAmount(0);
      loadData();
    } catch {}
    setAdding(false);
  };

  const totalCost = formatINR(data?.totalSpend || 0);
  
  const categoryCost = [
    { category: "MARKETING", conversations: data?.campaignCosts?.filter((c:any) => c.status === 'COMPLETED' || c.status === 'RUNNING').length || 0, total: formatINR(data?.totalSpend || 0) },
    { category: "UTILITY", conversations: 0, total: "₹0.00" },
    { category: "AUTHENTICATION", conversations: 0, total: "₹0.00" },
    { category: "SERVICE", conversations: 0, total: "₹0.00" },
  ];

  const countryPricing = [
    { country: "🇮🇳 India", marketing: `₹${MSG_COST_INR.MARKETING}`, utility: `₹${MSG_COST_INR.UTILITY}`, auth: `₹${MSG_COST_INR.AUTHENTICATION}`, service: "Free" },
  ];

  const txs = data?.transactions || [];
  const campaigns = data?.campaignCosts || [];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cost Tracking & Billing</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Monitor Meta conversation charges, country rates, and campaign expenses.</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
           <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-bold text-sm rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Overview</button>
           <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 font-bold text-sm rounded-md transition-all ${activeTab === 'logs' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Transactions</button>
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-indigo-600 p-8 rounded-2xl border border-indigo-700 shadow-lg text-white relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2">Total Meta API Cost (All Time)</p>
                      <h3 className="text-4xl font-black tracking-tight">{loading ? "—" : totalCost}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-200 font-bold uppercase tracking-widest text-[10px] mb-1">Wallet Balance</p>
                      <h3 className="text-xl font-black text-emerald-300">{loading ? "—" : formatINR(data?.wallet || 0)}</h3>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex gap-2 relative z-10">
                    <input type="number" value={amount || ''} onChange={(e) => setAmount(parseFloat(e.target.value))} placeholder="Amount ₹" className="w-24 px-3 py-2 bg-indigo-700 border border-indigo-500 rounded text-sm text-white focus:outline-none" />
                    <button onClick={recharge} disabled={adding} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded text-sm font-bold shadow disabled:opacity-50">
                      {adding ? "Recharging..." : "Add Credits"}
                    </button>
                  </div>
               </div>
               
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Category Cost Breakdown</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                     {categoryCost.map(cat => (
                        <div key={cat.category} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                           <p className="text-[10px] font-bold text-slate-500 uppercase">{cat.category}</p>
                           <p className="text-xl font-black text-slate-800 mt-1">{loading ? "—" : cat.total}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-1">{loading ? "—" : cat.conversations.toLocaleString()} convos</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">Country Pricing Table</h2>
                        <p className="text-xs text-slate-500 mt-1">Official Meta Per-Message Rates (Effective Jan 2026)</p>
                      </div>
                      <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-100 rounded uppercase tracking-widest animate-pulse">2026 Updated</span>
                   </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-slate-700">
                        <thead>
                           <tr className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                              <th className="py-4 px-6">Country</th>
                              <th className="py-4 px-4 text-emerald-600">Marketing</th>
                              <th className="py-4 px-4 text-blue-600">Utility</th>
                              <th className="py-4 px-4 text-amber-600">Auth</th>
                              <th className="py-4 px-4 text-slate-600">Service</th>
                           </tr>
                        </thead>
                        <tbody>
                           {countryPricing.map(c => (
                              <tr key={c.country} className="border-b border-slate-100 hover:bg-slate-50">
                                 <td className="py-3 px-6 font-bold text-sm text-slate-800">{c.country}</td>
                                 <td className="py-3 px-4 text-sm font-mono text-slate-600">{c.marketing}</td>
                                 <td className="py-3 px-4 text-sm font-mono text-slate-600">{c.utility}</td>
                                 <td className="py-3 px-4 text-sm font-mono text-slate-600">{c.auth}</td>
                                 <td className="py-3 px-4 text-sm font-mono text-slate-600">{c.service}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-3">
                     <span className="text-amber-600 font-bold text-[10px] uppercase tracking-widest px-1">GST NOTICE:</span>
                     <p className="text-[10px] text-amber-700 font-medium">Charges shown are base costs per-message. Meta adds 18% GST to your final bill starting Jan 2026.</p>
                  </div>
               </div>
               
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                     <h2 className="text-lg font-bold text-slate-800">Campaign Cost Attribution</h2>
                  </div>
                  <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                     {loading ? <p>Loading...</p> : campaigns.length === 0 ? <p className="text-slate-500 text-sm">No campaigns ran yet.</p> : campaigns.map((camp:any) => (
                        <div key={camp.id} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl">
                           <div>
                              <p className="font-bold text-slate-800 text-sm">{camp.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 px-2 py-0.5 border border-slate-200 rounded block w-max bg-white">{camp.status}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-rose-600">{formatINR(camp.totalCost || 0)}</p>
                              <p className="text-[10px] text-slate-500 font-bold">{formatIST(camp.createdAt)}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
          </>
        )}

        {activeTab === 'logs' && (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Wallet Transactions</h2>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-700">
                     <thead>
                        <tr className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                           <th className="py-4 px-6">Timestamp</th>
                           <th className="py-4 px-4">Type</th>
                           <th className="py-4 px-4">Status</th>
                           <th className="py-4 px-6 text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody>
                        {loading ? <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr> : txs.length === 0 ? <tr><td colSpan={4} className="p-6 text-center">No transactions yet.</td></tr> : txs.map((t:any) => (
                           <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 text-sm text-slate-500 font-medium">{formatIST(t.createdAt)}</td>
                              <td className="py-4 px-4 font-bold text-slate-700">Wallet Recharge</td>
                              <td className="py-4 px-4">
                                 <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200">{t.status}</span>
                              </td>
                              <td className="py-4 px-6 font-bold text-emerald-600 text-right font-mono">
                                 +{formatINR(t.amount)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
           </div>
        )}

      </div>
    </div>
  );
}
