import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Search, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Filter,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';
import { RiskLevel, AuditRule } from '../../types/audit';

export const AuditScannerView: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Cash & Bank', 'Inventory', 'GST & Taxation', 'Ledger Analysis', 'Voucher Pattern'];

  const initialRules: AuditRule[] = [
    { id: '1', name: 'High Value Cash Payment', description: 'Detects cash payments exceeding statutory limits (e.g., > ₹10,000).', category: 'Cash & Bank', severity: 'HIGH', enabled: true },
    { id: '2', name: 'Duplicate Voucher Numbering', description: 'Identifies vouchers with identical numbers within the same series.', category: 'Voucher Pattern', severity: 'MEDIUM', enabled: true },
    { id: '3', name: 'Negative Cash Balance', description: 'Flags dates where the cumulative cash balance becomes negative.', category: 'Cash & Bank', severity: 'HIGH', enabled: true },
    { id: '4', name: 'Potential Round Sum Payments', description: 'Identifies frequent round-sum payments to single vendors.', category: 'Ledger Analysis', severity: 'LOW', enabled: false },
    { id: '5', name: 'GST Rate Mismatch', description: 'Detects discrepancies between ledger tax rates and voucher calculations.', category: 'GST & Taxation', severity: 'MEDIUM', enabled: true },
    { id: '6', name: 'Backdated Vouchers', description: 'Finds vouchers entered with dates significantly prior to current system date.', category: 'Voucher Pattern', severity: 'MEDIUM', enabled: true },
    { id: '7', name: 'Abnormal Inventory Movement', description: 'Flags stock transfers or sales with unusual pricing or quantity.', category: 'Inventory', severity: 'HIGH', enabled: true },
    { id: '8', name: 'Direct Expense Outliers', description: 'Statistically significant deviations in recurring direct expenses.', category: 'Ledger Analysis', severity: 'LOW', enabled: true },
  ];

  const [rules, setRules] = useState<AuditRule[]>(initialRules);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  };

  const filteredRules = selectedCategory === 'All' 
    ? rules 
    : rules.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <Activity className="w-8 h-8 text-emerald-500" />
            Automated Audit Scanner
          </h1>
          <p className="text-slate-400 mt-1">Configure and execute modular audit rule-sets against TallyPrime datasets.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold border border-slate-700 transition-all">
             <Settings className="w-4 h-4" />
             Scanner Config
           </button>
           <button 
             onClick={() => setIsScanning(!isScanning)}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${
               isScanning 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
             }`}
           >
             {isScanning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
             {isScanning ? 'Stop Scanner' : 'Run Full Scan'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
             </h3>
             <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                      selectedCategory === cat 
                        ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <h4 className="text-sm font-bold text-slate-50">Scanner Engine</h4>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-[11px]">
                   <span className="text-slate-400">Total Rules Loaded</span>
                   <span className="text-slate-200 font-mono">{rules.length}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                   <span className="text-slate-400">Enabled Rules</span>
                   <span className="text-emerald-400 font-mono">{rules.filter(r => r.enabled).length}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                   <span className="text-slate-400">Analysis Engine</span>
                   <span className="text-sky-400">v2.4 Core</span>
                </div>
             </div>
             <div className="pt-4">
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                   <RotateCcw className="w-3 h-3" />
                   Reset Defaults
                </button>
             </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="lg:col-span-3 space-y-4">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-50">Active Audit Rules</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search rules..." 
                   className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-64"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {filteredRules.map((rule) => (
                <motion.div 
                  layout
                  key={rule.id}
                  className={`bg-slate-900/50 border rounded-2xl p-5 transition-all group ${
                    rule.enabled ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                       <div className={`mt-1 p-2 rounded-xl border ${
                         rule.severity === 'HIGH' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                         rule.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                         'bg-sky-500/10 border-sky-500/20 text-sky-500'
                       }`}>
                          <Shield className="w-5 h-5" />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-50 text-sm">{rule.name}</h4>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                              {rule.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{rule.description}</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={rule.enabled}
                            onChange={() => toggleRule(rule.id)}
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                       </label>
                       <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black tracking-widest ${
                            rule.severity === 'HIGH' ? 'text-rose-500' :
                            rule.severity === 'MEDIUM' ? 'text-amber-500' :
                            'text-sky-500'
                          }`}>
                            {rule.severity} RISK
                          </span>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
