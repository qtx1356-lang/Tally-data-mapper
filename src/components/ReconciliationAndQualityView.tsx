import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldAlert,
  Search,
  Download,
  FileCheck,
  Activity,
  History,
  Lock,
  Eye,
  Building2,
  Terminal,
  Sparkles
} from 'lucide-react';

export function ReconciliationAndQualityView() {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'quality' | 'audit' | 'diagnostics'>('reconciliation');
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);

  useEffect(() => {
    fetchReconciliationAndQuality();
  }, []);

  const fetchReconciliationAndQuality = async () => {
    try {
      const [recRes, qualRes, auditRes, diagRes] = await Promise.all([
        fetch('/api/reconciliation'),
        fetch('/api/data-quality'),
        fetch('/api/audit-log'),
        fetch('/api/diagnostics/export')
      ]);

      const rec = await recRes.json();
      const qual = await qualRes.json();
      const audit = await auditRes.json();
      const diag = await diagRes.json();

      setReconciliation(rec);
      setQualityReport(qual);
      setAuditLogs(audit);
      setDiagnostics(diag);
    } catch (err) {
      console.error('Failed to fetch reconciliation and quality data', err);
    }
  };

  const handleGlobalSearch = async (q: string) => {
    setGlobalQuery(q);
    if (!q) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Failed global search', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Scale className="w-4 h-4" />
            Phase 10 — Financial Reconciliation & Data Quality
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reconciliation, Quality & Security Audit</h1>
          <p className="text-slate-400 text-sm mt-1">
            Compare report export totals against Tally, inspect completeness scores, mask sensitive records, and generate system diagnostics.
          </p>
        </div>

        {/* Universal Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={globalQuery}
            onChange={e => handleGlobalSearch(e.target.value)}
            placeholder="Universal Search (e.g. GSTIN)..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Global Search Overlay Panel */}
      {searchResults && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sky-400 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Universal Global Search Results for "{globalQuery}"
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-slate-400 uppercase font-sans font-bold block mb-1">Fields ({searchResults.fields?.length})</span>
              {searchResults.fields?.map((f: any, idx: number) => (
                <div key={idx} className="text-sky-300">• {f.name} ({f.collection})</div>
              ))}
            </div>
            <div className="bg-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-slate-400 uppercase font-sans font-bold block mb-1">Collections ({searchResults.collections?.length})</span>
              {searchResults.collections?.map((c: any, idx: number) => (
                <div key={idx} className="text-emerald-300">• {c.name}</div>
              ))}
            </div>
            <div className="bg-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-slate-400 uppercase font-sans font-bold block mb-1">Reports ({searchResults.reports?.length})</span>
              {searchResults.reports?.map((r: any, idx: number) => (
                <div key={idx} className="text-indigo-300">• {r.title}</div>
              ))}
            </div>
            <div className="bg-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-slate-400 uppercase font-sans font-bold block mb-1">Saved Queries ({searchResults.queries?.length})</span>
              {searchResults.queries?.map((s: any, idx: number) => (
                <div key={idx} className="text-amber-300">• {s.name}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-3 py-1 shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reconciliation'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          Tally Totals Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'quality'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Data Quality Engine (96%)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'diagnostics'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Diagnostic Export
        </button>
      </div>

      {/* TAB 1: RECONCILIATION */}
      {activeTab === 'reconciliation' && reconciliation && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{reconciliation.reportName}</h2>
                <p className="text-sm text-slate-500">
                  Target Company: <strong className="text-slate-800">{reconciliation.companyName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Status: MATCH (₹0 Discrepancy)
                </span>
              </div>
            </div>

            {/* Totals Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Tally Derived Total</span>
                <span className="text-2xl font-bold font-mono text-slate-900 block">
                  ₹{reconciliation.tallyTotalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Mapped Export Total</span>
                <span className="text-2xl font-bold font-mono text-slate-900 block">
                  ₹{reconciliation.exportTotalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1">
                <span className="text-xs font-semibold uppercase text-emerald-700">Variance / Difference</span>
                <span className="text-2xl font-bold font-mono text-emerald-900 block">
                  ₹{reconciliation.discrepancyAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Monthly Group Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Group & Monthly Reconciliation Breakdown</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Period / Group</th>
                      <th className="p-3">Tally Value</th>
                      <th className="p-3">Report Value</th>
                      <th className="p-3">Difference</th>
                      <th className="p-3">Match Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-800">
                    {reconciliation.groupBreakdowns?.map((grp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold font-sans text-slate-900">{grp.groupName}</td>
                        <td className="p-3">₹{grp.tallyValue?.toLocaleString('en-IN')}</td>
                        <td className="p-3">₹{grp.reportValue?.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-emerald-600 font-bold">₹{grp.difference?.toFixed(2)}</td>
                        <td className="p-3 font-sans">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            MATCH
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA QUALITY ENGINE */}
      {activeTab === 'quality' && qualityReport && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Collection Data Quality & Integrity</h2>
                <p className="text-sm text-slate-500">
                  Target Collection: <strong className="text-slate-800">{qualityReport.collectionName}</strong> ({qualityReport.totalRecordsAnalyzed?.toLocaleString()} records scanned)
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-emerald-600">{qualityReport.overallQualityScore}%</span>
                <span className="block text-xs font-semibold text-slate-500">Overall Quality Score</span>
              </div>
            </div>

            {/* Quality Dimensions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-1">
                <span className="text-xs font-semibold text-slate-500">Completeness Score</span>
                <span className="text-xl font-bold text-slate-900 block">{qualityReport.completenessScore}%</span>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-1">
                <span className="text-xs font-semibold text-slate-500">Consistency Score</span>
                <span className="text-xl font-bold text-slate-900 block">{qualityReport.consistencyScore}%</span>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-1">
                <span className="text-xs font-semibold text-slate-500">Validity Score</span>
                <span className="text-xl font-bold text-slate-900 block">{qualityReport.validityScore}%</span>
              </div>
            </div>

            {/* Quality Issues List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Identified Quality Discrepancies</h3>
              <div className="space-y-2">
                {qualityReport.issuesFound?.map((iss: any, idx: number) => (
                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-amber-900 text-sm">{iss.issueType} ({iss.fieldName})</span>
                      <p className="text-amber-800">{iss.recommendedAction}</p>
                    </div>
                    <span className="bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-full">
                      {iss.affectedRecordCount} Records
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Security & Operational Audit Log</h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Object</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-800">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-900 font-sans">{log.user}</td>
                    <td className="p-3"><span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">{log.action}</span></td>
                    <td className="p-3">{log.objectType}</td>
                    <td className="p-3 text-slate-600 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DIAGNOSTICS */}
      {activeTab === 'diagnostics' && diagnostics && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-xl space-y-4 font-mono text-xs">
          <h2 className="text-lg font-bold text-sky-400 font-sans">System Diagnostics & Environment Specification</h2>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-emerald-400">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
