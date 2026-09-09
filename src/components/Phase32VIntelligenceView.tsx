import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  FileSearch,
  Scale,
  BrainCircuit,
  Search,
  RefreshCw,
  Info,
  Filter,
  Sliders,
  ChevronDown,
  X,
  PlayCircle
} from 'lucide-react';

import { 
  BusinessRule, 
  ExceptionRecord, 
  ReconciliationResult, 
  DataQualityScore, 
  IntelligenceSummary 
} from '../types/phase32VIntelligence';
import { runPhase32VTests, TestResult } from '../tests/phase32VIntelligenceTests';

export default function Phase32VIntelligenceView() {
  const [activeTab, setActiveTab] = useState<'exceptions' | 'rules' | 'reconciliation' | 'quality' | 'tests'>('exceptions');
  const [companyId] = useState<string>('comp_exfin_corp_id');
  const [loading, setLoading] = useState<boolean>(true);
  
  const [summary, setSummary] = useState<IntelligenceSummary | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationResult[]>([]);
  const [qualityScore, setQualityScore] = useState<DataQualityScore | null>(null);

  // Test Runner State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState<boolean>(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);

  useEffect(() => {
    fetchIntelligenceData();
  }, [companyId]);

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      const [sumRes, excRes, rulRes, recRes, qlRes] = await Promise.all([
        fetch('/api/v1/intelligence/summary'),
        fetch('/api/v1/intelligence/exceptions'),
        fetch('/api/v1/intelligence/rules'),
        fetch('/api/v1/intelligence/reconciliation'),
        fetch('/api/v1/intelligence/quality')
      ]);

      setSummary(await sumRes.json());
      setExceptions(await excRes.json());
      setRules(await rulRes.json());
      setReconciliations(await recRes.json());
      setQualityScore(await qlRes.json());
    } catch (err) {
      console.error('Failed to fetch intelligence data', err);
    } finally {
      setLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      const results = runPhase32VTests();
      setTestResults(results);
      setTestsRunning(false);
    }, 800);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PASS': return 'text-emerald-600 bg-emerald-50';
      case 'WARNING': return 'text-orange-600 bg-orange-50';
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      default: return 'text-stone-600 bg-stone-50';
    }
  };

  const filteredExceptions = exceptions.filter(exc => 
    exc.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      {/* HEADER */}
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 32V: Explainable Intelligence Engine</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">EXFIN Corp</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Analysis Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchIntelligenceData}
            className="p-2 text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-md transition-colors"
            title="Refresh Intelligence Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-[#EAE6DF] flex flex-col p-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Intelligence Modules</div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'exceptions' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4.5 h-4.5" />
                <span>Exception Center</span>
              </div>
              {summary && summary.criticalItems > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {summary.criticalItems}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'rules' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <FileSearch className="w-4.5 h-4.5" />
              <span>Business Rules</span>
            </button>
            
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'reconciliation' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Scale className="w-4.5 h-4.5" />
                <span>Reconciliation</span>
              </div>
              {summary && summary.reconciliationDifferences > 0 && (
                <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {summary.reconciliationDifferences}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'quality' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <Activity className="w-4.5 h-4.5" />
              <span>Data Quality</span>
            </button>
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
              <span>Diagnostics & Tests</span>
            </button>
          </div>
          
          {summary && (
            <div className="mt-8 p-4 bg-stone-50 border border-stone-200 rounded-xl">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Analysis Summary</div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-stone-600">Total Checks:</span>
                <span className="text-xs font-mono font-semibold">{summary.totalChecks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-stone-600">Passed:</span>
                <span className="text-xs font-mono font-semibold text-emerald-600">{summary.passed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-600">Warnings:</span>
                <span className="text-xs font-mono font-semibold text-orange-600">{summary.warnings.toLocaleString()}</span>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="w-8 h-8 text-stone-300 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* 1. EXCEPTION CENTER */}
              {activeTab === 'exceptions' && (
                <motion.div
                  key="exceptions"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Exception Center</h2>
                      <p className="text-sm text-stone-500 mt-1">Review flagged anomalies, violations, and operational exceptions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input 
                          type="text" 
                          placeholder="Search exceptions..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-[#EAE6DF] rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                        />
                      </div>
                      <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#EAE6DF] rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 shadow-xs">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-xs overflow-hidden flex-1 flex flex-col">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 border-b border-[#EAE6DF] text-stone-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Severity</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Category</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Description</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Status</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Evidence</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredExceptions.map(exc => (
                          <tr key={exc.exceptionId} className="hover:bg-[#FAF9F6] transition-colors group">
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold border uppercase tracking-wider ${getSeverityColor(exc.severity)}`}>
                                {exc.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
                                {exc.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-stone-800">
                              {exc.description}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-1 rounded-md">
                                {exc.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => setSelectedException(exc)}
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold underline underline-offset-2 flex items-center gap-1"
                              >
                                <Search className="w-3.5 h-3.5" />
                                Inspect
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-stone-400 hover:text-stone-700 transition-colors">
                                <ChevronDown className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredExceptions.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                              No exceptions match your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* 2. BUSINESS RULES */}
              {activeTab === 'rules' && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Business Rule Engine</h2>
                      <p className="text-sm text-stone-500 mt-1">Declarative business rules for anomaly detection and quality assurance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {rules.map(rule => (
                      <div key={rule.ruleId} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                              {rule.name}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                {rule.enabled ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </h3>
                            <p className="text-sm text-stone-600 mt-1">{rule.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 font-mono">v{rule.version}</span>
                            <button className="p-1.5 text-stone-400 hover:text-indigo-600 bg-stone-50 hover:bg-indigo-50 rounded-md transition-colors" title="Simulate Rule">
                              <PlayCircle className="w-4.5 h-4.5" />
                            </button>
                            <button className="p-1.5 text-stone-400 hover:text-indigo-600 bg-stone-50 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Rule">
                              <Sliders className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-[#FAF9F6] border border-[#EAE6DF] rounded-lg p-3 mt-2">
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Declarative Condition</div>
                          <code className="text-sm font-mono text-indigo-700 font-semibold">{rule.condition}</code>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-xs text-stone-500">
                          <span className="flex items-center gap-1"><span className="font-semibold text-stone-700">Category:</span> {rule.category}</span>
                          <span className="flex items-center gap-1"><span className="font-semibold text-stone-700">Scope:</span> {rule.scope}</span>
                          <span className="flex items-center gap-1"><span className="font-semibold text-stone-700">Severity:</span> <span className={`${getSeverityColor(rule.severity).replace('bg-', 'text-').split(' ')[1]} font-bold`}>{rule.severity}</span></span>
                          <span className="flex items-center gap-1"><span className="font-semibold text-stone-700">Required Concepts:</span> {rule.requiredConcepts.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 3. RECONCILIATION */}
              {activeTab === 'reconciliation' && (
                <motion.div
                  key="reconciliation"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Reconciliation Engine</h2>
                      <p className="text-sm text-stone-500 mt-1">Cross-validation of accounting balances, stock movements, and ledger groups.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {reconciliations.map(recon => (
                      <div key={recon.reconId} className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-xs">
                        <div className={`px-5 py-3 border-b flex justify-between items-center ${getStatusColor(recon.status)}`}>
                          <div className="flex items-center gap-2">
                            {recon.status === 'PASS' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <h3 className="font-bold text-sm">{recon.type}</h3>
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider">{recon.status}</span>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                          <p className="text-sm text-stone-700">{recon.explanation}</p>
                          
                          <div className="grid grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-lg border border-[#EAE6DF]">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Expected</span>
                              <span className="text-lg font-mono font-semibold text-stone-800">{recon.expected.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Actual</span>
                              <span className="text-lg font-mono font-semibold text-stone-800">{recon.actual.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Difference</span>
                              <span className={`text-lg font-mono font-semibold ${recon.difference !== 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                {recon.difference !== 0 ? (recon.difference > 0 ? '+' : '') : ''}{recon.difference.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-col justify-center items-end">
                              {recon.difference !== 0 && (
                                <button className="text-xs font-semibold bg-white border border-stone-200 text-stone-700 px-3 py-1.5 rounded hover:bg-stone-50 transition-colors shadow-xs">
                                  Drill Down
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 4. DATA QUALITY */}
              {activeTab === 'quality' && qualityScore && (
                <motion.div
                  key="quality"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Data Quality Score</h2>
                      <p className="text-sm text-stone-500 mt-1">Multi-dimensional measurement of dataset integrity and reliability.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1 bg-white border border-[#EAE6DF] rounded-xl p-8 shadow-xs flex flex-col items-center justify-center text-center">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-stone-100"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-indigo-600"
                            strokeWidth="3"
                            strokeDasharray={`${qualityScore.overall}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold text-[#111111]">{qualityScore.overall}</span>
                          <span className="text-xs text-stone-500 uppercase tracking-widest font-bold mt-1">Score</span>
                        </div>
                      </div>
                      <h3 className="mt-6 text-lg font-bold text-stone-800">Overall Quality</h3>
                      <p className="text-xs text-stone-500 mt-2">Aggregated across all semantic dimensions based on strict mapping validation.</p>
                    </div>

                    <div className="col-span-2 bg-white border border-[#EAE6DF] rounded-xl p-6 shadow-xs grid grid-cols-2 gap-x-8 gap-y-6">
                      {[
                        { label: 'Completeness', val: qualityScore.completeness, desc: 'Percentage of expected fields containing valid data.' },
                        { label: 'Consistency', val: qualityScore.consistency, desc: 'Alignment across distinct systems and intra-record balances.' },
                        { label: 'Validity', val: qualityScore.validity, desc: 'Conformance to schema constraints and semantic formats.' },
                        { label: 'Uniqueness', val: qualityScore.uniqueness, desc: 'Absence of unintended duplicated records.' },
                        { label: 'Timeliness', val: qualityScore.timeliness, desc: 'Availability of period-relevant data.' }
                      ].map(dim => (
                        <div key={dim.label} className="flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-semibold text-stone-800">{dim.label}</span>
                            <span className="text-sm font-mono font-bold text-indigo-700">{dim.val}%</span>
                          </div>
                          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${dim.val}%` }}></div>
                          </div>
                          <p className="text-[10px] text-stone-500 mt-1">{dim.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 5. TESTS TAB */}
              {activeTab === 'tests' && (
                <motion.div
                  key="tests"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#111111]">Phase 32V Intelligence Integrity Testing</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Run automated tests to verify business rules, reconciliation math, and safe anomaly detection boundaries (including null-handling for sparse data).
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={executeTests}
                      disabled={testsRunning}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                        testsRunning
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {testsRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Running Diagnostics...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Execute Phase 32V Tests</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border flex flex-col gap-2 ${
                          result.passed
                            ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.passed ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <X className="w-5 h-5 text-red-600" />
                            )}
                            <h3 className={`font-semibold text-sm ${result.passed ? 'text-emerald-900' : 'text-red-900'}`}>
                              {result.testName}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {result.durationMs}ms
                          </span>
                        </div>
                        <p className={`text-xs ml-7 ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                          {result.message}
                        </p>
                      </div>
                    ))}

                    {testResults.length === 0 && !testsRunning && (
                      <div className="bg-white border border-[#EAE6DF] border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                        <CheckCircle className="w-8 h-8 text-stone-300" />
                        <h3 className="text-sm font-semibold text-stone-700">No Tests Executed</h3>
                        <p className="text-xs text-stone-500">Click "Execute Phase 32V Tests" to run the diagnostics suite.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Exception Evidence Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-[#111111]/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white border border-[#EAE6DF] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className={`px-6 py-4 flex justify-between items-center border-b ${getSeverityColor(selectedException.severity)}`}>
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm">Exception Drill-down: {selectedException.exceptionId}</h3>
              </div>
              <button 
                onClick={() => setSelectedException(null)}
                className="hover:bg-black/10 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-bold text-stone-900 mb-1">{selectedException.description}</h4>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="font-medium bg-stone-100 px-2 py-0.5 rounded">Category: {selectedException.category}</span>
                  <span>Rule ID: <span className="font-mono">{selectedException.ruleId}</span></span>
                  <span>Detected: {new Date(selectedException.firstDetected).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-stone-800">Diagnostic Evidence</h4>
                </div>
                <div className="bg-[#FAF9F6] border border-[#EAE6DF] rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <pre className="text-stone-700">
                    {JSON.stringify(selectedException.evidence, null, 2)}
                  </pre>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 italic">
                  * Note: Only minimum necessary context fields are materialized. Field-level security is enforced.
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-3">Resolution Controls</h4>
                <div className="flex gap-3">
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md text-xs font-semibold shadow-xs transition-colors">
                    Acknowledge & Mark Expected
                  </button>
                  <button className="flex-1 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors">
                    Dismiss (False Positive)
                  </button>
                  <button className="flex-1 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors">
                    Adjust Rule Threshold
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
