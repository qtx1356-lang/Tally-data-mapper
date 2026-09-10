import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FolderTree, 
  Search, 
  Plus, 
  FileText, 
  MoreVertical, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Grid
} from 'lucide-react';

export const AuditWorkspaceView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'All' | 'My Files' | 'Recent'>('All');

  const folders = [
    { name: 'Voucher Samples', items: 12, size: '2.4 MB', updated: '2h ago', color: 'text-sky-500' },
    { name: 'Exception Evidence', items: 24, size: '15.8 MB', updated: '5h ago', color: 'text-rose-500' },
    { name: 'Management Replies', items: 8, size: '4.2 MB', updated: '1d ago', color: 'text-amber-500' },
    { name: 'Draft Findings', items: 5, size: '1.1 MB', updated: '3h ago', color: 'text-emerald-500' },
    { name: 'Reporting Templates', items: 10, size: '0.8 MB', updated: '4d ago', color: 'text-purple-500' },
    { name: 'Tally Data Snapshots', items: 42, size: '124 MB', updated: '20m ago', color: 'text-indigo-500' },
  ];

  const recentFiles = [
    { name: 'Sample_MAY24_Cash_Payments.xlsx', type: 'EXCEL', author: 'System', date: 'Today, 14:30' },
    { name: 'Internal_Control_Questionnaire.pdf', type: 'PDF', author: 'S. Mehta', date: 'Yesterday' },
    { name: 'Draft_Audit_Observation_v1.docx', type: 'WORD', author: 'P. Sharma', date: '22-May-2024' },
    { name: 'Verification_Notes_Modern_Electronics.pdf', type: 'PDF', author: 'P. Sharma', date: '21-May-2024' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <FolderTree className="w-8 h-8 text-sky-500" />
            Audit Workspace
          </h1>
          <p className="text-slate-400 mt-1">Manage documents, working papers, and evidence collections in a secure collaborative space.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button className="p-2 text-sky-500 bg-slate-800 rounded-lg shadow-sm">
                 <Grid className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-300 transition-all">
                 <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
           </div>
           <button className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">
             <Plus className="w-4 h-4" />
             New Project
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search workspace..." 
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                 />
              </div>

              <div className="space-y-1">
                 {[
                   { label: 'All Projects', count: 12, icon: FolderTree },
                   { label: 'My Workpapers', count: 4, icon: FileText },
                   { label: 'Shared with Me', count: 8, icon: Users },
                   { label: 'Recently Viewed', count: null, icon: Clock },
                 ].map((item, idx) => (
                   <button
                     key={item.label}
                     className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                       idx === 0 ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${idx === 0 ? 'text-sky-400' : 'text-slate-500'}`} />
                        {item.label}
                     </div>
                     {item.count !== null && (
                       <span className="bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{item.count}</span>
                     )}
                   </button>
                 ))}
              </div>

              <div className="pt-4 border-t border-slate-800">
                 <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Workspace Health</h4>
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Cloud Storage Used</span>
                          <span className="text-emerald-400">42%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[42%]" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
           {/* Folders Grid */}
           <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Workspace Directories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                 {folders.map((folder) => (
                   <motion.div 
                     whileHover={{ y: -4 }}
                     key={folder.name}
                     className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all cursor-pointer group"
                   >
                      <div className="flex items-start justify-between mb-4">
                         <div className={`p-3 bg-slate-800 rounded-xl ${folder.color}`}>
                            <FolderTree className="w-6 h-6" />
                         </div>
                         <button className="p-1 hover:bg-slate-800 rounded-lg text-slate-600 transition-all opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-bold text-slate-200">{folder.name}</h4>
                         <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <span>{folder.items} Items</span>
                            <span>•</span>
                            <span>{folder.size}</span>
                         </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                         <span>Last Modified</span>
                         <span>{folder.updated}</span>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>

           {/* Recent Files Table */}
           <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Recent Activity</h3>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                 <table className="w-full text-left text-xs">
                    <thead>
                       <tr className="bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-6 py-3">File Name</th>
                          <th className="px-6 py-3">Format</th>
                          <th className="px-6 py-3">Contributor</th>
                          <th className="px-6 py-3 text-right">Date</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                       {recentFiles.map((file) => (
                         <tr key={file.name} className="hover:bg-slate-800/30 transition-all cursor-pointer group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3 text-slate-200 group-hover:text-sky-400 transition-colors">
                                  <FileText className="w-4 h-4 text-slate-500" />
                                  <span className="font-medium">{file.name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
                                 file.type === 'EXCEL' ? 'bg-emerald-500/10 text-emerald-500' :
                                 file.type === 'PDF' ? 'bg-rose-500/10 text-rose-500' :
                                 'bg-sky-500/10 text-sky-500'
                               }`}>
                                  {file.type}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2 text-slate-400">
                                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-700">
                                     {file.author.substring(0, 1)}
                                  </div>
                                  {file.author}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500 font-mono font-medium">
                               {file.date}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
