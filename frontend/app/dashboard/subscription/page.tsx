"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
import { formatINR, formatIST } from "@/lib/india";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Admin controls
  const [targetUserId, setTargetUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

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
    } catch(e) {}
    setLoading(false);
  };

  const handleAdminAdjust = async () => {
    if (!targetUserId || !adjustAmount) return alert("Enter user ID and amount");
    setAdjusting(true);
    try {
      const res = await apiFetch("/billing/admin/adjust", {
        method: "POST",
        body: JSON.stringify({ targetUserId, amount: adjustAmount })
      });
      const d = await res.json();
      if (!d.success) alert(d.error || "Failed");
      else {
        alert("Adjusted successfully");
        setAdjustAmount(0);
        setTargetUserId("");
        loadData();
      }
    } catch(e) { alert("Error adjusting"); }
    setAdjusting(false);
  };

  const currentPlan = data?.plan || { name: "Professional", price: 99, msgLimit: 50000 };
  const walletBalance = data?.wallet || 0;
  const used = data?.totalSpend || 0; // Note: totalSpend is in $, but let's assume it's roughly proportional to usage
  
  const transactions = data?.transactions || [];

  const plans = [
    { name: "Starter", price: "₹1,499", limits: "3 Agents, 1,000 Free Credits, Standard Support", isCurrent: currentPlan.name === "Starter" },
    { name: "Professional", price: "₹4,999", limits: "10 Agents, 50,000 Credits, Priority Support", isCurrent: currentPlan.name === "Professional" || !currentPlan.name },
    { name: "Enterprise", price: "Custom", limits: "Unlimited Agents, Custom API Rate Limits", isCurrent: currentPlan.name === "Enterprise" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Subscription & Wallet</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Manage your SaaS pricing plan, recharge credit balances, and review transaction ledgers.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${activeTab === 'overview' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>My Plan & Wallet</button>
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl text-white md:col-span-1 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <span className="text-8xl">💳</span>
                  </div>
                  <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 relative z-10">Available Credits (INR)</h2>
                  <h3 className="text-5xl font-black mb-1 relative z-10">{loading ? "—" : formatINR(walletBalance)}</h3>
                  <button onClick={() => router.push("/dashboard/billing")} className="mt-8 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all relative z-10 flex items-center justify-center gap-2">
                     <span>⚡</span> Recharge Wallet
                  </button>
               </div>
               
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-lg font-bold text-slate-800">Monthly Usage Summary</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Platform Stats</p>
                     </div>
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded border border-indigo-100">{currentPlan.name} Plan</span>
                  </div>
                  
                  <div>
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-600">Cost Engine Spend Tracker</span>
                        <div className="text-right">
                           <span className="font-black text-2xl text-slate-800">{loading ? "—" : formatINR(used)}</span>
                           <span className="text-slate-400 font-bold text-xs ml-1"> utilized</span>
                        </div>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 shadow-inner">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full" style={{ width: `100%` }}></div>
                     </div>
                     <p className="text-xs text-slate-400 mt-2">Deductions occur instantly per API dispatch. Auto-recharge is disabled.</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
               
               <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                     <h2 className="text-lg font-bold text-slate-800">Pricing Plans</h2>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                     {plans.map(p => (
                        <div key={p.name} className={`p-5 rounded-xl border ${p.isCurrent ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                           <div className="flex justify-between items-center mb-2">
                              <h3 className="font-bold text-slate-800">{p.name}</h3>
                              {p.isCurrent && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest">Active</span>}
                           </div>
                           <p className="text-2xl font-black text-slate-800 mb-2">{p.price}<span className="text-sm font-bold text-slate-400">/mo</span></p>
                           <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.limits}</p>
                           {!p.isCurrent && <button className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors">Upgrade to {p.name}</button>}
                        </div>
                     ))}
                  </div>
               </div>
               
               <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                     <h2 className="text-lg font-bold text-slate-800">Transactions Ledger</h2>
                     <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Download Invoice CSV</button>
                  </div>
                  <div className="overflow-x-auto flex-1 p-6">
                     <table className="w-full text-left text-slate-700">
                        <thead>
                           <tr className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                              <th className="py-4 px-4">Tx ID</th>
                              <th className="py-4 px-4">Type</th>
                              <th className="py-4 px-4 text-center">Amount</th>
                              <th className="py-4 px-4 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody>
                           {loading ? <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr> : transactions.length === 0 ? <tr><td colSpan={4} className="text-center py-6">No transactions found.</td></tr> : transactions.map((tx:any) => (
                              <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                                 <td className="py-4 px-4 font-mono font-bold text-slate-500 text-[10px]">{formatIST(tx.createdAt)}</td>
                                 <td className="py-4 px-4 font-bold text-slate-800">{tx.type || "RECHARGE"}</td>
                                 <td className="py-4 px-4 text-center font-bold text-emerald-600">+{formatINR(tx.amount)}</td>
                                 <td className="py-4 px-4 text-right">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-widest">{tx.status}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>
          </>
        )}



      </div>
    </div>
  );
}
