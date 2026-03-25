"use client";

import { useState } from "react";

export default function BackupExportPage() {
  const [format, setFormat] = useState("CSV");
  const [isExporting, setIsExporting] = useState(false);

  // Module 21: Backup Array Configs
  const exportModules = [
    { title: "Export Contacts", desc: "Download full CRM database including names, phones, tags, and opting statuses.", icon: "👥" },
    { title: "Export Campaigns", desc: "Retrieve historical broadcast data, audience segments, and run statuses.", icon: "📢" },
    { title: "Export Logs", desc: "Download raw delivery receipts, clicks, button payloads, and system errors.", icon: "📋" },
    { title: "Export Chats", desc: "Extract full Shared Inbox histories including timestamps and agent assignments.", icon: "💬" },
  ];

  const recentBackups: any[] = [];

  const handleExport = () => {
     setIsExporting(true);
     setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Data Backup & Exports</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Download your SaaS data directly or configure global system backups.</p>
        </div>
        <div>
           <button onClick={handleExport} disabled={isExporting} className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50">
             {isExporting ? <span className="animate-spin">⏳</span> : <span>💾</span>} {isExporting ? "Archiving Data..." : "Trigger Full System Backup"}
           </button>
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* EXPORT OPTIONS GRID */}
        <div>
           <div className="flex justify-between items-end mb-6">
              <h2 className="text-lg font-bold text-slate-800">Module Data Exports</h2>
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                 <span className="text-xs font-bold text-slate-500 mr-2 ml-2 uppercase tracking-widest">Format</span>
                 <button onClick={() => setFormat('CSV')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${format === 'CSV' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>CSV</button>
                 <button onClick={() => setFormat('JSON')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${format === 'JSON' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>JSON</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exportModules.map((mod, i) => (
                 <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-indigo-300 transition-colors">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-50 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                       {mod.icon}
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{mod.title}</h3>
                    <p className="text-xs text-slate-500 mb-6 flex-1 leading-relaxed">{mod.desc}</p>
                    <button className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-sm rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2">
                       <span>⬇️</span> Download {format}
                    </button>
                 </div>
              ))}
           </div>
        </div>

        {/* CLOUD BACKUP SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Schedule Backup Config */}
           <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <span>☁️</span> Cloud Backup Config
              </h2>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Automated Backup Frequency</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                       <option>Daily at 4:00 AM</option>
                       <option>Weekly (Sundays)</option>
                       <option>Manual Only</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Backup Storage Location</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                       <option>Internal SaaS Server Storage</option>
                       <option>Amazon S3 Bucket</option>
                       <option>Google Cloud Storage</option>
                    </select>
                 </div>

                 <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 font-bold">Secure Data Warning: Downloaded files contain unencrypted PII (Emails, Phones). Ensure your local machine complies with regional data laws (GDPR/CCPA).</p>
                 </div>

                 <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all">
                    Update Configuration
                 </button>
              </div>
           </div>

           {/* Backup History Table */}
           <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-800">Recent Archives & History</h2>
              </div>
              
              <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-slate-700">
                    <thead>
                       <tr className="bg-white text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
                          <th className="py-4 px-6">Archive Name & Format</th>
                          <th className="py-4 px-4">Size</th>
                          <th className="py-4 px-4">Timestamp</th>
                          <th className="py-4 px-6 text-right">Download</th>
                       </tr>
                    </thead>
                    <tbody>
                       {recentBackups.length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-center text-slate-500 font-medium">No recent backups available.</td></tr>
                       ) : recentBackups.map(bkp => (
                          <tr key={bkp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                             <td className="py-5 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm border border-emerald-100">✅</div>
                                   <p className="font-bold text-sm text-slate-800">{bkp.type}</p>
                                </div>
                             </td>
                             <td className="py-5 px-4 font-mono text-sm text-slate-600">
                                {bkp.size}
                             </td>
                             <td className="py-5 px-4 font-bold text-xs text-slate-500">
                                {bkp.date}
                             </td>
                             <td className="py-5 px-6 text-right">
                                <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 ml-auto">
                                   Download
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
    </div>
  );
}
