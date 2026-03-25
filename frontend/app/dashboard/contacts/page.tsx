"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDateIST } from "@/lib/india";

const API = "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/contacts");
      const d = await r.json();
      setContacts(d.contacts || []);
    } catch (e) {
      setContacts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadContacts();
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    setAdding(true); setError("");
    const r = await apiFetch("/contacts", { method: "POST", body: JSON.stringify({ phone, name }) });
    const d = await r.json();
    setAdding(false);
    if (!r.ok) { setError(d.error || "Failed"); return; }
    setPhone(""); setName("");
    loadContacts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await apiFetch(`/contacts/${id}`, { method: "DELETE" });
    loadContacts();
  };

  const handleBulkSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(c => c.id));
  };

  const handleCsvUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); setUploadMsg(""); setError("");
    try {
      const text = await file.text();
      const lines = text.trim().split("\n").slice(1); // skip header
      const rows = lines.map(l => {
        const [phone, name] = l.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
        return { phone, name };
      }).filter(r => r.phone);

      const r = await apiFetch("/contacts/bulk", { method: "POST", body: JSON.stringify({ contacts: rows }) });
      const d = await r.json();
      if (d.success) setUploadMsg(`✅ Imported ${d.created} contacts!`);
      else setError(d.error || "Import failed");
      loadContacts();
    } catch {
      setError("Failed to parse CSV. Ensure format: phone,name");
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Contact Manager</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            {loading ? "Loading..." : `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} in your CRM`}
          </p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2">
            <span>📄</span> {isUploading ? "Importing..." : "Bulk CSV Import"}
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
        </div>
      </header>

      <div className="p-10 max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ADD CONTACT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Quick Add Contact</h2>
            {error && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}
            {uploadMsg && <p className="mb-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">{uploadMsg}</p>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Phone Number *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Rajesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" disabled={adding} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20">
                {adding ? "Adding..." : "Add Contact"}
              </button>
            </form>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
            <h3 className="font-bold text-indigo-900 mb-2 text-sm">📄 CSV Format</h3>
            <p className="text-xs text-indigo-700 leading-relaxed">Your CSV file should have a header row:<br />
              <code className="bg-white px-2 py-0.5 rounded border border-indigo-200 mt-1 block font-mono">phone,name</code>
            </p>
            <p className="text-xs text-indigo-600 mt-2">e.g. <code className="font-mono">+919876543210,Rajesh Kumar</code></p>
          </div>
        </div>

        {/* TABLE */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col" style={{ minHeight: 500 }}>

          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 rounded-t-2xl">
            <div className="flex items-center gap-3 w-full md:w-auto">
              {selectedIds.length > 0 && (
                <span className="font-bold text-sm text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-lg">{selectedIds.length} Selected</span>
              )}
              {selectedIds.length > 0 && (
                <button className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-1.5 rounded-lg transition-colors">Bulk Delete</button>
              )}
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone..."
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 shadow-sm" />
          </div>

          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="w-full text-left text-slate-700 min-w-[700px]">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="text-slate-500 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                    <th className="py-3 px-6 w-12 text-center">
                      <input type="checkbox" onChange={toggleAll} checked={selectedIds.length === filtered.length && filtered.length > 0} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                    </th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4">Messages</th>
                    <th className="py-3 px-4">Added On</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                      {contacts.length === 0 ? "No contacts yet. Add one on the left or import via CSV." : "No contacts match your search."}
                    </td></tr>
                  ) : (
                    filtered.map((c: any) => (
                      <tr key={c.id} className={`${selectedIds.includes(c.id) ? "bg-indigo-50" : "hover:bg-slate-50"} border-b border-slate-100 transition-colors`}>
                        <td className="py-4 px-6 text-center">
                          <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => handleBulkSelect(c.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                              {c.name ? c.name[0].toUpperCase() : "?"}
                            </div>
                            {c.name || <span className="text-slate-400 font-normal italic">Unnamed</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-sm text-slate-600">{c.phone}</td>
                        <td className="py-4 px-4">
                          {c.tags?.length > 0
                            ? c.tags.map((t: any) => (
                              <span key={t.id} className="mr-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">{t.name}</span>
                            ))
                            : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600 font-medium">{c._count?.messages ?? 0}</td>
                        <td className="py-4 px-4 text-xs text-slate-400">{formatDateIST(c.createdAt)}</td>
                        <td className="py-4 px-6">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => router.push("/dashboard/inbox")}
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all" title="Open Chat">💬</button>
                            <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all" title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white text-xs font-semibold text-slate-500 flex justify-between items-center rounded-b-2xl">
            Showing {filtered.length} of {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </>
  );
}
