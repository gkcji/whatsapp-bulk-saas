"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INDIA_LANGUAGES, formatDateIST, MSG_COST_INR } from "@/lib/india";

const API = "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

type ButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE";
interface Btn { type: ButtonType; text: string; url?: string; phone?: string; code?: string }

const LANGS = INDIA_LANGUAGES;

// ── SVG icons (no emoji) ──────────────────────────────────
const Icon = {
  sync: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
  close: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
  trash: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  reply: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
  link: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>,
  phone: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  copy: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  image: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  video: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
  doc: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
  text: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  template: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: any = {
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500",
    PENDING:  "bg-amber-50  text-amber-700  border-amber-200  ring-amber-400",
    REJECTED: "bg-red-50    text-red-700    border-red-200    ring-red-500",
  };
  const dot: any = { APPROVED: "bg-emerald-500", PENDING: "bg-amber-400 animate-pulse", REJECTED: "bg-red-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${map[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || "bg-slate-400"}`} />
      {status}
    </span>
  );
};

export default function TemplatesPage() {
  const router = useRouter();
  const [view, setView] = useState<"list"|"create"|"sync">("list");
  const [templates, setTemplates] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [syncing, setSyncing] = useState(false);
  const [syncNum, setSyncNum] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);

  // form
  const [numberId, setNumberId] = useState("");
  const [tplName, setTplName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("hi");
  const [headerType, setHeaderType] = useState<"NONE"|"TEXT"|"IMAGE"|"VIDEO"|"DOCUMENT">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<Btn[]>([]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    const [t, n] = await Promise.all([
      apiFetch("/templates").then(r => r.json()),
      apiFetch("/numbers").then(r => r.json()),
    ]);
    setTemplates(t.templates || []);
    const nums = n.numbers || [];
    setNumbers(nums);
    if (nums.length) { setSyncNum(nums[0].id); if (!numberId) setNumberId(nums[0].id); }
    setLoading(false);
  };

  useEffect(() => { if (!getToken()) { router.push("/login"); return; } load(); }, []);

  const addBtn = (type: ButtonType) => { if (buttons.length >= 2) return; setButtons([...buttons, { type, text: "", url: "", phone: "", code: "" }]); };
  const updBtn = (i: number, k: keyof Btn, v: string) => { const b=[...buttons]; (b[i] as any)[k]=v; setButtons(b); };
  const delBtn = (i: number) => setButtons(buttons.filter((_,idx)=>idx!==i));
  const insertVar = () => { const n=(body.match(/\{\{\d+\}\}/g)||[]).length; setBody(body+`{{${n+1}}}`); };

  const handleSync = async () => {
    if (!syncNum) return;
    setSyncing(true);
    const r = await apiFetch("/templates/sync", { method:"POST", body: JSON.stringify({ numberId: syncNum }) });
    const d = await r.json();
    setSyncing(false);
    showToast(r.ok ? `Synced ${d.synced} templates from Meta` : d.error, r.ok);
    if (r.ok) { load(); setView("list"); }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setCreating(true);
    const builtBtns = buttons.map(b =>
      b.type==="QUICK_REPLY" ? { type:"QUICK_REPLY", text:b.text }
      : b.type==="URL" ? { type:"URL", text:b.text, url:b.url }
      : b.type==="PHONE_NUMBER" ? { type:"PHONE_NUMBER", text:b.text, phone_number:b.phone }
      : { type:"COPY_CODE", example:b.code||"123456" }
    );
    const body2 = JSON.stringify({ numberId, templateName:tplName, language, category, header: headerType!=="NONE"?{type:headerType,text:headerText}:undefined, body, footer, buttons:builtBtns });
    const r = await apiFetch("/templates", { method:"POST", body: body2 });
    const d = await r.json();
    setCreating(false);
    if (!r.ok) { showToast(d.error, false); return; }
    showToast("Template submitted to Meta for approval", true);
    setView("list"); resetForm(); load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await apiFetch(`/templates/${id}`, { method:"DELETE" });
    setDeleting(null);
    showToast("Template deleted", true);
    load();
  };

  const resetForm = () => {
    setTplName(""); setCategory("MARKETING"); setLanguage("en_US");
    setHeaderType("NONE"); setHeaderText(""); setBody(""); setFooter(""); setButtons([]);
    if (numbers.length) setNumberId(numbers[0].id);
  };

  const filtered = templates.filter(t => filterStatus==="ALL" || t.status===filterStatus);

  // preview html
  const previewHtml = body
    .replace(/\*(.+?)\*/g,"<strong>$1</strong>")
    .replace(/_(.+?)_/g,"<em>$1</em>")
    .replace(/~(.+?)~/g,"<s>$1</s>")
    .replace(/\{\{(\d+)\}\}/g,`<span style="background:#dbeafe;color:#1d4ed8;padding:0 4px;border-radius:4px;font-size:11px;font-weight:600;">{{$1}}</span>`);

  const catColor: any = { MARKETING:"bg-violet-50 text-violet-700 border-violet-200", UTILITY:"bg-sky-50 text-sky-700 border-sky-200", AUTHENTICATION:"bg-orange-50 text-orange-700 border-orange-200" };
  const btnColor: any = { QUICK_REPLY:"bg-blue-50 text-blue-700 border-blue-200", URL:"bg-emerald-50 text-emerald-700 border-emerald-200", PHONE_NUMBER:"bg-amber-50 text-amber-700 border-amber-200", COPY_CODE:"bg-purple-50 text-purple-700 border-purple-200" };
  const btnIcon: any = { QUICK_REPLY: Icon.reply, URL: Icon.link, PHONE_NUMBER: Icon.phone, COPY_CODE: Icon.copy };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all ${toast.ok ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
            {toast.ok ? Icon.check : Icon.close}
          </span>
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {view !== "list" && (
            <button onClick={() => { setView("list"); resetForm(); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {view === "list" ? "Templates" : view === "create" ? "Create Template" : "Sync from Meta"}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              {view === "list" ? `${templates.length} templates · WhatsApp-approved message templates` : view === "create" ? "Design your message with header, body, footer & buttons" : "Import approved templates from your WABA account"}
            </p>
          </div>
        </div>
        {view === "list" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setView("sync")} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              {Icon.sync} Sync from Meta
            </button>
            <button onClick={() => setView("create")} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/25">
              {Icon.plus} Create Template
            </button>
          </div>
        )}
      </div>

      <div className="px-8 py-7 max-w-[1400px] mx-auto">

        {/* ── SYNC VIEW ── */}
        {view === "sync" && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                <h2 className="font-bold text-slate-800 text-lg">Pull from Meta WABA</h2>
                <p className="text-slate-500 text-sm mt-1">Import all approved, pending and rejected templates from your WhatsApp Business account.</p>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Number</label>
                  <select value={syncNum} onChange={e => setSyncNum(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <option value="">— Select Number —</option>
                    {numbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber}</option>)}
                  </select>
                  {numbers.length === 0 && <p className="text-xs text-red-500 mt-2 font-medium">No numbers registered. Add one in <a href="/dashboard/settings" className="underline">API Config</a>.</p>}
                </div>
                <button onClick={handleSync} disabled={syncing || !syncNum} className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 disabled:opacity-50 transition-all text-sm">
                  <span className={syncing ? "animate-spin" : ""}>{Icon.sync}</span>
                  {syncing ? "Syncing…" : "Sync Templates Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE VIEW ── */}
        {view === "create" && (
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">

              {/* LEFT — form sections */}
              <div className="space-y-4">

                {/* Section 1 — Meta Info */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <span className="font-bold text-slate-800 text-sm">Basic Information</span>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">WhatsApp Number *</label>
                      <select required value={numberId} onChange={e => setNumberId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                        <option value="">— Select —</option>
                        {numbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Template Name *</label>
                      <input required value={tplName} onChange={e => setTplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"_"))}
                        placeholder="offer_may_2025" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-700 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500" />
                      <p className="text-[10px] text-slate-400 mt-1.5">Lowercase letters, numbers & underscores only</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category *</label>
                      <div className="flex gap-2">
                        {[{c:"MARKETING",cost:"₹0.58/msg"},{c:"UTILITY",cost:"₹0.14/msg"},{c:"AUTHENTICATION",cost:"₹0.14/msg"}].map(({c,cost}) => (
                          <button type="button" key={c} onClick={() => setCategory(c)} className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${category===c ? "bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/25" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}>
                            {c === "MARKETING" ? "Marketing" : c === "UTILITY" ? "Utility" : "Auth"}
                            <span className={`block text-[9px] mt-0.5 font-semibold ${category===c?"text-white/70":"text-slate-400"}`}>{cost}</span>
                          </button>
                        ))}
                    </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Language *</label>
                      <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                        {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2 — Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <span className="font-bold text-slate-800 text-sm">Header <span className="text-slate-400 font-normal text-xs ml-1">— Optional</span></span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {([
                        { type:"NONE", label:"None", icon:<div className="text-slate-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg></div> },
                        { type:"TEXT", label:"Text", icon:<div>{Icon.text}</div> },
                        { type:"IMAGE", label:"Image", icon:<div>{Icon.image}</div> },
                        { type:"VIDEO", label:"Video", icon:<div>{Icon.video}</div> },
                        { type:"DOCUMENT", label:"Doc", icon:<div>{Icon.doc}</div> },
                      ] as any[]).map(h => (
                        <button type="button" key={h.type} onClick={() => setHeaderType(h.type)} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${headerType===h.type ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>
                          {h.icon}{h.label}
                        </button>
                      ))}
                    </div>
                    {headerType === "TEXT" && (
                      <input value={headerText} onChange={e => setHeaderText(e.target.value)} maxLength={60}
                        placeholder="e.g.  Special Offer Just For You!" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    )}
                    {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm">
                        <div className="text-slate-300">{headerType==="IMAGE"?Icon.image:headerType==="VIDEO"?Icon.video:Icon.doc}</div>
                        <div>
                          <p className="font-semibold text-slate-500">{headerType} header</p>
                          <p className="text-xs mt-0.5">Media URL will be attached per campaign send</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3 — Body */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <span className="font-bold text-slate-800 text-sm">Body <span className="text-red-400 text-xs">*</span></span>
                  </div>
                  <div className="p-6">
                    <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)} maxLength={1024}
                      placeholder={"Hello {{1}},\n\nWe have an exclusive deal for you! 🎁\n\nUse code {{2}} to get 20% off your next order."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed" />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={insertVar} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                          + Variable
                        </button>
                        {[["B","*","font-bold"],["I","_","italic"],["S","~","line-through"]].map(([l,s,cls]) => (
                          <button key={l} type="button" onClick={() => setBody(body+`${s}${s}`)}
                            className={`w-7 h-7 bg-slate-100 text-slate-600 rounded-lg text-xs ${cls} font-bold hover:bg-slate-200 border border-slate-200 transition-colors`}>{l}</button>
                        ))}
                      </div>
                      <span className={`text-xs font-semibold ${body.length>900 ? "text-amber-500" : "text-slate-400"}`}>{body.length}/1024</span>
                    </div>
                  </div>
                </div>

                {/* Section 4 — Footer */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">4</span>
                    <span className="font-bold text-slate-800 text-sm">Footer <span className="text-slate-400 font-normal text-xs ml-1">— Optional</span></span>
                  </div>
                  <div className="p-6">
                    <input value={footer} onChange={e => setFooter(e.target.value)} maxLength={60}
                      placeholder="Not interested? Reply STOP to unsubscribe."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Section 5 — Buttons */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0">5</span>
                      <span className="font-bold text-slate-800 text-sm">Buttons</span>
                      <span className="text-slate-400 font-medium text-xs">Max 2 buttons</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${buttons.length >= 2 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {buttons.length}/2 used
                    </span>
                  </div>
                  <div className="p-6">
                    {/* Add button types */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {([
                        { type:"QUICK_REPLY", label:"Quick Reply", desc:"User taps to reply", icon: Icon.reply, color:"blue" },
                        { type:"URL",         label:"Visit Website", desc:"Opens a URL", icon: Icon.link,  color:"emerald" },
                        { type:"PHONE_NUMBER",label:"Call Phone",   desc:"Dials a number", icon: Icon.phone,"color":"amber" },
                        { type:"COPY_CODE",   label:"Copy Code",    desc:"OTP / code copy", icon: Icon.copy, color:"purple" },
                      ] as any[]).map(b => {
                        const disabled = buttons.length >= 2 || (b.type==="COPY_CODE" && buttons.some((x:Btn)=>x.type==="COPY_CODE"));
                        const colors: any = { blue:["bg-blue-50 border-blue-200 text-blue-700","hover:bg-blue-100"], emerald:["bg-emerald-50 border-emerald-200 text-emerald-700","hover:bg-emerald-100"], amber:["bg-amber-50 border-amber-200 text-amber-700","hover:bg-amber-100"], purple:["bg-purple-50 border-purple-200 text-purple-700","hover:bg-purple-100"] };
                        const [base, hover] = colors[b.color];
                        return (
                          <button type="button" key={b.type} disabled={disabled} onClick={() => addBtn(b.type)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${base} ${!disabled ? hover : ""}`}>
                            <span className="shrink-0">{b.icon}</span>
                            <div>
                              <p className="font-bold text-[12px] leading-none">{b.label}</p>
                              <p className="text-[10px] mt-1 opacity-70">{b.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Button configs */}
                    <div className="space-y-3">
                      {buttons.length === 0 && (
                        <div className="flex flex-col items-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                          <svg className="w-8 h-8 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="8" width="18" height="8" rx="2" strokeLinecap="round"/></svg>
                          <p className="text-sm font-medium text-slate-400">No buttons added yet</p>
                          <p className="text-xs text-slate-300 mt-1">Select a button type above</p>
                        </div>
                      )}
                      {buttons.map((btn, i) => {
                        const bColors: any = { QUICK_REPLY:"border-blue-200 bg-blue-50/40", URL:"border-emerald-200 bg-emerald-50/40", PHONE_NUMBER:"border-amber-200 bg-amber-50/40", COPY_CODE:"border-purple-200 bg-purple-50/40" };
                        const bLabel: any = { QUICK_REPLY:"Quick Reply", URL:"Visit Website", PHONE_NUMBER:"Call Phone", COPY_CODE:"Copy Code / OTP" };
                        const bTextColor: any = { QUICK_REPLY:"text-blue-700", URL:"text-emerald-700", PHONE_NUMBER:"text-amber-700", COPY_CODE:"text-purple-700" };
                        return (
                          <div key={i} className={`rounded-xl border-2 ${bColors[btn.type]} p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className={`${bTextColor[btn.type]}`}>{btnIcon[btn.type]}</span>
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${bTextColor[btn.type]}`}>{bLabel[btn.type]}</span>
                              </div>
                              <button type="button" onClick={() => delBtn(i)} className="w-6 h-6 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors">
                                {Icon.close}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {btn.type !== "COPY_CODE" && (
                                <input value={btn.text} onChange={e => updBtn(i,"text",e.target.value)} maxLength={25}
                                  placeholder="Button label (e.g. Shop Now)" className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400" />
                              )}
                              {btn.type === "URL" && (
                                <input value={btn.url} onChange={e => updBtn(i,"url",e.target.value)}
                                  placeholder="https://yourwebsite.com/offer?ref={{1}}" className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 font-mono outline-none focus:ring-2 focus:ring-indigo-400" />
                              )}
                              {btn.type === "PHONE_NUMBER" && (
                                <input value={btn.phone} onChange={e => updBtn(i,"phone",e.target.value)}
                                  placeholder="+91 98765 43210" className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 font-mono outline-none focus:ring-2 focus:ring-indigo-400" />
                              )}
                              {btn.type === "COPY_CODE" && (
                                <input value={btn.code} onChange={e => updBtn(i,"code",e.target.value)}
                                  placeholder="Sample OTP: 123456 (replaced at send time)" className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 font-mono outline-none focus:ring-2 focus:ring-indigo-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all text-sm">
                  {creating ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting to Meta…</> : <>{Icon.plus} Submit Template for Approval</>}
                </button>
              </div>

              {/* RIGHT — live preview */}
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Live Preview</span>
                    <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide">WhatsApp</span>
                  </div>
                  {/* Phone-style preview */}
                  <div className="p-4 bg-[#ECE5DD]">
                    {/* WA top bar */}
                    <div className="bg-[#075E54] text-white flex items-center gap-3 px-4 py-3 rounded-t-xl -mx-4 -mt-4 mb-4 shadow-sm">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">W</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm leading-none">WhatsApp Business</p>
                        <p className="text-[10px] text-white/60 mt-0.5">online</p>
                      </div>
                      <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </div>

                    <div className="max-w-[88%] bg-white rounded-2xl rounded-tl-none shadow-md overflow-hidden">
                      {/* Header preview */}
                      {headerType === "TEXT" && headerText && (
                        <div className="px-4 pt-4 pb-1"><p className="font-bold text-slate-900 text-sm">{headerText}</p></div>
                      )}
                      {headerType === "IMAGE" && (
                        <div className="h-36 bg-gradient-to-br from-slate-200 to-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400">
                          {Icon.image}<span className="text-xs font-medium">Image Header</span>
                        </div>
                      )}
                      {headerType === "VIDEO" && (
                        <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-2 text-white/60">
                          {Icon.video}<span className="text-xs font-medium">Video Header</span>
                        </div>
                      )}
                      {headerType === "DOCUMENT" && (
                        <div className="px-4 py-3 bg-slate-50 flex items-center gap-3 border-b border-slate-100">
                          <div className="text-indigo-400">{Icon.doc}</div>
                          <div><p className="text-xs font-bold text-slate-700">document.pdf</p><p className="text-[10px] text-slate-400">PDF Document</p></div>
                        </div>
                      )}
                      {/* Body */}
                      <div className="px-4 py-3">
                        {body ? (
                          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        ) : (
                          <p className="text-slate-300 text-sm italic">Your message body appears here…</p>
                        )}
                      </div>
                      {/* Footer */}
                      {footer && <div className="px-4 pb-3"><p className="text-slate-400 text-[11px]">{footer}</p></div>}
                      {/* Time */}
                      <div className="px-4 pb-2.5 text-right"><span className="text-[10px] text-slate-300">12:30 PM ✓✓</span></div>
                      {/* Buttons */}
                      {buttons.filter(b=>b.text||b.code).length > 0 && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {buttons.filter(b=>b.text||b.code).map((b,i) => (
                            <div key={i} className="flex items-center justify-center gap-2 py-2.5">
                              <span className="text-indigo-500 text-xs">{btnIcon[b.type]}</span>
                              <span className="text-indigo-600 text-xs font-semibold">{b.text || (b.type==="COPY_CODE"?"Copy Code":"Button")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Meta info */}
                  <div className="p-5 space-y-2 border-t border-slate-100">
                    {[
                      ["Name", tplName || "—", "font-mono"],
                      ["Category", category, ""],
                      ["Language", LANGS.find(l=>l.code===language)?.label || language, ""],
                      ["Buttons", `${buttons.length}/2`, buttons.length>=2?"text-amber-600 font-bold":""],
                    ].map(([k,v,cls]) => (
                      <div key={k as string} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">{k}</span>
                        <span className={`text-slate-700 font-semibold ${cls}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Meta Approval Tips
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-amber-700 font-medium">
                    <li>• Name must be lowercase with underscores</li>
                    <li>• MARKETING templates need opt-in context</li>
                    <li>• Use &#123;&#123;1&#125;&#125; &#123;&#123;2&#125;&#125; for personalisation</li>
                    <li>• Max 2 buttons per template</li>
                    <li>• Approval takes 0–24 hours usually</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div className="space-y-5">
            {/* Filter bar */}
            <div className="flex items-center gap-3">
              {(["ALL","APPROVED","PENDING","REJECTED"] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${filterStatus===s ? "bg-indigo-600 text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                  {s === "ALL" ? `All (${templates.length})` : `${s.charAt(0)+s.slice(1).toLowerCase()} (${templates.filter(t=>t.status===s).length})`}
                </button>
              ))}
            </div>

            {/* Cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium">Loading templates…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-300 mb-5">{Icon.template}</div>
                <h3 className="font-bold text-slate-800 text-base mb-1">No templates yet</h3>
                <p className="text-slate-400 text-sm max-w-xs mb-6">Create your first WhatsApp template or sync from your Meta WABA account</p>
                <div className="flex gap-3">
                  <button onClick={() => setView("sync")} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-sm">{Icon.sync} Sync from Meta</button>
                  <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/25">{Icon.plus} Create Template</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((t: any) => {
                  let comps: any[] = [];
                  try { comps = JSON.parse(t.components || "[]"); } catch {}
                  const hdr = comps.find((c:any)=>c.type==="HEADER");
                  const bdy = comps.find((c:any)=>c.type==="BODY");
                  const ftr = comps.find((c:any)=>c.type==="FOOTER");
                  const btns = comps.find((c:any)=>c.type==="BUTTONS")?.buttons || [];

                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden group">
                      {/* Card header bar */}
                      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm font-mono truncate">{t.templateName}</h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <StatusBadge status={t.status} />
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${catColor[t.category]||"bg-slate-50 text-slate-600 border-slate-200"}`}>{t.category}</span>
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{LANGS.find(l=>l.code===t.language)?.label || t.language}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(t.id, t.templateName)} disabled={deleting===t.id} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-50">
                          {deleting===t.id ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" /> : Icon.trash}
                        </button>
                      </div>

                      {/* Body preview */}
                      <div className="px-5 py-4">
                        {hdr && hdr.format !== "TEXT" && (
                          <div className="flex items-center gap-2 mb-2.5 text-slate-400">
                            <span>{hdr.format==="IMAGE"?Icon.image:hdr.format==="VIDEO"?Icon.video:Icon.doc}</span>
                            <span className="text-[11px] font-medium">{hdr.format} header</span>
                          </div>
                        )}
                        {hdr?.text && <p className="font-bold text-slate-800 text-sm mb-1.5">{hdr.text}</p>}
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">{bdy?.text || "—"}</p>
                        {ftr?.text && <p className="text-slate-400 text-[11px] mt-2 italic">{ftr.text}</p>}
                      </div>

                      {/* Buttons */}
                      {btns.length > 0 && (
                        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                          {btns.map((b: any, i: number) => (
                            <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${btnColor[b.type]||"bg-slate-50 text-slate-600 border-slate-200"}`}>
                              <span className="shrink-0">{btnIcon[b.type]}</span>
                              {b.text || b.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
