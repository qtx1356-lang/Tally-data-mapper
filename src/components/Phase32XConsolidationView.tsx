import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  FolderTree,
  FileBarChart,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Globe,
  Settings,
  Filter,
  Download,
  Eye,
  ShieldCheck,
  Calculator,
  Calendar,
  DollarSign,
  TrendingUp,
  Layers,
  Link2
} from 'lucide-react';

import {
  RegisteredCompany,
  CompanyGroup,
  GroupKpi,
  ConsolidatedReportLine,
  EliminationEntry
} from '../types/phase32XConsolidation';
import { runPhase32XTests, TestResult } from '../tests/phase32XConsolidationTests';

export default function Phase32XConsolidationView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'eliminations' | 'reports' | 'tests'>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  const [companies, setCompanies] = useState<RegisteredCompany[]>([]);
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [kpis, setKpis] = useState<GroupKpi[]>([]);
  const [eliminations, setEliminations] = useState<EliminationEntry[]>([]);
  const [reportLines, setReportLines] = useState<ConsolidatedReportLine[]>([]);

  // Test Runner State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState<boolean>(false);

  useEffect(() => {
    fetchConsolidationData();
  }, []);

  const fetchConsolidationData = async () => {
    setLoading(true);
    try {
      const [compsRes, groupsRes, kpisRes, elimsRes, linesRes] = await Promise.all([
        fetch('/api/phase32x/companies'),
        fetch('/api/phase32x/groups'),
        fetch('/api/phase32x/dashboard/kpis'),
        fetch('/api/phase32x/eliminations'),
        fetch('/api/phase32x/reports/trial-balance')
      ]);

      setCompanies(await compsRes.json());
      setGroups(await groupsRes.json());
      setKpis(await kpisRes.json());
      setEliminations(await elimsRes.json());
      setReportLines(await linesRes.json());
    } catch (err) {
      console.error('Failed to fetch consolidation data', err);
    } finally {
      setLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      const results = runPhase32XTests();
      setTestResults(results);
      setTestsRunning(false);
    }, 800);
  };

  const getCompanyStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MAPPING_REQUIRED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      {/* HEADER */}
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 32X: Consolidation & Group Reports</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">Multi-Company Manager</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Engine Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <div className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-md flex items-center gap-2 mr-4">
              <span className="text-xs font-semibold text-stone-600">Active Group:</span>
              <span className="text-xs font-bold text-stone-900">{groups[0].name}</span>
            </div>
          )}
          <button 
            onClick={fetchConsolidationData}
            className="p-2 text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-md transition-colors"
            title="Refresh State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-[#EAE6DF] flex flex-col p-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Consolidation Engine</div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4.5 h-4.5" />
                <span>Group Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'companies' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4.5 h-4.5" />
                <span>Company Registry</span>
              </div>
              <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {companies.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('eliminations')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'eliminations' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-4.5 h-4.5" />
                <span>Eliminations</span>
              </div>
              {eliminations.filter(e => e.status === 'PROPOSED').length > 0 && (
                <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {eliminations.filter(e => e.status === 'PROPOSED').length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'reports' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <FileBarChart className="w-4.5 h-4.5" />
              <span>Group Reports</span>
            </button>
            
            <div className="mt-4 mb-2 border-t border-[#EAE6DF]"></div>
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              <span>Diagnostics & Tests</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="w-8 h-8 text-stone-300 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* 1. DASHBOARD */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Group Dashboard</h2>
                      <p className="text-sm text-stone-500 mt-1">Consolidated KPIs with active source traceability.</p>
                    </div>
                  </div>

                  {kpis.some(kpi => kpi.companiesExcluded > 0) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-orange-900">Incomplete Group Data</h4>
                        <p className="text-xs text-orange-700 mt-1">
                          Some metrics exclude one or more companies due to incomplete semantic mapping or missing exchange rates. Drill down for details.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    {kpis.map(kpi => (
                      <div key={kpi.id} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-bold text-stone-600">{kpi.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            kpi.dataStatus === 'COMPLETE' ? 'bg-emerald-100 text-emerald-700' : 
                            kpi.dataStatus === 'INCOMPLETE' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {kpi.dataStatus}
                          </span>
                        </div>
                        
                        <div className="text-3xl font-bold text-[#111111]">
                          {kpi.value !== null ? formatCurrency(kpi.value, kpi.currency) : 'N/A'}
                        </div>
                        
                        <div className="text-xs text-stone-500 flex items-center justify-between border-t border-stone-100 pt-3 mt-1">
                          <span className="font-semibold">{kpi.companiesIncluded} of {kpi.companiesIncluded + kpi.companiesExcluded} Companies Included</span>
                          <button className="text-indigo-600 font-medium hover:underline">View Lineage</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 mt-4">Cross-Company Trends (Read-Only)</h3>
                  <div className="bg-white border border-[#EAE6DF] rounded-xl p-8 shadow-xs flex flex-col items-center justify-center text-stone-500">
                    <FileBarChart className="w-12 h-12 text-stone-200 mb-3" />
                    <p className="text-sm font-medium">Chart visualization engine connected.</p>
                    <p className="text-xs mt-1 text-stone-400">Select specific accounts to compare trends across the group.</p>
                  </div>
                </motion.div>
              )}

              {/* 2. COMPANY REGISTRY */}
              {activeTab === 'companies' && (
                <motion.div
                  key="companies"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Company Registry</h2>
                      <p className="text-sm text-stone-500 mt-1">Manage connected Tally companies, mapping statuses, and base currencies.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-xs overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 border-b border-[#EAE6DF] text-stone-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Company Name</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Status</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Currency & Fiscal</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Versions</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {companies.map(comp => (
                          <tr key={comp.companyId} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-stone-900">{comp.companyName}</div>
                              <div className="font-mono text-[10px] text-stone-400 mt-1">{comp.companyId} • {comp.connection}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider border ${getCompanyStatusColor(comp.status)}`}>
                                {comp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-stone-800 font-semibold">{comp.baseCurrency}</div>
                              <div className="text-[10px] text-stone-500 mt-0.5">FY Start: {comp.fiscalYearStart}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-stone-600 flex flex-col gap-0.5">
                                <span>Map: <span className="font-semibold">{comp.mappingVersion}</span></span>
                                <span>Schema: <span className="font-semibold">{comp.schemaVersion}</span></span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button className="text-indigo-600 text-xs font-semibold hover:underline">
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* 3. ELIMINATIONS */}
              {activeTab === 'eliminations' && (
                <motion.div
                  key="eliminations"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Inter-Company Eliminations</h2>
                      <p className="text-sm text-stone-500 mt-1">Review and approve proposed elimination entries based on matching rules.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {eliminations.map(elim => (
                      <div key={elim.eliminationId} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
                              <ArrowRightLeft className="w-4 h-4" />
                            </span>
                            <div>
                              <h3 className="font-bold text-stone-900 text-sm">{elim.type}</h3>
                              <div className="text-xs text-stone-500 mt-0.5 font-mono">
                                {elim.eliminationId} • Rule: {elim.ruleId}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                            elim.status === 'PROPOSED' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {elim.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-6 items-center bg-stone-50 p-4 rounded-lg border border-stone-100">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Source</span>
                            <span className="font-semibold text-stone-800 text-sm">{companies.find(c => c.companyId === elim.sourceCompanyId)?.companyName || elim.sourceCompanyId}</span>
                            <span className="font-mono text-xs text-indigo-600">{elim.sourceTransaction}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Eliminated Amount</span>
                            <span className="font-bold text-lg text-stone-900">{formatCurrency(elim.eliminatedAmount, 'USD')}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              elim.matchConfidence === 'HIGH' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {elim.matchConfidence} MATCH
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 items-end text-right">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Target</span>
                            <span className="font-semibold text-stone-800 text-sm">{companies.find(c => c.companyId === elim.targetCompanyId)?.companyName || elim.targetCompanyId}</span>
                            <span className="font-mono text-xs text-indigo-600">{elim.targetTransaction}</span>
                          </div>
                        </div>

                        {elim.status === 'PROPOSED' && (
                          <div className="flex justify-end gap-3 mt-2">
                            <button className="px-4 py-2 bg-white hover:bg-stone-50 text-red-600 text-sm font-semibold border border-stone-200 rounded-md transition-colors flex items-center gap-2">
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 4. REPORTS */}
              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Consolidated Reports</h2>
                      <p className="text-sm text-stone-500 mt-1">View trial balances, P&L, and balance sheets mapped to the unified group semantic layer.</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-md flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filters
                      </button>
                      <button className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-xs overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
                      <h3 className="font-bold text-stone-800 text-sm">Group Trial Balance (Extract)</h3>
                      <span className="text-xs text-stone-500 font-medium">Reporting Currency: USD</span>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white border-b border-[#EAE6DF] text-stone-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Group Account</th>
                          <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Source Company</th>
                          <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase text-right">Raw (Local)</th>
                          <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase text-right">Adjusted (Group)</th>
                          <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {reportLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="px-5 py-3 font-bold text-stone-800">{line.groupAccount}</td>
                            <td className="px-5 py-3">
                              <div className="text-stone-700 font-medium">{line.companyName}</div>
                              <div className="text-[10px] text-stone-400 font-mono mt-0.5">{line.companyId}</div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="text-stone-700">{formatCurrency(line.credit, line.originalCurrency)}</div>
                              <div className="text-[10px] text-stone-400 mt-0.5">Rate: {line.exchangeRate}</div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="font-bold text-[#111111]">{formatCurrency(line.adjustedCredit, 'USD')}</div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {line.isEliminated ? (
                                <span className="inline-flex items-center justify-center bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200">
                                  ELIMINATED (-150k)
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                                  CONSOLIDATED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TESTS TAB */}
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
                        <h2 className="text-lg font-semibold text-[#111111]">Phase 32X Consolidation Isolation Diagnostics</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Run automated tests to verify cross-company read-only constraints, missing exchange rate exclusions, and elimination rule boundaries.
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
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Execute Tests</span>
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
                              <XCircle className="w-5 h-5 text-red-600" />
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
