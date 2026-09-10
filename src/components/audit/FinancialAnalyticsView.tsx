import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  Calendar,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

export const FinancialAnalyticsView: React.FC = () => {
  const kpis = [
    { label: 'Revenue (MTD)', value: '₹4.2 Cr', trend: '+12.5%', status: 'up' },
    { label: 'Net Margin', value: '18.4%', trend: '-2.1%', status: 'down' },
    { label: 'Avg Payment Term', value: '38 Days', trend: '-4 Days', status: 'up' },
    { label: 'Cash Reserve', value: '₹1.8 Cr', trend: '+5.4%', status: 'up' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
            Financial Analytics
          </h1>
          <p className="text-slate-400 mt-1">Multi-dimensional financial intelligence and performance monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold border border-slate-700 transition-all">
             <Calendar className="w-4 h-4" />
             FY 2024-25
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">
             <Filter className="w-4 h-4" />
             Custom Filter
           </button>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            key={kpi.label}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group"
          >
             <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{kpi.label}</span>
                <div className="flex items-end gap-3">
                   <span className="text-2xl font-black text-slate-50">{kpi.value}</span>
                   <div className={`flex items-center gap-1 text-[11px] font-bold pb-1 ${
                     kpi.status === 'up' ? 'text-emerald-400' : 'text-rose-400'
                   }`}>
                      {kpi.status === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {kpi.trend}
                   </div>
                </div>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <BarChart3 className="w-24 h-24 text-white" />
             </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-500" />
                  Revenue vs Expense Trend
               </h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Expense</span>
                  </div>
               </div>
            </div>
            
            <div className="h-64 w-full flex items-end gap-2 px-2">
               {[40, 65, 35, 55, 80, 45, 60, 75, 40, 90, 50, 70].map((h, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1 items-end h-full">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${h}%` }}
                         transition={{ delay: i * 0.05 }}
                         className="flex-1 bg-sky-500/80 rounded-t-sm" 
                       />
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${h * 0.6}%` }}
                         transition={{ delay: i * 0.05 + 0.1 }}
                         className="flex-1 bg-rose-500/80 rounded-t-sm" 
                       />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">
                       {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                    </span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-8">
            <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
               <PieChart className="w-5 h-5 text-indigo-500" />
               Expense Distribution
            </h3>
            
            <div className="flex flex-col gap-6">
               {[
                 { label: 'Raw Materials', val: '45%', color: 'bg-indigo-500' },
                 { label: 'Personnel', val: '28%', color: 'bg-sky-500' },
                 { label: 'Operations', val: '15%', color: 'bg-emerald-500' },
                 { label: 'Marketing', val: '12%', color: 'bg-amber-500' },
               ].map(item => (
                 <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-300">{item.label}</span>
                       <span className="font-mono text-slate-500">{item.val}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color}`} style={{ width: item.val }} />
                    </div>
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-slate-800">
               <button className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  View Detailed Ledger Analysis <ArrowRight className="w-3.5 h-3.5" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
