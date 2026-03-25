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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("financial");

  // Ledger tools
  const [targetUserId, setTargetUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

  // Users Tab
  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Plans Tab
  const [plansList, setPlansList] = useState<any[]>([]);
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanLimit, setNewPlanLimit] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    checkAdmin();
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
       if (activeTab === "users" && usersList.length === 0) loadUsers();
       if (activeTab === "plans" && plansList.length === 0) loadPlans();
    }
  }, [activeTab, user]);

  const checkAdmin = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/auth/me");
      const d = await res.json();
      if (d.user?.role !== "ADMIN") {
         alert("Access Denied: You do not have SUPER ADMIN privileges.");
         router.push("/dashboard");
         return;
      }
      setUser(d.user);
    } catch(e) {
      router.push("/login");
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await apiFetch("/admin/users");
      const d = await res.json();
      setUsersList(d.users || []);
    } catch(e) {}
    setFetchingUsers(false);
  };

  const loadPlans = async () => {
    setFetchingPlans(true);
    try {
      const res = await apiFetch("/admin/plans");
      const d = await res.json();
      setPlansList(d.plans || []);
    } catch(e) {}
    setFetchingPlans(false);
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
        if (activeTab === "users") loadUsers(); // refresh
      }
    } catch(e) { alert("Error adjusting"); }
    setAdjusting(false);
  };

  const handleCreatePlan = async () => {
    if (!newPlanName || !newPlanPrice || !newPlanLimit) return alert("Fill all fields");
    setCreatingPlan(true);
    try {
       const res = await apiFetch("/admin/plans", {
         method: "POST",
         body: JSON.stringify({ name: newPlanName, price: newPlanPrice, msgLimit: newPlanLimit })
       });
       const d = await res.json();
       if (d.success) {
          setNewPlanName(""); setNewPlanPrice(""); setNewPlanLimit("");
          loadPlans();
       } else alert(d.error || "Failed to create plan");
    } catch(e) { alert("Error"); }
    setCreatingPlan(false);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure? Users on this plan might be affected.")) return;
    try {
       await apiFetch(`/admin/plans/${id}`, { method: "DELETE" });
       loadPlans();
    } catch(e) {}
  };

  const handleSuspendUser = async (id: string) => {
    if (!confirm("Suspend this user? They will not be able to log in or dispatch messages.")) return;
    try {
       await apiFetch(`/admin/users/${id}/suspend`, { method: "POST" });
       alert("User suspended.");
       loadUsers();
    } catch(e) {}
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white font-mono">Authenticating Root Status...</div>;

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      
      {/* Mini Admin Sidebar */}
      <aside className="w-[280px] bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 relative z-20 shadow-2xl">
         <div className="h-20 flex items-center px-8 border-b border-slate-800">
            <h1 className="text-xl font-black text-rose-500 tracking-widest uppercase flex items-center gap-3">
               <span className="text-2xl">⚡</span> SUPER ADMIN
            </h1>
         </div>
         <nav className="p-4 space-y-2 flex-1 mt-4">
            <button 
               onClick={() => setActiveTab('financial')}
               className={`w-full px-4 py-3 font-bold rounded-xl flex items-center gap-3 transition-colors text-left ${activeTab === 'financial' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}>
               <span>💰</span> Financial Ledger
            </button>
            <button 
               onClick={() => setActiveTab('users')}
               className={`w-full px-4 py-3 font-bold rounded-xl flex items-center gap-3 transition-colors text-left ${activeTab === 'users' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}>
               <span>👥</span> Tenant Users
            </button>
            <button 
               onClick={() => setActiveTab('plans')}
               className={`w-full px-4 py-3 font-bold rounded-xl flex items-center gap-3 transition-colors text-left ${activeTab === 'plans' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}>
               <span>📦</span> Package Control
            </button>
            <button 
               onClick={() => setActiveTab('calculator')}
               className={`w-full px-4 py-3 font-bold rounded-xl flex items-center gap-3 transition-colors text-left ${activeTab === 'calculator' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}>
               <span>📊</span> Profit Calculator
            </button>
         </nav>
         <div className="p-6 border-t border-slate-800">
            <button onClick={() => router.push("/dashboard")} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all shadow-md text-sm border border-slate-700">
               ← Return to User Dashboard
            </button>
         </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 bg-blend-multiply">
         
         <div className="max-w-[1200px] mx-auto space-y-8">
            <div className="flex justify-between items-end mb-10">
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">
                     {activeTab === 'financial' && "Financial Ledger"}
                     {activeTab === 'users' && "Tenant User Management"}
                     {activeTab === 'plans' && "Global Package Control"}
                  </h2>
                  <p className="text-slate-400 mt-2 font-medium">Bypass tenant restrictions to manage global SaaS databases and billing.</p>
               </div>
               <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-sm">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Logged in Root</p>
                  <p className="font-bold text-slate-300 text-sm">{user?.email}</p>
               </div>
            </div>

            {/* TAB: FINANCIAL LEDGER */}
            {activeTab === 'financial' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ADJ LEDGER */}
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-5">
                        <span className="text-8xl">💳</span>
                     </div>
                     <h3 className="font-bold text-white text-xl mb-2 relative z-10 border-b border-slate-700 pb-3">Ledger Adjustment</h3>
                     <p className="text-sm font-medium text-slate-400 mb-6 relative z-10">Inject or deduct USD credits from a specific tenant database. Changes reflect instantly on their live running campaigns.</p>
                     
                     <div className="space-y-4 relative z-10">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Tenant ID (UUID)</label>
                           <input 
                              type="text" 
                              value={targetUserId} 
                              onChange={e => setTargetUserId(e.target.value)} 
                              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono transition-shadow placeholder-slate-700" 
                           />
                        </div>
                        
                        <div className="flex gap-4">
                           <div className="flex-1">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Adjustment Amount ($)</label>
                              <input 
                                 type="number" 
                                 value={adjustAmount || ""} 
                                 onChange={e => setAdjustAmount(parseFloat(e.target.value))} 
                                 placeholder="Positive or Negative" 
                                 className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow placeholder-slate-700" 
                              />
                           </div>
                        </div>

                        <button onClick={handleAdminAdjust} disabled={adjusting} className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                           {adjusting ? <span className="animate-spin">⏳</span> : <span>⚖️</span>} 
                           {adjusting ? "Executing..." : "Execute Ledger Mutation"}
                        </button>
                     </div>
                  </div>

                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl border-t-4 border-t-rose-500 relative overflow-hidden">
                     <h3 className="font-bold text-white text-xl mb-2 relative z-10 border-b border-slate-700 pb-3">Find Tenant ID</h3>
                     <p className="text-sm font-medium text-slate-400 mb-6 relative z-10">Need a user's UUID for billing injection? Navigate to the "Tenant Users" tab on the left to copy their secure system ID.</p>
                     <button onClick={() => setActiveTab('users')} className="px-8 py-3 bg-slate-900 hover:bg-slate-950 border border-slate-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg text-xs">
                        View Tenant Roster →
                     </button>
                  </div>
               </div>
            )}

            {/* TAB: TENANT USERS */}
            {activeTab === 'users' && (
               <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                     <h3 className="font-bold text-white text-xl">Global Directory</h3>
                     <button onClick={loadUsers} disabled={fetchingUsers} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">↻ Refresh</button>
                  </div>
                  <div className="overflow-x-auto flex-1 p-6">
                     <table className="w-full text-left font-mono">
                        <thead>
                           <tr className="text-slate-500 font-bold uppercase tracking-widest text-[10px] border-b border-slate-700">
                              <th className="py-4 px-4 font-sans">Tenant Profile</th>
                              <th className="py-4 px-4">UUID (Ledger ID)</th>
                              <th className="py-4 px-4">Wallet Balance</th>
                              <th className="py-4 px-4">Plan Name</th>
                              <th className="py-4 px-4">Msgs Sent</th>
                              <th className="py-4 px-4 text-right font-sans">Action</th>
                           </tr>
                        </thead>
                        <tbody className="text-xs text-slate-300">
                           {fetchingUsers ? <tr><td colSpan={6} className="py-6 text-center text-slate-500">Loading directory...</td></tr> : 
                            usersList.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-slate-500">No users found.</td></tr> :
                            usersList.map((u: any) => (
                              <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                 <td className="py-4 px-4 font-sans">
                                    <p className="font-bold text-white text-sm">{u.name}</p>
                                    <p className="text-slate-400">{u.email}</p>
                                    {u.role === 'ADMIN' && <span className="inline-block mt-1 px-1.5 py-0.5 rounded border border-rose-500/50 text-rose-400 text-[9px] uppercase tracking-widest">Root</span>}
                                    {u.role === 'SUSPENDED' && <span className="inline-block mt-1 px-1.5 py-0.5 rounded border border-red-500/50 bg-red-500/10 text-red-500 text-[9px] uppercase tracking-widest">Suspended</span>}
                                 </td>
                                 <td className="py-4 px-4 text-emerald-400/80 cursor-pointer hover:text-emerald-400" onClick={() => { navigator.clipboard.writeText(u.id); alert('UUID Copied'); }}>
                                    {u.id.slice(0, 13)}... <span className="text-[10px]">📋</span>
                                 </td>
                                 <td className="py-4 px-4 font-bold text-white">${u.wallet?.toFixed(2) || "0.00"}</td>
                                 <td className="py-4 px-4 font-sans">
                                    <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-slate-300">{u.plan || 'Free Tier'}</span>
                                 </td>
                                 <td className="py-4 px-4 font-bold">{u.totalMessagesSent?.toLocaleString() || 0}</td>
                                 <td className="py-4 px-4 text-right">
                                    {u.role !== 'ADMIN' && u.role !== 'SUSPENDED' && (
                                       <button onClick={() => handleSuspendUser(u.id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-sans font-bold text-xs rounded transition-colors shadow">
                                          Suspend
                                       </button>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {/* TAB: PACKAGE CONTROLS */}
            {activeTab === 'plans' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Create Plan */}
                  <div className="lg:col-span-1 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                     <h3 className="font-bold text-white text-xl mb-6 relative z-10 border-b border-slate-700 pb-3">Forge New Plan / Tier</h3>
                     
                     <div className="space-y-4 relative z-10">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Display Name</label>
                           <input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="e.g. Enterprise Pro" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Monthly Price ($)</label>
                           <input type="number" value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} placeholder="99.00" className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Max Message Limit</label>
                           <input type="number" value={newPlanLimit} onChange={e => setNewPlanLimit(e.target.value)} placeholder="100000" className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>

                        <button onClick={handleCreatePlan} disabled={creatingPlan} className="w-full mt-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                           {creatingPlan ? "Forging..." : "Launch Plan into Orbit"}
                        </button>
                     </div>
                  </div>

                  {/* Active Plans List */}
                  <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
                     <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h3 className="font-bold text-white text-xl">Active Platform Packages</h3>
                        <button onClick={loadPlans} disabled={fetchingPlans} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">↻ Sync Pricing</button>
                     </div>
                     <div className="p-6 space-y-4 overflow-y-auto">
                        {fetchingPlans ? <div className="text-slate-500 text-center">Loading plans...</div> : 
                         plansList.length === 0 ? <div className="text-slate-500 text-center">No plans defined in the database.</div> :
                         plansList.map((plan: any) => (
                           <div key={plan.id} className="flex items-center justify-between p-5 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-900 transition-colors">
                              <div>
                                 <h4 className="font-bold text-white text-lg">{plan.name}</h4>
                                 <p className="text-xs font-mono text-slate-400 tracking-widest uppercase mt-1">UUID: {plan.id.slice(0, 8)}... | Limit: {plan.msgLimit.toLocaleString()} msgs</p>
                              </div>
                              <div className="flex items-center gap-6">
                                 <div className="text-right">
                                    <p className="text-2xl font-black text-emerald-400">${plan.price.toFixed(2)}<span className="text-xs text-slate-500">/mo</span></p>
                                 </div>
                                 <button onClick={() => handleDeletePlan(plan.id)} className="w-10 h-10 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center transition-colors border border-slate-700 hover:border-rose-500/50 shadow" title="Delete Plan">
                                    🗑️
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
            
            {/* TAB: PROFIT CALCULATOR */}
            {activeTab === 'calculator' && (
               <AdminProfitCalculator />
            )}

         </div>
      </main>
    </div>
  );
}

function AdminProfitCalculator() {
   const [volume, setVolume] = useState(10000);
   const [metaCost, setMetaCost] = useState(0.48); // Marketing hi_IN approx
   const [markup, setMarkup] = useState(0.12);
   const [subPrice, setSubPrice] = useState(1499);

   const totalMetaBill = volume * metaCost;
   const totalMarkupRev = volume * markup;
   const totalRevenue = totalMarkupRev + subPrice;
   const margin = (totalRevenue / (totalMetaBill + subPrice)) * 100;

   return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="font-bold text-white text-xl mb-6 border-b border-slate-700 pb-3">SaaS Revenue Simulator</h3>
            <div className="space-y-5">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Monthly Message Volume</label>
                  <input type="range" min="1000" max="1000000" step="1000" value={volume} onChange={e => setVolume(parseInt(e.target.value))} className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                  <div className="flex justify-between mt-2 font-mono text-emerald-400 font-bold">{volume.toLocaleString()} msgs</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Meta Raw Cost (₹)</label>
                     <input type="number" step="0.01" value={metaCost} onChange={e => setMetaCost(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Markup (₹)</label>
                     <input type="number" step="0.01" value={markup} onChange={e => setMarkup(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500" />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Monthly Subscription Fee (₹)</label>
                  <input type="number" value={subPrice} onChange={e => setSubPrice(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500" />
               </div>
            </div>
         </div>

         <div className="bg-slate-950 p-8 rounded-2xl border border-rose-500/20 shadow-2xl flex flex-col justify-center items-center text-center">
            <p className="text-rose-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Estimated Monthly Net Profit</p>
            <h4 className="text-6xl font-black text-white tracking-tighter mb-4">₹{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
            
            <div className="grid grid-cols-2 gap-8 w-full mt-8 border-t border-slate-800 pt-8">
               <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Platform Margin</p>
                  <p className="text-2xl font-black text-emerald-400">{margin.toFixed(1)}%</p>
               </div>
               <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Markup Income</p>
                  <p className="text-2xl font-black text-indigo-400">₹{totalMarkupRev.toLocaleString()}</p>
               </div>
            </div>
            
            <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800 w-full text-left">
               <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Technical Insight</p>
               <p className="text-xs text-slate-400 leading-relaxed">
                  Total Meta Conversation Bill for this tenant will be <span className="text-white font-bold">₹{totalMetaBill.toLocaleString()}</span>. 
                  This is paid directly by the user to Facebook. Your profit is pure overhead.
               </p>
            </div>
         </div>
      </div>
   );
}
