import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Filter, 
  Settings2, 
  Database, 
  Layers, 
  RotateCcw, 
  Download, 
  Plus, 
  CheckCircle2, 
  TrendingUp,
  Scale,
  Calendar,
  Search
} from 'lucide-react';

export const AuditSamplingView: React.FC = () => {
  const [method, setMethod] = useState<'Statistical' | 'Non-Statistical'>('Statistical');
  const [sampleSize, setSampleSize] = useState(120);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <Filter className="w-8 h-8 text-amber-500" />
            Audit Sampling
          </h1>
          <p className="text-slate-400 mt-1">Design and extract audit samples based on professional standards and risk profiling.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">
             <Layers className="w-4 h-4" />
             Generate New Sample
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sampling Configuration */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-slate-50 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-sky-400" />
                    Sampling Parameters
                 </h3>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sampling Method</label>
                    <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                       {['Statistical', 'Non-Statistical'].map(m => (
                         <button
                           key={m}
                           onClick={() => setMethod(m as any)}
                           className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                             method === m ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                           }`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Target Sample Size</label>
                       <span className="text-xs font-mono font-bold text-sky-400">{sampleSize} Vouchers</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="1000" 
                      value={sampleSize}
                      onChange={(e) => setSampleSize(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Selection Logic</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium">
                       <option>Systematic Random Selection</option>
                       <option>Stratified Random Sampling</option>
                       <option>Monetary Unit Sampling (MUS)</option>
                       <option>Block Selection</option>
                       <option>Haphazard Selection</option>
                    </select>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Profile Impact</h4>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-slate-400">Confidence Level</span>
                       <span className="text-xs font-bold text-emerald-400">95%</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-slate-400">Tolerable Error</span>
                       <span className="text-xs font-bold text-sky-400">₹5,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-slate-400">Estimated Exception Rate</span>
                       <span className="text-xs font-bold text-amber-400">2.5%</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                 <Scale className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-slate-50">Standard Compliance</h4>
                 <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Calculations follow SA 530 (Audit Sampling) guidance for determining sample sizes and evaluating results.
                 </p>
              </div>
           </div>
        </div>

        {/* Population & Universe Analysis */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-sky-500" />
                    <h3 className="text-sm font-bold text-slate-50">Total Population</h3>
                 </div>
                 <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-50 block">12,540</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Total Vouchers in Financial Year</span>
                 </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-50">Stratified Layers</h3>
                 </div>
                 <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-50 block">5</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Value-based Strata Identified</span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold text-slate-50">Strata Analysis & Allocation</h3>
                 <button className="text-[10px] font-black text-sky-500 uppercase tracking-widest hover:underline">Re-calculate Strata</button>
              </div>
              
              <div className="space-y-6">
                 {[
                   { label: 'High Value (> ₹1,00,000)', count: 42, color: 'bg-emerald-500', pct: 100 },
                   { label: 'Medium Value (₹25k - ₹1L)', count: 245, color: 'bg-sky-500', pct: 40 },
                   { label: 'Routine (₹5k - ₹25k)', count: 1840, color: 'bg-amber-500', pct: 15 },
                   { label: 'Small Value (< ₹5k)', count: 10413, color: 'bg-slate-600', pct: 5 }
                 ].map((strata) => (
                   <div key={strata.label} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <div>
                            <span className="text-xs font-bold text-slate-200 block">{strata.label}</span>
                            <span className="text-[10px] text-slate-500">{strata.count} vouchers in population</span>
                         </div>
                         <div className="text-right">
                            <span className="text-xs font-bold text-slate-100 block">{Math.ceil(strata.count * strata.pct / 100)} items</span>
                            <span className="text-[10px] text-slate-500">Allocation: {strata.pct}%</span>
                         </div>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full ${strata.color}`} style={{ width: `${strata.pct}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex items-center gap-4 bg-sky-950/20 border border-sky-500/20 rounded-2xl p-4">
              <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
              <p className="text-xs text-sky-200/70">
                 Current configuration results in a total sample size of <span className="text-sky-400 font-bold">120 vouchers</span> covering <span className="text-sky-400 font-bold">₹2.4 Cr</span> of total value.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
