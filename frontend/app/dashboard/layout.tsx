"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", group: "Core Workspace", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { name: "Campaigns", href: "/dashboard/campaigns", group: "Core Workspace", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    )},
    { name: "Templates", href: "/dashboard/templates", group: "Core Workspace", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
    { name: "Audience CRM", href: "/dashboard/contacts", group: "Core Workspace", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { name: "Shared Inbox", href: "/dashboard/inbox", group: "Engagement", badge: "2 New", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )},
    { name: "Flow Builder", href: "/dashboard/flows", group: "Engagement", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { name: "Follow-ups", href: "/dashboard/sequences", group: "Engagement", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { name: "Link Tracking", href: "/dashboard/links", group: "Engagement", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )},
    { name: "Button Tracking", href: "/dashboard/buttons", group: "Engagement", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    )},
    { name: "Automation Rules", href: "/dashboard/automation", group: "Engagement", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )},
    { name: "Audience Builder", href: "/dashboard/audience", group: "Engagement", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { name: "Analytics", href: "/dashboard/analytics", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { name: "Number Health", href: "/dashboard/health", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { name: "Data Backup", href: "/dashboard/backup", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    )},
    { name: "Subscription", href: "/dashboard/subscription", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { name: "Billing & Costs", href: "/dashboard/billing", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { name: "API Config", href: "/dashboard/settings", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { name: "WhatsApp Profile", href: "/dashboard/profile", group: "Settings & Setup", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )}
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar - Highly Optimized SVG Design */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col z-20 flex-shrink-0">
        
        {/* Brand Area */}
        <div className="h-20 flex items-center px-6 border-b border-transparent">
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-black text-slate-800 tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            SendWA<span className="text-slate-400 font-medium">.io</span>
          </Link>
        </div>
        
        {/* User Account Banner */}
        <div className="px-4 py-2 mt-2">
          <button className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-sm uppercase">
                  {typeof window !== "undefined" ? (localStorage.getItem("userName")?.slice(0, 2) || "U") : "U"}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors leading-none tracking-tight truncate w-[100px]">
                    {typeof window !== "undefined" ? (localStorage.getItem("userName") || "User") : "User"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-50"></span>
                    {typeof window !== "undefined" && localStorage.getItem("userRole") === "ADMIN" ? "SUPER ADMIN" : "Owner"}
                  </p>
                </div>
             </div>
             <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
          </button>
        </div>
        
        {/* Optimized Navigation Links */}
        <nav className="flex-1 px-4 py-2 flex flex-col gap-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          {/* Group 1 */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 mt-2">Core Platform</p>
          {navItems.filter(i => i.group === "Core Workspace").map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-0.5 group ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</div>
                {item.name}
              </Link>
            )
          })}
          
          {/* Group 2 */}
          <div className="w-full h-px bg-slate-100 my-2.5"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Automate & Engage</p>
          {navItems.filter(i => i.group === "Engagement").map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-0.5 group ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <div className="flex items-center gap-3">
                  <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</div>
                  {item.name}
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{item.badge}</span>
                )}
              </Link>
            )
          })}

          {/* Group 3 */}
          <div className="w-full h-px bg-slate-100 my-2.5"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Configuration</p>
          {navItems.filter(i => i.group === "Settings & Setup").map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-0.5 group ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</div>
                {item.name}
              </Link>
            )
          })}

          {/* Group 4: Super Admin Shortcut */}
          {typeof window !== "undefined" && localStorage.getItem("userRole") === "ADMIN" && (
            <>
              <div className="w-full h-px bg-slate-100 my-2.5"></div>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-2 mb-1 animate-pulse">Platform Management</p>
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-black transition-all duration-200 mb-0.5 group bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-sm border border-rose-100">
                <div className="text-rose-500 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Super Admin Panel
              </Link>
            </>
          )}

        </nav>

        {/* Footer Area inside Sidebar */}
        <div className="p-4 border-t border-slate-100">
           <div className="w-full bg-indigo-50 rounded-xl p-4 border border-indigo-100">
             <h4 className="font-bold text-indigo-900 text-xs mb-1">Plan: Pro Business</h4>
             <p className="text-[10px] text-indigo-600 leading-relaxed font-medium">10,000 Messages/mo limit. Keep blasting!</p>
             <button className="mt-3 w-full bg-white text-indigo-700 text-xs font-bold py-1.5 rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors">Upgrade</button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative custom-scrollbar bg-slate-50 h-screen overflow-hidden">
        <div className={`h-full ${pathname.includes('/inbox') ? '' : 'pb-20 overflow-y-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
