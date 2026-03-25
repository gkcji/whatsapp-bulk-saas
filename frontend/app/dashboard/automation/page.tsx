"use client";

import { useState } from "react";

export default function AutomationRulesPage() {
  const [createMode, setCreateMode] = useState(false);

  // Empty array as no backend API exists yet
  const rules: any[] = [];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Automation & Auto-Tags</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Create global conditional rules to automatically manage CRM tags based on user engagement.</p>
        </div>
        <div>
           {!createMode ? (
             <button onClick={() => setCreateMode(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2">
               <span>⚡</span> Create Rule
             </button>
           ) : (
             <button onClick={() => setCreateMode(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
               Cancel
             </button>
           )}
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* CREATE RULE BUILDER WIDGET */}
        {createMode && (
          <div className="bg-white p-8 rounded-2xl border border-indigo-200 shadow-xl mb-10 animate-fade-in-up flex flex-col gap-6">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">⚙️</span> New Rule
             </h2>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Trigger */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">1. Select Trigger / Event</label>
                   <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                      <option>On Message Reply</option>
                      <option>On Link Click</option>
                      <option>On Button Click</option>
                      <option>On Campaign Sent</option>
                      <option>On Flow Execution</option>
                   </select>
                </div>

                {/* 2. Condition */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">2. Rule Condition</label>
                   <div className="flex gap-2 mb-2">
                      <select className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold focus:outline-none shadow-sm">
                         <option>Payload ID</option>
                         <option>URL Path</option>
                         <option>Campaign Name</option>
                      </select>
                      <select className="w-[100px] bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 font-bold focus:outline-none shadow-sm">
                         <option>is exactly</option>
                         <option>contains</option>
                      </select>
                   </div>
                   <input type="text" placeholder="e.g. buy_now" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>

                {/* 3. Action */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500">
                   <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-3">3. CRM Action (Auto Tag)</label>
                   <select className="w-full bg-white border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm mb-3">
                      <option>Add Tag</option>
                      <option>Remove Tag</option>
                      <option>Assign Agent</option>
                   </select>
                   <input type="text" placeholder="e.g. VIP_Lead" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
                </div>

             </div>

             <div className="flex justify-end pt-2 border-t border-slate-100">
               <button onClick={() => setCreateMode(false)} className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all">
                  Save Auto-Tag Rule
               </button>
             </div>
          </div>
        )}

        {/* RULES TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Global Auto-Tag Configurations</h2>
              <input type="text" placeholder="Search rules..." className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
           </div>
           
           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-slate-700">
                 <thead>
                    <tr className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                       <th className="py-4 px-6">Rule Name & Status</th>
                       <th className="py-4 px-4 text-indigo-600">IF (Trigger)</th>
                       <th className="py-4 px-4 text-blue-600">AND (Condition)</th>
                       <th className="py-4 px-4 text-emerald-600">THEN (Action)</th>
                       <th className="py-4 px-6 text-right">Toggle</th>
                    </tr>
                 </thead>
                 <tbody>
                    {rules.length === 0 ? (
                       <tr><td colSpan={5} className="py-8 text-center text-slate-500 font-medium">No global automation rules configured.</td></tr>
                    ) : rules.map(rule => (
                       <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-6">
                             <p className="font-bold text-sm text-slate-800 mb-1">{rule.name}</p>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${rule.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{rule.status}</span>
                          </td>
                          <td className="py-5 px-4 font-bold text-xs text-indigo-700 bg-indigo-50/50">
                             ⚡ {rule.trigger}
                          </td>
                          <td className="py-5 px-4 font-medium text-xs text-slate-600 italic">
                             {rule.condition}
                          </td>
                          <td className="py-5 px-4 font-bold text-xs text-emerald-700 bg-emerald-50/50">
                             🏷️ {rule.action}
                          </td>
                          <td className="py-5 px-6 text-right">
                             <button className={`w-12 h-6 rounded-full relative transition-colors ${rule.status === 'Active' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${rule.status === 'Active' ? 'left-7' : 'left-1'}`}></span>
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
