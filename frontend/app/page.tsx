import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8 text-white font-sans">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-sm">
          WhatsApp Bulk Messaging SaaS
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The easiest way to send bulk WhatsApp campaigns using the Official Meta API. Zero technical registration required for your customers.
        </p>

        <div className="flex justify-center gap-6 mt-12">
          <Link href="/dashboard" className="px-8 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-purple-100 hover:scale-105 transition-all shadow-lg shadow-purple-500/30">
            Open Dashboard
          </Link>
          <button className="px-8 py-4 bg-transparent border-2 border-purple-400 text-purple-300 rounded-full font-bold text-lg hover:bg-purple-900/50 transition-all">
            View Pricing
          </button>
        </div>
      </div>

      {/* Decorative background blur */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    </div>
  );
}
