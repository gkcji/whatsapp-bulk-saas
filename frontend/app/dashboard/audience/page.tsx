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

export default function AudienceBuilderPage() {
  const router = useRouter();
  const [createMode, setCreateMode] = useState(false);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Filters State
  const [filters, setFilters] = useState([{ id: 1, type: "tagId", condition: "is exactly", value: "" }]);
  const [name, setName] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [estSize, setEstSize] = useState<number | null>(null);

  const filterOptions = [
    { label: "Has tag ID", value: "tagId" },
    { label: "Received campaign ID", value: "campaignId" },
    { label: "Has replied (bool)", value: "hasReplied" },
    { label: "Has not replied (bool)", value: "noReply" },
    { label: "Clicked a link (bool)", value: "clickedLink" },
    { label: "Pressed a button (bool)", value: "pressedButton" }
  ];

  const loadAudiences = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/audience");
      const d = await res.json();
      setAudiences(d.audiences || []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadAudiences();
  }, []);

  const addFilter = () => {
     setFilters([...filters, { id: Date.now(), type: "tagId", condition: "is exactly", value: "" }]);
  };

  const removeFilter = (id: number) => {
     setFilters(filters.filter(f => f.id !== id));
  };

  const calculateEstimate = async () => {
    setCalculating(true);
    const body: any = {};
    for (const f of filters) {
      if (!f.value && !["hasReplied", "noReply", "clickedLink", "pressedButton"].includes(f.type)) continue;
      if (["hasReplied", "noReply", "clickedLink", "pressedButton"].includes(f.type)) {
        body[f.type] = true;
      } else {
        body[f.type] = f.value;
      }
    }
    try {
      const r = await apiFetch("/audience/build", { method: "POST", body: JSON.stringify({ filters: body }) });
      const d = await r.json();
      setEstSize(d.count || 0);
    } catch {
      setEstSize(0);
    }
    setCalculating(false);
  };

  const saveAudience = async () => {
    if (!name) return alert("Please enter a name for the audience");
    setCalculating(true);
    const body: any = {};
    for (const f of filters) {
      if (!f.value && !["hasReplied", "noReply", "clickedLink", "pressedButton"].includes(f.type)) continue;
      if (["hasReplied", "noReply", "clickedLink", "pressedButton"].includes(f.type)) {
        body[f.type] = true;
      } else {
        body[f.type] = f.value;
      }
    }
    try {
      await apiFetch("/audience/build", { method: "POST", body: JSON.stringify({ name, filters: body }) });
      setCreateMode(false);
      setName("");
      setFilters([{ id: 1, type: "tagId", condition: "is exactly", value: "" }]);
      setEstSize(null);
      loadAudiences();
    } catch {}
    setCalculating(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Custom Audiences</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Build deeply segmented audiences using real-time engagement data.</p>
        </div>
        <div>
           {!createMode ? (
             <button onClick={() => setCreateMode(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
               <span>🎯</span> Build Audience
             </button>
           ) : (
             <button onClick={() => setCreateMode(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
               Cancel
             </button>
           )}
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* AUDIENCE BUILDER ENGINE WIDGET */}
        {createMode && (
          <div className="bg-white p-8 rounded-2xl border border-indigo-200 shadow-xl mb-10 flex flex-col gap-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">🧲</span> Custom Audience Engine
                </h2>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                   <span className="text-sm font-bold text-slate-500">Estimated Match:</span>
                   <span className="text-lg font-black text-indigo-600">{estSize !== null ? estSize : "—"} <span className="text-xs text-slate-400">users</span></span>
                   <button onClick={calculateEstimate} disabled={calculating} className="ml-2 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs font-bold disabled:opacity-50">
                     {calculating ? "Calc..." : "Calculate"}
                   </button>
                </div>
             </div>
             
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col gap-4">
                
                {filters.map((f, index) => (
                   <div key={f.id} className="flex items-center gap-3">
                      {index > 0 && <span className="text-xs font-bold text-slate-400 w-10 text-center uppercase tracking-widest">AND</span>}
                      {index === 0 && <span className="w-10"></span>}
                      
                      <select 
                         value={f.type} 
                         onChange={(e) => {
                            const newFilters = [...filters];
                            newFilters[index].type = e.target.value;
                            setFilters(newFilters);
                         }}
                         className="w-[200px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none shadow-sm"
                      >
                         {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>

                      {["hasReplied", "noReply", "clickedLink", "pressedButton"].includes(f.type) ? (
                        <div className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-400 italic shadow-sm">
                          (Boolean Flag)
                        </div>
                      ) : (
                        <input 
                           type="text" 
                           value={f.value}
                           onChange={(e) => {
                              const newFilters = [...filters];
                              newFilters[index].value = e.target.value;
                              setFilters(newFilters);
                           }}
                           placeholder="Enter exact ID..." 
                           className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                        />
                      )}

                      <button onClick={() => removeFilter(f.id)} className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                   </div>
                ))}

                <div className="pl-[52px] mt-2">
                   <button onClick={addFilter} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200">
                      + Add Filter Rule
                   </button>
                </div>
                
             </div>

             <div className="flex justify-between items-center pt-2 border-t border-slate-100">
               <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name this Custom Audience..." className="w-[300px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
               <button onClick={saveAudience} disabled={calculating || !name} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all">
                  Save Audience
               </button>
             </div>
          </div>
        )}

        {/* CUSTOM AUDIENCE TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Saved Custom Audiences</h2>
           </div>
           
           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-slate-700">
                 <thead>
                    <tr className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                       <th className="py-4 px-6">Audience Name</th>
                       <th className="py-4 px-4 text-center">Calculated Array</th>
                       <th className="py-4 px-4 text-center">Created At</th>
                       <th className="py-4 px-6 text-right">Targeting Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                    ) : audiences.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8">No audiences built yet.</td></tr>
                    ) : audiences.map((aud: any) => (
                       <tr key={aud.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-6">
                             <p className="font-bold text-sm text-slate-800 mb-1">{aud.name}</p>
                             <p className="text-[10px] font-mono text-slate-400 truncate max-w-[250px]">{aud.id}</p>
                          </td>
                          <td className="py-5 px-4 text-center">
                             <span className="bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-black border border-indigo-200 rounded-lg">
                                {aud._count?.contacts || 0}
                             </span>
                          </td>
                          <td className="py-5 px-4 font-bold text-[10px] text-slate-400 text-center uppercase tracking-widest">
                             {new Date(aud.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-5 px-6 text-right">
                             <button onClick={() => router.push("/dashboard/campaigns")} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ml-auto">
                                <span>🚀</span> Send to Audience
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}
