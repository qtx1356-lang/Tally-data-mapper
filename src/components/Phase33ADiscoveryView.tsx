import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Search,
  Database,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  RefreshCw,
  GitMerge,
  ShieldCheck,
  Eye,
  Activity,
  Play
} from 'lucide-react';

import { 
  DiscoverySnapshot, 
  SemanticMapping, 
  OutputCapability, 
  CompanyCompatibility 
} from '../types/phase33ADiscovery';
import { runPhase33ATests, TestResult } from '../tests/phase33ADiscoveryTests';

export default function Phase33ADiscoveryView() {
  const [activeTab, setActiveTab] = useState<'connection' | 'discovery' | 'mapping' | 'catalog' | 'tests'>('connection');
  const [profile, setProfile] = useState<'comp_standard' | 'comp_limited'>('comp_standard');
  const [loading, setLoading] = useState(true);

  const [snapshot, setSnapshot] = useState<DiscoverySnapshot | null>(null);
  const [mappings, setMappings] = useState<SemanticMapping[]>([]);
  const [outputs, setOutputs] = useState<OutputCapability[]>([]);
  const [compatibility, setCompatibility] = useState<CompanyCompatibility | null>(null);
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/phase33a/discovery/${profile}`);
      const data = await res.json();
      setSnapshot(data.snapshot);
      setMappings(data.mappings);
      setOutputs(data.outputs);
      setCompatibility(data.compatibility);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      setTestResults(runPhase33ATests());
      setTestsRunning(false);
    }, 600);
  };

  const getStatusColor = (status: string) => {
    if (status === 'AVAILABLE' || status === 'MAPPED') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'UNAVAILABLE' || status === 'ERROR' || status === 'MISSING') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'PARTIAL' || status === 'REQUIRES_REVIEW' || status === 'REQUIRES_MAPPING') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-stone-100 text-stone-600 border-stone-200';
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 33A: Adaptive Tally Discovery</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">Real-world Structure Parsing & Semantic Mapping</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-2 mr-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">100% Read-Only Safety Enforced</span>
          </div>
          <select 
            value={profile} 
            onChange={(e) => setProfile(e.target.value as any)}
            className="text-sm border border-stone-200 rounded-md px-3 py-1.5 bg-white font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="comp_standard">Profile A: Standard Trading Co.</option>
            <option value="comp_limited">Profile B: Limited Service Co.</option>
          </select>
          <button onClick={fetchData} className="p-2 text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-md">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-[#EAE6DF] flex flex-col p-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Pipeline</div>
          
          <div className="flex flex-col gap-1">
            <button onClick={() => setActiveTab('connection')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'connection' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <LinkIcon className="w-4.5 h-4.5" /> <span>Connection Profile</span>
            </button>
            <button onClick={() => setActiveTab('discovery')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'discovery' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <Search className="w-4.5 h-4.5" /> <span>Discovery Snapshot</span>
            </button>
            <button onClick={() => setActiveTab('mapping')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'mapping' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <GitMerge className="w-4.5 h-4.5" /> <span>Semantic Mapping</span>
            </button>
            <button onClick={() => setActiveTab('catalog')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'catalog' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <FileText className="w-4.5 h-4.5" /> <span>Output Catalog</span>
            </button>
            <div className="mt-4 mb-2 border-t border-[#EAE6DF]"></div>
            <button onClick={() => setActiveTab('tests')} className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <Play className="w-4.5 h-4.5 text-emerald-600" /> <span>Discovery Tests</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="w-8 h-8 text-stone-300 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'connection' && compatibility && snapshot && (
                <motion.div key="connection" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 max-w-4xl">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Company Compatibility Matrix</h2>
                    <p className="text-sm text-stone-500 mt-1">Honest assessment of what this specific Tally profile supports based on live structure scans.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Overall Score</div>
                      <div className="text-4xl font-black text-indigo-700">{compatibility.overallScore}%</div>
                      <div className="text-xs text-stone-500 mt-2 font-medium">{compatibility.companyName}</div>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs col-span-2">
                       <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-4">Pipeline Health</div>
                       <div className="grid grid-cols-4 gap-4 text-sm font-semibold">
                         <div className="flex flex-col gap-1">
                           <span className="text-stone-500 text-xs">Discovery</span>
                           <span className={compatibility.discoveryScore > 80 ? 'text-emerald-600' : 'text-orange-500'}>{compatibility.discoveryScore}%</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-stone-500 text-xs">Schema Fit</span>
                           <span className={compatibility.schemaScore > 80 ? 'text-emerald-600' : 'text-orange-500'}>{compatibility.schemaScore}%</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-stone-500 text-xs">Mapping</span>
                           <span className={compatibility.mappingScore > 80 ? 'text-emerald-600' : 'text-orange-500'}>{compatibility.mappingScore}%</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-stone-500 text-xs">Data Quality</span>
                           <span className={compatibility.dataQualityScore > 80 ? 'text-emerald-600' : 'text-orange-500'}>{compatibility.dataQualityScore}%</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 shadow-xs mt-4">
                    <h3 className="text-sm font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2 flex items-center gap-2">
                      <Database className="w-4 h-4 text-stone-500" /> Tally Environment Details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div className="flex justify-between"><span className="text-stone-500">Tally Version</span><span className="font-mono text-stone-800">{snapshot.tallyVersion}</span></div>
                      <div className="flex justify-between"><span className="text-stone-500">Financial Year</span><span className="font-mono text-stone-800">{snapshot.financialYear}</span></div>
                      <div className="flex justify-between"><span className="text-stone-500">Discovered Masters</span><span className="font-bold text-indigo-600">{snapshot.masters.length} Categories</span></div>
                      <div className="flex justify-between"><span className="text-stone-500">Discovered Vouchers</span><span className="font-bold text-indigo-600">{snapshot.vouchers.length} Types</span></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'discovery' && snapshot && (
                <motion.div key="discovery" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Discovery Snapshot</h2>
                    <p className="text-sm text-stone-500 mt-1">Dynamically identified collections and fields without assuming global presence.</p>
                  </div>

                  {snapshot.warnings.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-bold block mb-1">Discovery Warnings</span>
                        <ul className="list-disc pl-4 space-y-1">
                          {snapshot.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {snapshot.collections.map((col, idx) => (
                      <div key={idx} className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-xs">
                        <div className="px-5 py-4 border-b border-[#EAE6DF] flex justify-between items-center bg-stone-50">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-stone-900">{col.name}</h3>
                            <span className="text-xs text-stone-500">{col.purpose}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border tracking-wider ${getStatusColor(col.status)}`}>
                            {col.status}
                          </span>
                        </div>
                        {col.fields.length > 0 ? (
                          <div className="p-4 bg-white">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-stone-500 text-xs font-semibold border-b border-stone-100">
                                  <th className="pb-2">Field Name</th>
                                  <th className="pb-2">Type</th>
                                  <th className="pb-2 text-right">Availability</th>
                                </tr>
                              </thead>
                              <tbody>
                                {col.fields.map((f, i) => (
                                  <tr key={i} className="border-b border-stone-50 last:border-0">
                                    <td className="py-2 font-mono text-stone-700">{f.fieldName}</td>
                                    <td className="py-2 text-stone-600">{f.type}</td>
                                    <td className="py-2 text-right">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(f.availability)}`}>
                                        {f.availability}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-sm text-stone-500 italic text-center">No fields discovered or collection unavailable.</div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'mapping' && (
                <motion.div key="mapping" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Semantic Mapping Engine</h2>
                    <p className="text-sm text-stone-500 mt-1">Transforms raw Tally fields into universal analytical concepts based on confidence scores.</p>
                  </div>
                  
                  <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 border-b border-stone-200">
                        <tr className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-4 py-3">Source Field</th>
                          <th className="px-4 py-3">Target Concept</th>
                          <th className="px-4 py-3">Confidence</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Sample</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {mappings.map(m => (
                          <tr key={m.mappingId} className="hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-stone-700">{m.sourceCollection}.{m.sourceField}</td>
                            <td className="px-4 py-3 font-semibold text-indigo-700">{m.targetConcept}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-stone-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${m.confidence > 0.8 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{width: `${m.confidence * 100}%`}}></div>
                                </div>
                                <span className="text-xs font-bold text-stone-600">{Math.round(m.confidence * 100)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${getStatusColor(m.status)}`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-stone-500 italic max-w-[150px] truncate">
                              "{m.sampleValues[0]}"
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'catalog' && (
                <motion.div key="catalog" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Output Catalog</h2>
                    <p className="text-sm text-stone-500 mt-1">Honest availability of reports based strictly on discovered dependencies.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outputs.map(out => (
                      <div key={out.outputId} className={`border rounded-xl p-5 shadow-xs flex flex-col gap-3 ${out.status === 'UNAVAILABLE' ? 'bg-stone-50 border-stone-200 opacity-75' : 'bg-white border-[#EAE6DF]'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">{out.category}</span>
                            <h3 className="font-bold text-stone-900">{out.name}</h3>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border tracking-wider ${getStatusColor(out.status)}`}>
                            {out.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">{out.reason}</p>
                        
                        <div className="mt-2 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                          <span className="text-stone-500 flex items-center gap-1"><Activity className="w-3 h-3"/> {out.sourceType}</span>
                          {out.status === 'AVAILABLE' && (
                            <button className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                              Preview <Play className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'tests' && (
                <motion.div key="tests" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 max-w-4xl">
                   <div className="flex justify-between items-center bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#111111]">Discovery Pipeline Validation</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Verifies that the application honors the "Original Promise": Safely discovering structure, refusing blind mapping, and downgrading output availability when Tally modules are missing.
                        </p>
                      </div>
                    </div>
                    <button onClick={executeTests} disabled={testsRunning} className={`px-4 py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${testsRunning ? 'bg-stone-100 text-stone-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                      {testsRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {testsRunning ? 'Running...' : 'Run Pipeline Tests'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {testResults.map((res, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex flex-col gap-2 ${res.passed ? 'bg-[#F0FDF4] border-[#BBF7D0]' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {res.passed ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                            <h3 className={`font-semibold text-sm ${res.passed ? 'text-emerald-900' : 'text-red-900'}`}>{res.testName}</h3>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${res.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{res.durationMs}ms</span>
                        </div>
                        <p className={`text-xs ml-7 ${res.passed ? 'text-emerald-700' : 'text-red-700'}`}>{res.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
