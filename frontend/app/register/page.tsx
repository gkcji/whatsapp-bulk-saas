"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Attempt to register with the REAL backend API
      const res = await axios.post("http://localhost:5000/api/auth/register", {
         email,
         password,
         name
      });

      // Step 2: Extract real JWT token and persist heavily
      const token = res.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userRole", res.data.user.role);
      
      router.push("/dashboard/settings"); // Pushed straight to settings to setup Meta APIs
    } catch (err: any) {
      if (err.message === "Network Error") {
         setError("Critical: Node.js Backend is not running on port 5000.");
      } else {
         setError(err.response?.data?.error || "Registration Failed.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-auto">
         <div className="p-10">
            
            <div className="flex items-center justify-center mb-6">
               <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-3xl">🔑</span>
               </div>
            </div>

            <h1 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Create Workspace</h1>
            <p className="text-sm font-bold text-slate-400 text-center uppercase tracking-widest mb-8">Deploy your own WhatsApp CRM tenant</p>

            {error && (
               <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-4 rounded-xl mb-6 text-center">
                  {error}
               </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Workspace / Admin Name</label>
                  <input 
                     type="text" 
                     required
                     value={name}
                     onChange={e => setName(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                     placeholder="John Doe" 
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <input 
                     type="email" 
                     required
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                     placeholder="admin@saas.com" 
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Secure Password</label>
                  <input 
                     type="password" 
                     required
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                     placeholder="••••••••••" 
                  />
               </div>

               <button disabled={loading} type="submit" className="w-full py-4 bg-slate-800 hover:bg-slate-900 mt-2 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                  {loading ? <span className="animate-spin">⏳</span> : null}
                  {loading ? "Provisioning Tenant..." : "Create Account"}
               </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6">
               <button onClick={() => router.push('/login')} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                  Log in securely
               </button>
            </div>

         </div>
      </div>
    </div>
  );
}
