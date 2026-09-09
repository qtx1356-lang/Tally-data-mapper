import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Copy,
  FolderTree,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Download,
  Search,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  TrendingUp,
  History,
  Tag
} from 'lucide-react';
import {
  CompanyQualityDashboard,
  DatasetQualitySummary,
  QualityFinding,
  QualitySeverity,
  DuplicateMatch,
  TransformationRule,
  TransformationPreviewResult,
  FieldQualityMetrics
} from '../types/phase32FQuality';

type ActiveTab = 'overview' | 'datasets' | 'findings' | 'duplicates' | 'transformations' | 'trend' | 'tests';

export const Phase32FDataQualityCenterView: React.FC = () => {
  const [companyId, setCompanyId] = useState<string>('CMP-001');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [dashboard, setDashboard] = useState<CompanyQualityDashboard | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('canonical-groups');
  const [selectedDatasetSummary, setSelectedDatasetSummary] = useState<DatasetQualitySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Duplicates state
  const [exactDuplicates, setExactDuplicates] = useState<DuplicateMatch[]>([]);
  const [possibleDuplicates, setPossibleDuplicates] = useState<DuplicateMatch[]>([]);

  // Transformations state
  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([]);
  const [previewResult, setPreviewResult] = useState<TransformationPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [isApplyingTransformations, setIsApplyingTransformations] = useState<boolean>(false);

  // Exception modal
  const [selectedFindingForException, setSelectedFindingForException] = useState<QualityFinding | null>(null);
  const [exceptionAction, setExceptionAction] = useState<'Reviewed' | 'Accepted' | 'Ignored'>('Accepted');
  const [exceptionReason, setExceptionReason] = useState<string>('Audited business exception approved by controller');

  // Test Suite Runner
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Fetch Dashboard on company change or initial mount
  useEffect(() => {
    fetchDashboard();
    fetchDuplicates();
    fetchTransformationRules();
  }, [companyId]);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDatasetSummary(selectedDatasetId);
    }
  }, [selectedDatasetId, companyId]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quality/dashboard?companyId=${companyId}`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.dashboard);
      } else {
        showNotification('error', data.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatasetSummary = async (dsId: string) => {
    try {
      const res = await fetch(`/api/quality/dataset?datasetId=${dsId}&companyId=${companyId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDatasetSummary(data.summary);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchDuplicates = async () => {
    try {
      const res = await fetch(`/api/quality/duplicates?companyId=${companyId}&datasetId=${selectedDatasetId}`);
      const data = await res.json();
      if (data.success) {
        setExactDuplicates(data.exact || []);
        setPossibleDuplicates(data.possible || []);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchTransformationRules = async () => {
    try {
      const res = await fetch('/api/quality/transformations/rules');
      const data = await res.json();
      if (data.success) {
        setTransformationRules(data.rules || []);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReviewDuplicate = async (matchId: string, status: 'ConfirmedDuplicate' | 'Dismissed') => {
    try {
      const res = await fetch('/api/quality/duplicates/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status, user: 'LeadAuditor' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        fetchDuplicates();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleApproveRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/quality/transformations/rules/${ruleId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'LeadController' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Transformation rule '${data.rule.name}' approved and activated.`);
        fetchTransformationRules();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handlePreviewTransformation = async (ruleId: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/quality/transformations/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, companyId, sampleSize: 20 })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewResult(data.preview);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyTransformations = async (dsId: string) => {
    setIsApplyingTransformations(true);
    try {
      const res = await fetch('/api/quality/transformations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dsId, companyId })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          'success',
          `Applied transformations: ${data.result.transformationsApplied} field updates across ${data.result.recordsProcessed} records.`
        );
        fetchDashboard();
        fetchDatasetSummary(dsId);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsApplyingTransformations(false);
    }
  };

  const handleSaveException = async () => {
    if (!selectedFindingForException) return;
    try {
      const res = await fetch('/api/quality/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId: selectedFindingForException.findingId,
          action: exceptionAction,
          reason: exceptionReason,
          user: 'SeniorAuditor'
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Quality finding accepted with audit note.`);
        setSelectedFindingForException(null);
        fetchDashboard();
        if (selectedDatasetId) fetchDatasetSummary(selectedDatasetId);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/quality/run-phase32f-tests', { method: 'POST' });
      const report = await res.json();
      setTestResults(report);
      setActiveTab('tests');
      showNotification('success', `Executed ${report.total} tests: ${report.passed} passed, ${report.failed} failed in ${report.durationMs}ms.`);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  const allFindings = dashboard?.recentFindings || [];
  const filteredFindings = allFindings.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (searchFilter) {
      const term = searchFilter.toLowerCase();
      return (
        f.message.toLowerCase().includes(term) ||
        f.datasetId.toLowerCase().includes(term) ||
        f.recordId.toLowerCase().includes(term) ||
        (f.field && f.field.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner & Company Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Data Quality & Controlled Transformation Center
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  Phase 32F
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Technical completeness, anomaly detection, duplicates, and non-destructive transformations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">Company:</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="CMP-001" className="bg-slate-900">CMP-001 (Main Enterprise)</option>
              <option value="CMP-002" className="bg-slate-900">CMP-002 (Branch Office)</option>
              <option value="CMP-QTEST-REQ" className="bg-slate-900">CMP-QTEST-REQ (Validation Test)</option>
            </select>
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Re-evaluate</span>
          </button>

          <a
            href={`/api/quality/export?companyId=${companyId}&format=csv`}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Findings</span>
          </a>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'Running Suite...' : 'Run Phase 32F Tests'}</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
              : 'bg-blue-950/80 border-blue-800 text-blue-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Overall Score & Metric KPIs */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Quality Score */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Quality Score</span>
            <div className="flex items-baseline space-x-2 my-1">
              <span
                className={`text-2xl font-black ${
                  dashboard.overallScore >= 85
                    ? 'text-emerald-400'
                    : dashboard.overallScore >= 65
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {dashboard.overallScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500 italic">Technical completeness</span>
          </div>

          {/* Status */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Health Status</span>
            <div className="my-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                  dashboard.status === 'Healthy'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : dashboard.status === 'Warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {dashboard.status === 'Healthy' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {dashboard.status === 'Warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                {dashboard.status === 'Error' && <XCircle className="w-3.5 h-3.5" />}
                {dashboard.status}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">{dashboard.totalRecordsAnalyzed} records scanned</span>
          </div>

          {/* Errors */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Errors & Blockers</span>
            <div className="text-2xl font-bold text-rose-400 my-1">{dashboard.totalErrors}</div>
            <span className="text-[10px] text-rose-400/80">Requires remediation</span>
          </div>

          {/* Warnings */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Warnings</span>
            <div className="text-2xl font-bold text-amber-400 my-1">{dashboard.totalWarnings}</div>
            <span className="text-[10px] text-amber-400/80">Non-blocking anomalies</span>
          </div>

          {/* Duplicates */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Duplicates</span>
            <div className="text-2xl font-bold text-blue-400 my-1">{dashboard.totalDuplicates}</div>
            <span className="text-[10px] text-blue-400/80">Exact & probabilistic</span>
          </div>

          {/* Orphans & Cycles */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Hierarchy Issues</span>
            <div className="text-2xl font-bold text-purple-400 my-1">
              {dashboard.totalOrphans + dashboard.totalCycles}
            </div>
            <span className="text-[10px] text-purple-400/80">
              {dashboard.totalOrphans} orphans, {dashboard.totalCycles} cycles
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-1 text-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'Quality Overview', icon: ShieldCheck },
          { id: 'datasets', label: 'Dataset & Field Drilldown', icon: FolderTree },
          { id: 'findings', label: `Quality Findings (${allFindings.length})`, icon: AlertCircle },
          { id: 'duplicates', label: `Duplicate Review (${exactDuplicates.length + possibleDuplicates.length})`, icon: Copy },
          { id: 'transformations', label: `Controlled Transformations (${transformationRules.length})`, icon: Sliders },
          { id: 'trend', label: 'Quality Trends & Audit', icon: TrendingUp },
          { id: 'tests', label: 'Test Suite Runner', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t-lg font-medium whitespace-nowrap transition ${
                active
                  ? 'bg-slate-800 text-blue-400 border-t-2 border-blue-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Remediation Suggestions */}
          {dashboard.remediationSuggestions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Actionable Remediation Suggestions</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboard.remediationSuggestions.map((sug) => (
                  <div key={sug.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {sug.type}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-400">{sug.affectedCount} items</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{sug.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{sug.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (sug.type.includes('Duplicate')) setActiveTab('duplicates');
                        else if (sug.type.includes('Transformation')) setActiveTab('transformations');
                        else setActiveTab('findings');
                      }}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                    >
                      {sug.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datasets Matrix */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dataset Quality Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.datasetSummaries.map((ds) => (
                <div
                  key={ds.datasetId}
                  onClick={() => {
                    setSelectedDatasetId(ds.datasetId);
                    setActiveTab('datasets');
                  }}
                  className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-xl cursor-pointer transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{ds.datasetName}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded ${
                          ds.qualityScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ds.qualityScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] text-center">
                      <div className="bg-slate-950 p-1.5 rounded">
                        <span className="text-slate-400 block">Total</span>
                        <span className="font-bold text-slate-200">{ds.totalRecords}</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded">
                        <span className="text-emerald-400 block">Valid</span>
                        <span className="font-bold text-emerald-300">{ds.validRecords}</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded">
                        <span className="text-rose-400 block">Errors</span>
                        <span className="font-bold text-rose-300">{ds.errorRecords}</span>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded">
                        <span className="text-blue-400 block">Dups</span>
                        <span className="font-bold text-blue-300">{ds.duplicateRecords}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>{Object.keys(ds.fieldMetrics).length} Fields</span>
                    <span className="text-blue-400 font-semibold flex items-center gap-1">
                      Inspect Details <Eye className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATASET & FIELD DRILLDOWN */}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400">Select Dataset:</span>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-lg font-semibold focus:outline-none"
              >
                {dashboard?.datasetSummaries.map((ds) => (
                  <option key={ds.datasetId} value={ds.datasetId}>
                    {ds.datasetName} ({ds.totalRecords} records, {ds.qualityScore}%)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleApplyTransformations(selectedDatasetId)}
              disabled={isApplyingTransformations}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isApplyingTransformations ? 'animate-spin' : ''}`} />
              <span>{isApplyingTransformations ? 'Applying...' : 'Apply Active Transformations'}</span>
            </button>
          </div>

          {selectedDatasetSummary && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Field-Level Quality & Type Analysis</h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Field Name</th>
                      <th className="py-3 px-4">Records</th>
                      <th className="py-3 px-4">Null / Empty</th>
                      <th className="py-3 px-4">Null Rate</th>
                      <th className="py-3 px-4">Coverage</th>
                      <th className="py-3 px-4">Distinct</th>
                      <th className="py-3 px-4">Type Distribution</th>
                      <th className="py-3 px-4">Anomalies</th>
                      <th className="py-3 px-4">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {(Object.values(selectedDatasetSummary.fieldMetrics) as FieldQualityMetrics[]).map((fm) => (
                      <tr key={fm.fieldName} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                          <Tag className="w-3 h-3 text-blue-400" />
                          {fm.fieldName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{fm.recordCount}</td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {fm.nullCount + fm.emptyCount + fm.whitespaceCount + fm.missingCount}
                          <span className="text-[10px] text-slate-500 ml-1">
                            (N:{fm.nullCount} E:{fm.emptyCount} W:{fm.whitespaceCount} M:{fm.missingCount})
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              fm.nullRate > 0.3 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'
                            }`}
                          >
                            {(fm.nullRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-emerald-400 font-semibold">{fm.sourceCoverage}%</td>
                        <td className="py-2.5 px-4 text-slate-300">{fm.distinctCount}</td>
                        <td className="py-2.5 px-4 text-[10px] text-slate-400">
                          {Object.entries(fm.typeDistribution)
                            .map(([t, c]) => `${t}:${c}`)
                            .join(', ')}
                        </td>
                        <td className="py-2.5 px-4">
                          {fm.anomaliesDetected.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {fm.anomaliesDetected.map((anom, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                >
                                  {anom}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-emerald-400 text-[10px]">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                          {fm.sampleValues.slice(0, 3).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUALITY FINDINGS */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search findings by message, record ID, or field..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Severity:</span>
              {['ALL', 'Critical', 'Error', 'Warning', 'Info'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    severityFilter === sev
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Dataset</th>
                  <th className="py-3 px-4">Field</th>
                  <th className="py-3 px-4">Finding Message</th>
                  <th className="py-3 px-4">Remediation Suggestion</th>
                  <th className="py-3 px-4">Status / Exception</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredFindings.map((f) => (
                  <tr key={f.findingId} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.severity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : f.severity === 'Error'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : f.severity === 'Warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-medium">{f.datasetId}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{f.field || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-200 font-medium max-w-sm">{f.message}</td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-xs">{f.remediationSuggestion}</td>
                    <td className="py-2.5 px-4">
                      {f.exception ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {f.exception.action} ({f.exception.user})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Unreviewed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => setSelectedFindingForException(f)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded text-[10px] font-semibold transition"
                      >
                        Record Exception
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DUPLICATES */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">
              Found {exactDuplicates.length} exact matches and {possibleDuplicates.length} probabilistic matches.
            </span>
            <button
              onClick={fetchDuplicates}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan Duplicates</span>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Duplicate Review Console</h3>
            {[...exactDuplicates, ...possibleDuplicates].map((dup) => (
              <div key={dup.matchId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dup.type === 'Exact'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {dup.type} Match ({Math.round(dup.similarity * 100)}%)
                    </span>
                    <span className="text-slate-400">{dup.reason}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReviewDuplicate(dup.matchId, 'ConfirmedDuplicate')}
                      className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-xs font-semibold transition"
                    >
                      Confirm Duplicate
                    </button>
                    <button
                      onClick={() => handleReviewDuplicate(dup.matchId, 'Dismissed')}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-medium transition"
                    >
                      Dismiss (Distinct)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Record A */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400">RECORD A: {dup.recordA.sourceId}</div>
                    <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900/50 rounded">
                      {JSON.stringify(dup.recordA.payload, null, 2)}
                    </pre>
                  </div>

                  {/* Record B */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400">RECORD B: {dup.recordB.sourceId}</div>
                    <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900/50 rounded">
                      {JSON.stringify(dup.recordB.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONTROLLED TRANSFORMATIONS */}
      {activeTab === 'transformations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">
              Controlled transformations are applied strictly to the local normalized layer. Source values are never modified.
            </span>
            <button
              onClick={() => handleApplyTransformations(selectedDatasetId)}
              disabled={isApplyingTransformations}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isApplyingTransformations ? 'animate-spin' : ''}`} />
              <span>Apply All Active Rules</span>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Transformation Rules Registry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transformationRules.map((rule) => (
                <div key={rule.ruleId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {rule.datasetId} • Field: <code className="text-blue-400 font-mono">{rule.field}</code> • Operation: {rule.operation}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-300 border border-slate-800/80">
                    Config: {JSON.stringify(rule.configuration)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => handlePreviewTransformation(rule.ruleId)}
                      disabled={previewLoading}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Impact</span>
                    </button>

                    {rule.status === 'Draft' && (
                      <button
                        onClick={() => handleApproveRule(rule.ruleId)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Activate</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transformation Preview Modal / View */}
          {previewResult && (
            <div className="bg-slate-900 border border-blue-500/50 p-5 rounded-xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Transformation Preview & Dependent Impact Analysis
                </h4>
                <button onClick={() => setPreviewResult(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Records Affected</span>
                  <span className="text-emerald-400 font-bold text-base">{previewResult.recordsAffected}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Field Target</span>
                  <span className="text-slate-200 font-bold">{previewResult.field}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Dependent Reports</span>
                  <span className="text-slate-200 font-bold">{previewResult.dependentImpact.reports.length}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded">
                  <span className="text-slate-400 block text-[10px]">Dependent Dashboards</span>
                  <span className="text-slate-200 font-bold">{previewResult.dependentImpact.dashboards.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Sample Records Before & After:</span>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Record ID</th>
                        <th className="py-2 px-3">Original Value (Preserved)</th>
                        <th className="py-2 px-3">Transformed Value</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono text-[11px]">
                      {previewResult.examples.map((ex) => (
                        <tr key={ex.recordId}>
                          <td className="py-2 px-3 text-slate-400">{ex.recordId}</td>
                          <td className="py-2 px-3 text-rose-300 font-bold">{String(ex.originalValue)}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{String(ex.transformedValue)}</td>
                          <td className="py-2 px-3">
                            <span className="text-emerald-400 text-[10px]">{ex.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TREND & AUDIT */}
      {activeTab === 'trend' && dashboard && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Quality Score Historical Trend
            </h3>
            <p className="text-xs text-slate-400">
              Tracks technical completeness across synchronization jobs and validation cycles.
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Previous Score</span>
                <span className="text-xl font-bold text-slate-300">{dashboard.trend.previousScore}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Current Score</span>
                <span className="text-xl font-bold text-emerald-400">{dashboard.trend.currentScore}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Net Change</span>
                <span
                  className={`text-xl font-bold ${
                    dashboard.trend.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dashboard.trend.change >= 0 ? `+${dashboard.trend.change}` : dashboard.trend.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: TEST SUITE RUNNER */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">
              Automated test suite validates all 20+ requirements (Required fields, types, nulls, cycles, duplicates, 100k benchmark).
            </span>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
            >
              <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>{isRunningTests ? 'Executing Test Suite...' : 'Run Automated Tests'}</span>
            </button>
          </div>

          {testResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">Total Scenarios</span>
                  <span className="text-xl font-bold text-white">{testResults.total}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-emerald-400 block text-[10px]">Passed</span>
                  <span className="text-xl font-bold text-emerald-400">{testResults.passed}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-rose-400 block text-[10px]">Failed</span>
                  <span className="text-xl font-bold text-rose-400">{testResults.failed}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">Execution Time</span>
                  <span className="text-xl font-bold text-blue-400">{testResults.durationMs}ms</span>
                </div>
              </div>

              <div className="space-y-2">
                {testResults.results.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      {r.status === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200">{r.testName}</span>
                        {r.message && <p className="text-xs text-rose-400 mt-0.5">{r.message}</p>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{r.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exception Recording Modal */}
      {selectedFindingForException && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              Record Quality Exception
            </h3>
            <p className="text-xs text-slate-400">
              Mark this anomaly as reviewed or accepted with a permanent audit justification. The finding will remain in lineage.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold">Target Finding:</span>
              <p className="text-slate-200 font-medium">{selectedFindingForException.message}</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Exception Action:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Accepted', 'Reviewed', 'Ignored'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setExceptionAction(act)}
                    className={`py-2 rounded-lg font-semibold transition ${
                      exceptionAction === act
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Audit Justification / Reason:</label>
              <textarea
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Enter regulatory or controller reasoning..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setSelectedFindingForException(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveException}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
              >
                Save Exception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
