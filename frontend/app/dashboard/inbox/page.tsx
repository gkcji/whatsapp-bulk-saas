"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatIST } from "@/lib/india";

const API = "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function SharedInboxPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadInbox();
    const interval = setInterval(loadInbox, 10000); // Poll for new messages
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadInbox = async () => {
    try {
      const res = await apiFetch("/inbox");
      const d = await res.json();
      setContacts(d.contacts || []);
    } catch (e) {}
    setLoading(false);
  };

  const selectContact = async (c: any) => {
    setSelectedContact(c);
    setMsgLoading(true);
    try {
      const res = await apiFetch(`/inbox/${c.id}/messages`);
      const d = await res.json();
      setMessages(d.messages || []);
    } catch(e) {}
    setMsgLoading(false);
  };

  const sendReply = async (type: "TEXT" | "NOTE" = "TEXT") => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const endpoint = type === "NOTE" ? `/inbox/${selectedContact.id}/note` : `/inbox/${selectedContact.id}/send`;
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ body: reply })
      });
      const d = await res.json();
      if (d.message) {
        setMessages([...messages, d.message]);
        setReply("");
      }
    } catch (e) {}
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden">
      
      {/* Sidebar: Contact List */}
      <div className="w-[380px] border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-black text-slate-800">Shared Inbox</h2>
          <div className="mt-4 relative">
             <input type="text" placeholder="Search chats..." className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-medium transition-all" />
             <span className="absolute left-3 top-3 text-slate-400">🔍</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Meta Cloud...</div>
          ) : contacts.map(c => (
            <button 
              key={c.id} 
              onClick={() => selectContact(c)}
              className={`w-full p-5 flex items-start gap-4 border-b border-slate-100 transition-all hover:bg-white ${selectedContact?.id === c.id ? 'bg-white shadow-[inset_4px_0_0_0_#4f46e5]' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {c.name?.slice(0,1) || 'C'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-slate-800 truncate text-[15px]">{c.name || c.phone}</p>
                  <span className="text-[10px] text-slate-400 font-bold">{c.messages?.[0] ? new Date(c.messages[0].createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                </div>
                <p className="text-xs text-slate-500 truncate font-medium">
                  {c.messages?.[0]?.body || 'No messages yet'}
                </p>
                {c.unreadCount > 0 && (
                  <span className="mt-2 inline-block bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{c.unreadCount}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs">
                  {selectedContact.name?.slice(0,1) || 'C'}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-tight">{selectedContact.name || selectedContact.phone}</h3>
                  <p className="text-[11px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    WhatsApp Active
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all">📞</button>
                 <button className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all">🏷️</button>
                 <button className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">🚫</button>
              </div>
            </div>

            {/* Messages Thread */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8fafc] custom-scrollbar">
              {msgLoading ? (
                <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Encrypted Thread...</div>
              ) : messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : m.direction === 'NOTE' ? 'justify-center' : 'justify-start'}`}>
                  {m.direction === 'NOTE' ? (
                    <div className="bg-amber-50 border border-amber-200 px-6 py-2 rounded-full text-[11px] font-bold text-amber-700 flex items-center gap-2">
                       <span>📝 NOTE:</span> {m.body}
                    </div>
                  ) : (
                    <div className={`max-w-[70%] group relative ${m.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}>
                       <div className={`px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium ${m.direction === 'OUTBOUND' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                          {m.body}
                       </div>
                       <div className={`mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${m.direction === 'OUTBOUND' ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                          {formatIST(m.createdAt)}
                          {m.direction === 'OUTBOUND' && (
                             <span className={m.status === 'SENT' ? 'text-indigo-500' : 'text-rose-500'}>
                                {m.status === 'SENT' ? '✓✓' : '✗'}
                             </span>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Editor */}
            <div className="p-6 border-t border-slate-200 bg-white">
               <div className="max-w-[1200px] mx-auto bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
                  <div className="px-4 py-2 border-b border-slate-200 flex gap-4">
                     <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">Use Template</button>
                     <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Quick Replies</button>
                     <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-amber-600" onClick={() => sendReply("NOTE")}>Internal Note</button>
                  </div>
                  <div className="flex items-end p-2 gap-2">
                     <textarea 
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type WhatsApp message..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium p-3 resize-none max-h-32" 
                        rows={2}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReply())}
                     />
                     <button 
                        onClick={() => sendReply()}
                        disabled={sending || !reply.trim()}
                        className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:shadow-none mb-1"
                     >
                        {sending ? "..." : "➤"}
                     </button>
                  </div>
               </div>
               <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-tight">Enterprise End-to-End Encryption Enabled</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 space-y-6">
             <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl border border-slate-200">💬</div>
             <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800">Select a Conversation</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Pick a contact from the left to start chatting in real-time.</p>
             </div>
             <div className="flex gap-4">
                <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 0 Active Chats
                </div>
                <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm">
                   <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 2 Incoming Today
                </div>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
