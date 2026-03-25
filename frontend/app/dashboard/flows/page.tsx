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

type FlowStep = {
  id: string;
  type: string;
  config: any;
};

export default function FlowBuilderPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("New Flow Sequence");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/flows");
      const d = await res.json();
      setFlows(d.flows || []);
      if (d.flows?.length > 0 && !activeFlowId) {
        openFlow(d.flows[0]);
      } else if (d.flows?.length === 0) {
        initNewFlow();
      }
    } catch(e) {}
    setLoading(false);
  };

  const openFlow = (f: any) => {
    setActiveFlowId(f.id);
    setFlowName(f.name);
    try {
      setSteps(JSON.parse(f.nodes || "[]"));
    } catch {
      setSteps([]);
    }
  };

  const initNewFlow = () => {
    setActiveFlowId(null);
    setFlowName("New Flow Sequence");
    setSteps([{ id: Date.now().toString(), type: "SEND", config: { message: "Hello! Welcome to our automated flow." } }]);
  };

  const saveFlow = async () => {
    setIsSaving(true);
    try {
      const body = { name: flowName, nodes: steps, edges: [] };
      if (activeFlowId) {
        await apiFetch(`/flows/${activeFlowId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        const res = await apiFetch(`/flows`, { method: "POST", body: JSON.stringify(body) });
        const d = await res.json();
        if (d.success) setActiveFlowId(d.flow.id);
      }
      loadFlows();
    } catch(e) {}
    setIsSaving(false);
  };

  const deleteFlow = async () => {
    if (!activeFlowId || !confirm("Delete flow?")) return;
    try {
      await apiFetch(`/flows/${activeFlowId}`, { method: "DELETE" });
      initNewFlow();
      loadFlows();
    } catch {}
  };

  const addStep = (type: string, config: any) => {
    setSteps([...steps, { id: Date.now().toString(), type, config }]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const stepIcons: any = {
      "SEND": "📤",
      "REPLY": "💬",
      "BUTTON": "🔘",
      "DELAY": "⏳",
      "CONDITION": "🔀",
      "TAG": "🏷️",
      "SCHEDULER": "🗓️",
      "STOP": "🛑"
  };

  const availableBlocks = [
     { type: "SEND", label: "Send Message", desc: "Text or Template", defConfig: { message: "Your text here" } },
     { type: "BUTTON", label: "Button Step", desc: "Interactive Options", defConfig: { buttons: ["Yes", "No"] } },
     { type: "REPLY", label: "Await Reply", desc: "Wait for user text", defConfig: {} },
     { type: "DELAY", label: "Delay Control", desc: "Wait X hours/days", defConfig: { time: "1 Hour" } },
     { type: "CONDITION", label: "Condition", desc: "If / Else branch", defConfig: { if: "Yes", thenBranch: [], elseBranch: [] } },
     { type: "TAG", label: "Add/Remove Tag", desc: "Update CRM profile", defConfig: { addTag: "New Lead" } },
     { type: "SCHEDULER", label: "Scheduler", desc: "Run chronologically", defConfig: {} },
     { type: "STOP", label: "End Flow", desc: "Stop automation", defConfig: { reason: "Sequence Complete" } },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      
      {/* FLOW HEADER */}
      <header className="flex justify-between items-center px-10 py-6 bg-white border-b border-slate-200 flex-shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2 border-r border-slate-200 pr-4">
            <select 
              value={activeFlowId || ""} 
              onChange={e => {
                const id = e.target.value;
                if (!id) initNewFlow();
                else openFlow(flows.find(f => f.id === id));
              }}
              className="text-sm font-bold border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="">+ New Flow</option>
              {flows.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-xl">🔀</div>
          <div>
            <input 
              value={flowName} 
              onChange={e => setFlowName(e.target.value)}
              className="text-2xl font-bold text-slate-800 bg-transparent focus:outline-none focus:border-b-2 focus:border-indigo-600 outline-none w-[400px]"
            />
            {activeFlowId ? (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Status: <span className="text-emerald-500">Saved</span> • ID: {activeFlowId.slice(-6)}</p>
            ) : (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 text-amber-500">Unsaved Canvas</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeFlowId && (
            <button onClick={deleteFlow} className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-sm transition-all shadow-sm">
              Delete
            </button>
          )}
          <button onClick={saveFlow} disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Flow"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
         
         {/* LEFT PANE: Block Toolbox */}
         <div className="w-[300px] border-r border-slate-200 bg-white p-6 overflow-y-auto z-10 custom-scrollbar flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Flow Components</h3>
            <p className="text-[10px] text-slate-400 mb-4 bg-slate-50 p-2 rounded border border-slate-100">Click a component to append it to the flow sequence.</p>
            <div className="grid grid-cols-1 gap-3">
               {availableBlocks.map(block => (
                  <div 
                     key={block.type} 
                     onClick={() => addStep(block.type, block.defConfig)}
                     className="p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors flex items-center gap-3 group"
                  >
                     <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-lg">{stepIcons[block.type]}</div>
                     <div>
                        <h4 className="font-bold text-sm text-slate-700 group-hover:text-indigo-800">{block.label}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">{block.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* RIGHT PANE: Flow Canvas */}
         <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar flex flex-col items-center py-10">
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

            <div className="flex flex-col items-center w-full max-w-[600px] relative z-10">
               
               <div className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold shadow-md flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Trigger: User Opts-In
               </div>

               {steps.map((step, i) => (
                  <div key={step.id} className="flex flex-col items-center w-full relative group">
                     <div className="h-10 w-px bg-slate-300 transition-colors"></div>

                     <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group/card text-left">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                           ['SEND', 'REPLY', 'BUTTON'].includes(step.type) ? 'bg-indigo-500' :
                           ['DELAY', 'SCHEDULER'].includes(step.type) ? 'bg-amber-400' :
                           ['CONDITION'].includes(step.type) ? 'bg-blue-500' :
                           'bg-rose-500'
                        }`}></div>

                        <div className="p-4 pl-6 flex justify-between items-start">
                           <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                                 ['SEND', 'REPLY', 'BUTTON'].includes(step.type) ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                 ['DELAY', 'SCHEDULER'].includes(step.type) ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                 ['CONDITION'].includes(step.type) ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                 'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}>
                                 {stepIcons[step.type]}
                              </div>
                              <div>
                                 <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[11px] mb-1">{step.type} STEP</h3>
                                 
                                 {step.type === 'SEND' && <p className="text-sm text-slate-600 font-medium">"{step.config.message}"</p>}
                                 {step.type === 'BUTTON' && (
                                     <div className="flex gap-2 mt-2">
                                        {step.config.buttons.map((b: string) => <span key={b} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg">{b}</span>)}
                                     </div>
                                 )}
                                 {step.type === 'DELAY' && <p className="text-sm text-slate-600 font-medium font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-max">Wait: {step.config.time}</p>}
                                 {step.type === 'CONDITION' && <p className="text-sm text-slate-600 font-medium">If User selects: <span className="font-bold text-indigo-600">{step.config.if}</span></p>}
                                 {step.type === 'TAG' && <p className="text-sm text-slate-600 font-medium flex items-center gap-1">Add <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">{step.config.addTag}</span></p>}
                                 {step.type === 'STOP' && <p className="text-sm text-rose-600 font-bold">{step.config.reason || "End"}</p>}
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button onClick={() => removeStep(step.id)} className="w-8 h-8 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center justify-center text-red-500 shadow-sm" title="Delete Step">🗑️</button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}

               {steps.length === 0 && (
                 <div className="h-10 w-px bg-slate-300"></div>
               )}

               <div className="mt-4 px-6 py-3 bg-slate-100 border border-slate-200 border-dashed rounded-lg text-slate-400 text-xs font-bold text-center w-full shadow-sm">
                  Click components on the left to add steps
               </div>

            </div>
            <div className="h-32"></div>
         </div>
         
      </div>
    </div>
  );
}
