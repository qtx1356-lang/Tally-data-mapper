import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileText,
  Search,
  Filter,
  BarChart3,
  Zap,
  Shield,
  Briefcase,
  Brain
} from 'lucide-react';
import { AuditSummary, AuditException } from '../../types/audit';

interface AuditCenterViewProps {
  selectedCompany: any;
  connectionStatus: string;
}

export const AuditCenterView: React.FC<AuditCenterViewProps> = ({ selectedCompany, connectionStatus }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics'>('overview');

  const summary: AuditSummary = {
    companyName: selectedCompany?.name || 'No Company Selected',
    financialYear: '2024-25',
    dataConnectionStatus: connectionStatus,
    lastScanDate: '2024-05-20 14:30',
    totalVouchersAnalysed: 12540,
    totalLedgersAnalysed: 450,
    totalExceptions: 84,
    highRiskExceptions: 12,
    mediumRiskExceptions: 28,
    lowRiskExceptions: 44,
    progress: 100
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsScanning(false), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-sky-500" />
            Audit Center
          </h1>
          <p className="text-slate-400 mt-1">
            Centralized audit intelligence and risk management for <span className="text-sky-400 font-semibold">{summary.companyName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRunScan}
            disabled={isScanning || connectionStatus !== 'Connected'}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg ${
              isScanning 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : connectionStatus === 'Connected'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isScanning ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Scanning {scanProgress}%
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Complete Audit Scan
              </>
            )}
          </button>
        </div>
      </div>

      {isScanning && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-4 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Running Diagnostic Rules...</span>
            <span className="text-xs font-mono text-sky-300">{scanProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Risk Score Card */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Overall Risk Score</h3>
          <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40">
              <circle 
                cx="80" cy="80" r="70" 
                className="stroke-slate-800" 
                strokeWidth="10" fill="transparent" 
              />
              <motion.circle 
                cx="80" cy="80" r="70" 
                className="stroke-rose-500" 
                strokeWidth="10" fill="transparent"
                strokeDasharray="440"
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * 0.32) }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-50">32</span>
              <span className="text-xs font-bold text-rose-400">MODERATE</span>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] mt-6 px-4">
            Based on 84 exceptions identified across 12,540 analysed vouchers.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-rose-400 text-xs font-bold">+12% vs LY</span>
            </div>
            <span className="text-3xl font-black text-slate-50 block">{summary.highRiskExceptions}</span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">High Risk Exceptions</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-amber-400 text-xs font-bold">-5% vs LY</span>
            </div>
            <span className="text-3xl font-black text-slate-50 block">{summary.mediumRiskExceptions}</span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Medium Risk Exceptions</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-sky-500" />
              </div>
              <span className="text-sky-400 text-xs font-bold">Stable</span>
            </div>
            <span className="text-3xl font-black text-slate-50 block">{summary.lowRiskExceptions}</span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Low Risk Exceptions</span>
          </div>

          <div className="md:col-span-3 bg-[#1E293B] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8">
             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-sky-500" />
                  <h4 className="font-bold text-slate-50">Tally Analysis Health</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Analysis Coverage</span>
                    <span className="text-sm font-bold text-emerald-400">98.4% of Vouchers</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Sync Status</span>
                    <span className="text-sm font-bold text-sky-400">Live (TallyPrime)</span>
                  </div>
                </div>
             </div>
             <div className="h-12 w-px bg-slate-800 hidden md:block" />
             <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                   <span className="text-slate-400">Ledger Mapping Integrity</span>
                   <span className="text-sky-400">94%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-sky-500 w-[94%]" />
                </div>
             </div>
             <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                   <span className="text-slate-400">Schema Discovery</span>
                   <span className="text-emerald-400">100%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-full" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Exceptions
            </h3>
            <button className="text-sky-500 text-xs font-bold hover:underline">View All Exceptions</button>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold">Voucher Details</th>
                  <th className="px-4 py-3 font-bold">Party / Ledger</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Risk</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-200">PUR/24-25/00{item}4</div>
                      <div className="text-slate-500 text-[10px]">Purchase • 12-May-2024</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-300">Modern Electronics Ltd</div>
                      <div className="text-slate-500 text-[10px]">Trade Payables</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">
                      ₹12,450.00
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item === 1 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                        item % 2 === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                      }`}>
                        {item === 1 ? 'HIGH' : item % 2 === 0 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 group-hover:text-sky-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="p-3 bg-indigo-500/20 rounded-xl w-fit mb-4">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-black text-slate-50 mb-2">AI Audit Assistant</h3>
              <p className="text-indigo-200/70 text-xs leading-relaxed mb-6">
                Harness generative intelligence to explain complex Tally accounting patterns and automate rule generation.
              </p>
              <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
                Launch Intelligence
              </button>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Brain className="w-32 h-32 text-white" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
             <h3 className="text-sm font-bold text-slate-50 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                Audit Workspace
             </h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-sky-500/30 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-slate-200">Current Sample</span>
                   </div>
                   <span className="text-[10px] font-mono text-slate-500">120 Vouchers</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-sky-500/30 transition-all cursor-pointer">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-slate-200">Pending Findings</span>
                   </div>
                   <span className="text-[10px] font-mono text-slate-500">8 Items</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
