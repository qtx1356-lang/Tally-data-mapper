import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  MoreVertical,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  FileText
} from 'lucide-react';
import { AuditException, RiskLevel } from '../../types/audit';

export const ExceptionCenterView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

  const exceptions: AuditException[] = [
    { id: 'EX-1001', risk: 'HIGH', riskScore: 88, date: '2024-05-12', voucherNo: 'PUR/00124', voucherType: 'Purchase', ledger: 'Cash', party: 'Modern Electronics Ltd', amount: 45000, exceptionType: 'Potential High-Value Transaction', reason: 'Potential high-value transaction — review applicability of relevant tax provisions based on transaction nature, aggregation and payment/receipt context.', status: 'Pending' },
    { id: 'EX-1002', risk: 'MEDIUM', riskScore: 62, date: '2024-05-13', voucherNo: 'PAY/00542', voucherType: 'Payment', ledger: 'ICICI Bank', party: 'Consultancy Fees', amount: 15000, exceptionType: 'Backdated Entry Indicator', reason: 'Voucher date appears 45 days prior to system entry date; recommend verification with approval log.', status: 'Reviewed' },
    { id: 'EX-1003', risk: 'HIGH', riskScore: 92, date: '2024-05-14', voucherNo: 'SAL/00871', voucherType: 'Sales', ledger: 'Sales A/c', party: 'Walk-in Customer', amount: 125000, exceptionType: 'Negative Inventory Warning', reason: 'Sale recorded while stock register indicated zero balance; verify physical delivery note.', status: 'Pending' },
    { id: 'EX-1004', risk: 'LOW', riskScore: 24, date: '2024-05-15', voucherNo: 'EXP/00213', voucherType: 'Journal', ledger: 'Conveyance', party: 'Staff Welfare', amount: 1200, exceptionType: 'Unusual Pattern - Round Sum', reason: 'Recurring round sum entry; recommend sampling supporting petty vouchers.', status: 'Finding' },
    { id: 'EX-1005', risk: 'MEDIUM', riskScore: 55, date: '2024-05-16', voucherNo: 'PUR/00128', voucherType: 'Purchase', ledger: 'Input GST', party: 'Global Trading Co', amount: 84200, exceptionType: 'Tax Rate Variance Indicator', reason: 'Calculated GST rate appears different from standard schedule; review item HSN classification.', status: 'Pending' },
  ];

  const filteredExceptions = exceptions.filter(ex => {
    const matchesSearch = ex.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ex.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.exceptionType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || ex.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            Risk & Exception Center
          </h1>
          <p className="text-slate-400 mt-1">Audit exception intelligence for data-driven risk assessment.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold border border-slate-700 transition-all">
             <Download className="w-4 h-4" />
             Export Report
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search party, voucher or exception type..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-500 uppercase px-2">Risk:</span>
           <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(risk => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    riskFilter === risk 
                      ? 'bg-slate-800 text-slate-100 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {risk}
                </button>
              ))}
           </div>
        </div>
        <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all border border-slate-700">
           <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Exceptions Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4 font-bold text-[11px]">
                <div className="flex items-center gap-2">
                  Exception Details <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 font-bold text-[11px]">Voucher Context</th>
              <th className="px-6 py-4 font-bold text-[11px]">Party / Ledger</th>
              <th className="px-6 py-4 font-bold text-[11px] text-right">Amount</th>
              <th className="px-6 py-4 font-bold text-[11px]">Risk Status</th>
              <th className="px-6 py-4 font-bold text-[11px] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredExceptions.map((ex) => (
              <tr key={ex.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-6 py-5">
                   <div className="flex items-start gap-3">
                      <div className={`mt-1 p-1.5 rounded-lg ${
                        ex.risk === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                        ex.risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-sky-500/10 text-sky-500'
                      }`}>
                         <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                         <div className="font-bold text-slate-100">{ex.exceptionType}</div>
                         <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ex.reason}</div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="font-medium text-slate-300">{ex.voucherNo}</div>
                   <div className="text-[11px] text-slate-500">{ex.voucherType} • {ex.date}</div>
                </td>
                <td className="px-6 py-5">
                   <div className="font-medium text-slate-300">{ex.party}</div>
                   <div className="text-[11px] text-slate-500">{ex.ledger}</div>
                </td>
                <td className="px-6 py-5 text-right font-mono font-bold text-slate-100">
                   ₹{ex.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${
                              ex.risk === 'HIGH' ? 'bg-rose-500' :
                              ex.risk === 'MEDIUM' ? 'bg-amber-500' :
                              'bg-sky-500'
                            }`} style={{ width: `${ex.riskScore}%` }} />
                         </div>
                         <span className="text-[10px] font-mono text-slate-500">{ex.riskScore}</span>
                      </div>
                      <span className={`text-[10px] font-black tracking-widest ${
                        ex.risk === 'HIGH' ? 'text-rose-500' :
                        ex.risk === 'MEDIUM' ? 'text-amber-500' :
                        'text-sky-500'
                      }`}>
                         {ex.risk}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center justify-center gap-1">
                      <button className="p-2 hover:bg-slate-700 text-slate-400 hover:text-sky-400 rounded-lg transition-all" title="View Details">
                         <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded-lg transition-all" title="Mark as Finding">
                         <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 text-slate-400 rounded-lg transition-all">
                         <MoreVertical className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredExceptions.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <div className="inline-flex p-4 rounded-full bg-slate-800 text-slate-500">
                <Search className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-slate-200 font-bold">No exceptions found</h3>
                <p className="text-slate-500 text-xs">Try adjusting your filters or search terms.</p>
             </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-[#1E293B]/50 border border-slate-800/50 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-500">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-rose-500" /> High Risk: {exceptions.filter(e => e.risk === 'HIGH').length}
            </span>
            <span className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-amber-500" /> Medium Risk: {exceptions.filter(e => e.risk === 'MEDIUM').length}
            </span>
            <span className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-sky-500" /> Low Risk: {exceptions.filter(e => e.risk === 'LOW').length}
            </span>
         </div>
         <div className="font-medium">
            Showing <span className="text-slate-300 font-bold">{filteredExceptions.length}</span> of <span className="text-slate-300 font-bold">{exceptions.length}</span> exceptions identified.
         </div>
      </div>
    </div>
  );
};
