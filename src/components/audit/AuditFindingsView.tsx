import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Plus, 
  Filter, 
  ChevronRight, 
  FileText, 
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { AuditFinding, RiskLevel } from '../../types/audit';

export const AuditFindingsView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  const findings: AuditFinding[] = [
    {
      id: 'FIND-2024-001',
      risk: 'HIGH',
      category: 'Internal Controls',
      transactionDetails: 'Multiple high-value cash payments to local vendors exceeding ₹10k.',
      reasonDetected: 'Cash Limit Violation Rule',
      auditorNotes: 'Management needs to explain the business necessity of cash payments for capital procurement.',
      attachments: ['Voucher_00124.pdf', 'Vendor_Statement.csv'],
      status: 'Pending',
      conclusion: '',
      createdAt: '2024-05-18T10:00:00Z',
      updatedAt: '2024-05-19T14:30:00Z'
    },
    {
      id: 'FIND-2024-002',
      risk: 'MEDIUM',
      category: 'Revenue Recognition',
      transactionDetails: 'Sales returns recorded in subsequent period for year-end bulk orders.',
      reasonDetected: 'Channel Stuffing Pattern',
      auditorNotes: 'Investigate if sales were artificially inflated at year-end with planned returns.',
      attachments: ['Return_Register.pdf'],
      status: 'Under Review',
      conclusion: '',
      createdAt: '2024-05-15T09:00:00Z',
      updatedAt: '2024-05-15T09:00:00Z'
    },
    {
      id: 'FIND-2024-003',
      risk: 'LOW',
      category: 'Statutory Compliance',
      transactionDetails: 'TDS not deducted on professional fees for 3 small vouchers.',
      reasonDetected: 'Threshold Breach Alert',
      auditorNotes: 'Cumulative payment crossed ₹30k threshold; TDS should have been triggered.',
      attachments: [],
      status: 'Genuine',
      conclusion: 'Management admitted oversight; corrective entry passed in May-24.',
      createdAt: '2024-05-12T11:45:00Z',
      updatedAt: '2024-05-20T16:20:00Z'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-sky-500" />
            Audit Findings
          </h1>
          <p className="text-slate-400 mt-1">Document, track, and conclude on identified audit issues and control weaknesses.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">
             <Plus className="w-4 h-4" />
             Create Manual Finding
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Stats & Filters */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="space-y-2">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Finding Statistics</h3>
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                       <span className="text-2xl font-black text-slate-50 block">{findings.length}</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
                    </div>
                    <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                       <span className="text-2xl font-black text-rose-500 block">{findings.filter(f => f.risk === 'HIGH').length}</span>
                       <span className="text-[10px] text-rose-400 font-bold uppercase">Critical</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Filter Findings</h3>
                 <div className="space-y-1">
                    {[
                      { id: 'ALL', label: 'All Findings', icon: Briefcase },
                      { id: 'PENDING', label: 'Pending Action', icon: Clock },
                      { id: 'RESOLVED', label: 'Concluded', icon: ShieldCheck }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => setActiveFilter(btn.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          activeFilter === btn.id 
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-900/20' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <btn.icon className="w-4 h-4" />
                        {btn.label}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-slate-50 mb-4 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-amber-500" />
                 Unconcluded Issues
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                 There are <span className="text-slate-200 font-bold">2 high-risk</span> findings that have remained open for more than 7 days.
              </p>
              <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                 Review Escalations
              </button>
           </div>
        </div>

        {/* Right Column: Findings Feed */}
        <div className="lg:col-span-3 space-y-4">
           {findings.map((finding) => (
             <motion.div 
               layout
               key={finding.id}
               className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all shadow-lg"
             >
               <div className="flex flex-col md:flex-row">
                  {/* Risk Indicator Side */}
                  <div className={`w-1.5 ${
                    finding.risk === 'HIGH' ? 'bg-rose-500' :
                    finding.risk === 'MEDIUM' ? 'bg-amber-500' :
                    'bg-sky-500'
                  }`} />
                  
                  <div className="flex-1 p-6 space-y-4">
                     <div className="flex items-start justify-between">
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest">{finding.id}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                finding.risk === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                finding.risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-sky-500/10 text-sky-500 border-sky-500/20'
                              }`}>
                                {finding.risk} RISK
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                                {finding.category}
                              </span>
                           </div>
                           <h3 className="text-base font-bold text-slate-50 mt-2">{finding.transactionDetails}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider ${
                             finding.status === 'Pending' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                             finding.status === 'Genuine' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                             'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                           }`}>
                             {finding.status.toUpperCase()}
                           </span>
                           <span className="text-[10px] text-slate-500 flex items-center gap-1">
                             <Clock className="w-3 h-3" /> Updated 2h ago
                           </span>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 rounded-xl p-4 border border-slate-800/50">
                        <div className="space-y-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Detection Reason</span>
                           <p className="text-xs text-slate-300 leading-relaxed">{finding.reasonDetected}</p>
                        </div>
                        <div className="space-y-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Auditor Notes</span>
                           <p className="text-xs text-slate-300 leading-relaxed italic">"{finding.auditorNotes}"</p>
                        </div>
                     </div>

                     {finding.conclusion && (
                       <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Final Conclusion</span>
                             <p className="text-xs text-emerald-100/80 leading-relaxed">{finding.conclusion}</p>
                          </div>
                       </div>
                     )}

                     <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                        <div className="flex items-center gap-3">
                           {finding.attachments.length > 0 ? (
                             <div className="flex items-center gap-2 text-sky-400 text-[10px] font-bold">
                               <FileText className="w-3.5 h-3.5" />
                               {finding.attachments.length} Evidence Linked
                             </div>
                           ) : (
                             <span className="text-slate-600 text-[10px]">No attachments</span>
                           )}
                           <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-all px-2 py-1 rounded hover:bg-slate-800">
                             <MessageSquare className="w-3.5 h-3.5" />
                             3 Discussions
                           </button>
                        </div>
                        <div className="flex items-center gap-2">
                           <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-all flex items-center gap-2">
                             Full Analysis <ExternalLink className="w-3.5 h-3.5" />
                           </button>
                           <button className="px-4 py-1.5 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 rounded-lg text-xs font-bold border border-sky-500/20 transition-all">
                             Update Finding
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             </motion.div>
           ))}

           {findings.length === 0 && (
             <div className="py-24 text-center">
                <ShieldCheck className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                <h3 className="text-slate-300 font-bold text-lg">Clean Record</h3>
                <p className="text-slate-500 text-sm">No audit findings registered for this company context.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
