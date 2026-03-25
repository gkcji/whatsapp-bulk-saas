"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Attempt to hit the REAL backend API
      const res = await axios.post("http://localhost:5000/api/auth/login", {
         email,
         password
      });

      // Step 2: Extract real JWT token provided by Express
      const token = res.data.token;
      
      // Step 3: Save to localStorage to persist sessions safely
      localStorage.setItem("token", token);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userRole", res.data.user.role);
      
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message === "Network Error") {
         setError("Critical: Node.js Backend is not running on port 5000.");
      } else {
         setError(err.response?.data?.error || "Invalid Credentials");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-auto">
         <div className="p-10">
            
            <div className="flex items-center justify-center mb-8">
               <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <span className="text-3xl">🚀</span>
               </div>
            </div>

            <h1 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm font-bold text-slate-400 text-center uppercase tracking-widest mb-10">Sign in to your Workspace</p>

            {error && (
               <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-4 rounded-xl mb-6 text-center">
                  {error}
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <input 
                     type="email" 
                     required
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                     placeholder="admin@saas.com" 
                  />
               </div>
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                     <span className="text-xs font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors">Forgot?</span>
                  </div>
                  <input 
                     type="password" 
                     required
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                     placeholder="••••••••" 
                  />
               </div>

               <button disabled={loading} type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                  {loading ? <span className="animate-spin">⏳</span> : null}
                  {loading ? "Authenticating Request..." : "Secure Login"}
               </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6">
               <button onClick={() => router.push('/register')} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                  Create a new account
               </button>
            </div>

         </div>
      </div>
      
      {/* Simple debug note so the user isn't stuck */}
      <div className="mt-8 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 inline-block">
         💡 Note: The API must be running (`npm run dev` in backend) and MySQL configured to login securely.
      </div>
    </div>
  );
}
