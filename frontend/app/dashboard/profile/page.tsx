"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatIST } from "@/lib/india";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });

export default function WhatsappProfilePage() {
  const router = useRouter();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [profile, setProfile] = useState<any>({
    about: "",
    address: "",
    description: "",
    email: "",
    vertical: "OTHER",
    websites: [""],
    profile_picture_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    try {
      const res = await apiFetch("/numbers");
      const d = await res.json();
      setNumbers(d.numbers || []);
      if (d.numbers?.length > 0) {
        setSelectedId(d.numbers[0].id);
        fetchProfile(d.numbers[0].id);
      }
    } catch (e) {}
    setLoading(false);
  };

  const fetchProfile = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/numbers/${id}/profile`);
      const d = await res.json();
      if (d.profile) {
          setProfile({
              about: d.profile.about || "",
              address: d.profile.address || "",
              description: d.profile.description || "",
              email: d.profile.email || "",
              vertical: d.profile.vertical || "OTHER",
              websites: d.profile.websites || [""],
              profile_picture_url: d.profile.profile_picture_url || ""
          });
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/numbers/${selectedId}/profile`, {
          method: "POST",
          body: JSON.stringify(profile)
      });
      const d = await res.json();
      if (d.success) alert("WhatsApp Business Profile updated successfully!");
      else alert(d.error || "Update failed");
    } catch (e) { alert("Error updating profile"); }
    setSaving(false);
  };

  if (loading && numbers.length === 0) return <div className="p-10 font-bold">Loading Meta Profile...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto custom-scrollbar">
      <header className="px-10 py-8 bg-white border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">WhatsApp Business Profile</h1>
           <p className="text-slate-500 mt-1 font-medium text-sm">Update your public-facing business info, display picture, and about section.</p>
        </div>
        <div className="flex items-center gap-4">
            <select 
                value={selectedId} 
                onChange={(e) => { setSelectedId(e.target.value); fetchProfile(e.target.value); }}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-sm shadow-sm outline-none"
            >
                {numbers.map(n => <option key={n.id} value={n.id}>{n.phoneNumber} ({n.status})</option>)}
            </select>
            <button 
                onClick={handleSave} 
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
                {saving ? "Updating..." : "Save Changes"}
            </button>
        </div>
      </header>

      <div className="p-10 max-w-[1000px] mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
                
                {/* SIDEBAR: Preview & Photo */}
                <div className="p-8 bg-slate-50 border-r border-slate-200 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 relative group">
                        {profile.profile_picture_url ? (
                            <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl font-bold">WA</div>
                        )}
                    </div>
                    <p className="mt-4 font-black text-slate-800 text-lg">Business Preview</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live on WhatsApp</p>
                    
                    <div className="mt-8 w-full space-y-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Status / About</p>
                            <p className="text-sm font-medium text-slate-700 italic">"{profile.about}"</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Vertical</p>
                            <p className="text-sm font-bold text-slate-800">{profile.vertical}</p>
                        </div>
                    </div>
                </div>

                {/* MAIN FORM */}
                <div className="md:col-span-2 p-10 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">About / Status</label>
                            <input 
                                type="text" 
                                value={profile.about} 
                                onChange={(e) => setProfile({...profile, about: e.target.value})}
                                placeholder="I am using WhatsApp"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Vertical</label>
                            <select 
                                value={profile.vertical}
                                onChange={(e) => setProfile({...profile, vertical: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800 appearance-none"
                            >
                                <option value="AUTOMOTIVE">Automotive</option>
                                <option value="BEAUTY">Beauty & Spa</option>
                                <option value="EDUCATION">Education</option>
                                <option value="ENTERTAINMENT">Entertainment</option>
                                <option value="FINANCE">Finance & Banking</option>
                                <option value="HEALTH">Healthcare</option>
                                <option value="PROF_SERVICES">Professional Services</option>
                                <option value="RETAIL">Retail / E-commerce</option>
                                <option value="TRAVEL">Travel & Tourism</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Description</label>
                        <textarea 
                            rows={3}
                            value={profile.description} 
                            onChange={(e) => setProfile({...profile, description: e.target.value})}
                            placeholder="Tell your customers about your business..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Email</label>
                            <input 
                                type="email" 
                                value={profile.email} 
                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                placeholder="support@business.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Website URL</label>
                            <input 
                                type="text" 
                                value={profile.websites[0]} 
                                onChange={(e) => setProfile({...profile, websites: [e.target.value]})}
                                placeholder="https://www.business.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Address</label>
                        <input 
                            type="text" 
                            value={profile.address} 
                            onChange={(e) => setProfile({...profile, address: e.target.value})}
                            placeholder="Unit 1, Tech Park, Mumbai, India"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-800"
                        />
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                        <span className="text-xl">ℹ️</span>
                        <div>
                            <p className="text-xs font-bold text-indigo-700">Meta Sync Notice</p>
                            <p className="text-[10px] text-indigo-600 mt-1 font-medium">Changes here update your profile directly on Meta. It might take up to 24 hours for all customers to see the updated business details.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
