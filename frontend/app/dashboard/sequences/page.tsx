export default function SequencesPage() {
  return (
    <>
      <header className="flex justify-between items-center p-8 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Follow-up Sequences</h1>
          <p className="text-slate-500 mt-1 font-medium">Automate drip campaigns and cart recovery follow-ups.</p>
        </div>
        <button className="px-6 py-3 bg-pink-600 text-white rounded-full font-bold shadow-lg shadow-pink-500/30 hover:bg-pink-700 transition-all">
          + New Sequence
        </button>
      </header>

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Sample Sequence Editor */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div>
               <h2 className="text-xl font-bold text-slate-800">Abandoned Cart Recovery</h2>
               <p className="text-sm text-slate-500 mt-1">Triggered when tag <span className="px-2 py-0.5 bg-slate-200 rounded">cart_abandoned</span> is added.</p>
             </div>
             <div className="flex gap-2 items-center">
               <span className="text-sm font-bold text-green-600 mr-2">🟢 ACTIVE</span>
               <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold text-sm">Edit</button>
             </div>
          </div>
          
          <div className="p-8 space-y-0">
             
             {/* Step 1 */}
             <div className="flex">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center border-2 border-pink-200">1</div>
                  <div className="w-1 hover:w-2 bg-slate-200 h-24 my-1 transition-all"></div>
                </div>
                <div className="pb-8 flex-1">
                   <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-pink-300 transition-colors">
                     <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Wait 1 Hour</p>
                     <p className="text-slate-800 font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                       "Hi {'{{name}}'}, we noticed you left some items in your cart. Still interested?"
                     </p>
                   </div>
                </div>
             </div>

             {/* Step 2 */}
             <div className="flex">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center border-2 border-pink-200">2</div>
                  <div className="w-1 bg-slate-200 h-24 my-1"></div>
                </div>
                <div className="pb-8 flex-1">
                   <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-pink-300 transition-colors">
                     <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Wait 24 Hours</p>
                     <p className="text-slate-800 font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm">
                       Condition: If NO reply<br/>
                       "As a special gift, here's 10% off your cart today using code SAVE10!"
                     </p>
                   </div>
                </div>
             </div>

             {/* Add Step */}
             <div className="flex">
                <div className="flex flex-col items-center mr-6">
                  <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 font-bold flex items-center justify-center border-2 border-dashed border-slate-300 hover:bg-slate-200 hover:text-slate-600 transition-colors">+</button>
                </div>
                <div className="flex items-center text-slate-400 font-bold">
                   Add next step
                </div>
             </div>

          </div>
        </div>

      </div>
    </>
  )
}
