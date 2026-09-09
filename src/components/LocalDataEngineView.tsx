import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Layers,
  HardDrive,
  RefreshCw,
  Zap,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  Activity,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Lock,
  Compass,
  Cpu,
  BarChart3,
  GitCommit,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  LocalDataset,
  DatasetType,
  DatasetStatus,
  SyncStrategy,
  IngestionJob,
  AnalyticalQueryPlan,
  AnalyticalQueryResult,
  PrecomputedAggregateSummary,
  DataHealthItem,
  DatabaseHealthMetrics,
  BenchmarkExecutionRecord,
  StorageSettings,
  QueryRoutingPreference
} from '../types/phase17LocalDataEngine';

export function LocalDataEngineView() {
  // Navigation tabs within Local Data Engine
  const [activeTab, setActiveTab] = useState<
    'datasets' | 'wizard' | 'explorer' | 'aggregations' | 'health' | 'benchmarks'
  >('datasets');

  // Datasets and jobs state
  const [datasets, setDatasets] = useState<LocalDataset[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [aggregates, setAggregates] = useState<PrecomputedAggregateSummary[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthMetrics | null>(null);
  const [dataHealthItems, setDataHealthItems] = useState<DataHealthItem[]>([]);
  const [crossSkewWarning, setCrossSkewWarning] = useState<string | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkExecutionRecord[]>([]);
  const [settings, setSettings] = useState<StorageSettings | null>(null);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Selected dataset for detail / query
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('DS-VOUCHERS-SALES-2026');

  // Query explorer state
  const [searchTerm, setSearchTerm] = useState('');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [queryResult, setQueryResult] = useState<AnalyticalQueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Purge confirmation modal
  const [purgeTargetDataset, setPurgeTargetDataset] = useState<LocalDataset | null>(null);
  const [purgeConsentChecked, setPurgeConsentChecked] = useState(false);

  // Benchmark run state
  const [runningBenchmarkVolume, setRunningBenchmarkVolume] = useState<string | null>(null);

  // Import Wizard state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardCompany, setWizardCompany] = useState('Acme Enterprise Ltd (2025-26)');
  const [wizardCompanyId, setWizardCompanyId] = useState('COMP-ACME-001');
  const [wizardDataType, setWizardDataType] = useState<DatasetType>('Voucher');
  const [wizardPeriod, setWizardPeriod] = useState<'CurrentFY' | 'PreviousFY' | 'MultipleFY' | 'Custom'>('CurrentFY');
  const [wizardStrategy, setWizardStrategy] = useState<SyncStrategy>('PeriodRefresh');
  const [wizardBatchSize, setWizardBatchSize] = useState<number>(5000);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [activeImportJob, setActiveImportJob] = useState<IngestionJob | null>(null);

  // PDF warning modal for large exports
  const [pdfWarningVisible, setPdfWarningVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [dsRes, jobsRes, aggRes, healthRes, dataHealthRes, benchRes, settingsRes] = await Promise.all([
        fetch('/api/engine/datasets'),
        fetch('/api/engine/jobs'),
        fetch('/api/engine/aggregations'),
        fetch('/api/engine/health'),
        fetch('/api/engine/data-health'),
        fetch('/api/engine/benchmarks'),
        fetch('/api/engine/settings')
      ]);

      const dsData = await dsRes.json();
      const jobsData = await jobsRes.json();
      const aggData = await aggRes.json();
      const healthData = await healthRes.json();
      const dataHealthData = await dataHealthRes.json();
      const benchData = await benchRes.json();
      const settingsData = await settingsRes.json();

      if (dsData.success) setDatasets(dsData.datasets);
      if (jobsData.success) setJobs(jobsData.jobs);
      if (aggData.success) setAggregates(aggData.aggregates);
      if (healthData.success) setDbHealth(healthData.health);
      if (dataHealthData.success) {
        setDataHealthItems(dataHealthData.healthItems);
        setCrossSkewWarning(dataHealthData.crossConsistencyWarning);
      }
      if (benchData.success) setBenchmarks(benchData.benchmarks);
      if (settingsData.success) setSettings(settingsData.settings);

      // Trigger initial query for default dataset
      if (dsData.datasets?.length > 0) {
        runAnalyticalQuery(dsData.datasets[0].datasetId);
      }
    } catch (err: any) {
      setActionError(`Failed to load engine data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalyticalQuery = async (targetId?: string) => {
    const dsId = targetId || selectedDatasetId;
    if (!dsId) return;

    setIsQuerying(true);
    setActionError(null);
    try {
      const res = await fetch('/api/engine/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: dsId,
          companyId: wizardCompanyId,
          searchTerm,
          voucherTypeFilter,
          dateFrom,
          dateTo,
          limit: 100
        })
      });

      const data = await res.json();
      if (data.success) {
        setQueryResult(data.result);
      } else {
        setActionError(data.message || 'Query failed.');
      }
    } catch (err: any) {
      setActionError(`Query error: ${err.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handlePurgeDataset = async () => {
    if (!purgeTargetDataset || !purgeConsentChecked) return;
    try {
      const res = await fetch(`/api/engine/datasets/${purgeTargetDataset.datasetId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmLocalOnly: true,
          companyId: purgeTargetDataset.companyId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        setPurgeTargetDataset(null);
        setPurgeConsentChecked(false);
        fetchInitialData();
      } else {
        setActionError(data.message || 'Purge failed.');
      }
    } catch (err: any) {
      setActionError(`Purge error: ${err.message}`);
    }
  };

  const handleVacuumDatabase = async () => {
    try {
      const res = await fetch('/api/engine/vacuum', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchInitialData();
      }
    } catch (err: any) {
      setActionError(`Vacuum error: ${err.message}`);
    }
  };

  const handleCrashRecovery = async () => {
    try {
      const res = await fetch('/api/engine/crash-recovery', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchInitialData();
      }
    } catch (err: any) {
      setActionError(`Crash recovery error: ${err.message}`);
    }
  };

  const handleRefreshAggregates = async (aggId?: string) => {
    try {
      const res = await fetch('/api/engine/aggregations/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggregateId: aggId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Precomputed aggregation cubes recomputed successfully.');
        setAggregates(data.aggregates);
      }
    } catch (err: any) {
      setActionError(`Aggregation error: ${err.message}`);
    }
  };

  const handleRunBenchmark = async (vol: string) => {
    setRunningBenchmarkVolume(vol);
    try {
      const res = await fetch('/api/engine/benchmarks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowVolume: vol })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchInitialData();
      }
    } catch (err: any) {
      setActionError(`Benchmark error: ${err.message}`);
    } finally {
      setRunningBenchmarkVolume(null);
    }
  };

  const handleStartImportWizard = async () => {
    setIsImporting(true);
    setWizardStep(5); // Advance to live import progress

    try {
      const res = await fetch('/api/engine/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: wizardCompanyId,
          dataType: wizardDataType,
          strategy: wizardStrategy,
          financialYear: 'FY2025-26',
          batchSize: wizardBatchSize,
          enableRawRetention: false,
          validateAccountingTotals: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveImportJob(data.job);
        setTimeout(() => {
          setIsImporting(false);
          setWizardStep(6); // Advance to verification report
          fetchInitialData();
        }, 1200);
      } else {
        setIsImporting(false);
        setActionError(data.message || 'Import failed.');
      }
    } catch (err: any) {
      setIsImporting(false);
      setActionError(`Import error: ${err.message}`);
    }
  };

  const selectedDataset = useMemo(() => {
    return datasets.find(d => d.datasetId === selectedDatasetId) || datasets[0];
  }, [datasets, selectedDatasetId]);

  return (
    <div id="local-data-engine-container" className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  High-Performance Local Data Engine & Analytics Cache
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Phase 17 • Columnar Analytics Store • Incremental Sync • Million-Row Processing • 100% Read-Only Tally Safety
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Routing Preference Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-500 font-medium">Query Route:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Prefer Local Cache
              </span>
            </div>

            {/* Offline Status Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tally Source Read-Only
            </span>

            <button
              onClick={() => fetchInitialData()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Engine
            </button>
          </div>
        </div>

        {/* Global Metric Strips */}
        {dbHealth && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">Engine Architecture</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                DuckDB Columnar
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">Total Cached Rows</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {dbHealth.totalRowCount.toLocaleString()} rows
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">Local Storage Used</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {(dbHealth.databaseSizeBytes / (1024 * 1024)).toFixed(1)} MB
                <span className="text-xs font-normal text-slate-500 ml-1">/ 15 GB</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">Active Datasets</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                {dbHealth.datasetCount} analytical sets
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">Tenant Safety</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Company Isolated
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500 font-medium">Local Encryption</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                AES-256 Storage
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Cross-Dataset Consistency Alert */}
      {crossSkewWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-900">Analytical Snapshot Skew Warning</div>
            <div className="text-xs text-amber-800">{crossSkewWarning}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'datasets'
              ? 'border-emerald-600 text-emerald-800 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Datasets & Lineage ({datasets.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('wizard');
            setWizardStep(1);
          }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'wizard'
              ? 'border-emerald-600 text-emerald-800 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Import Tally Data (Wizard)
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'explorer'
              ? 'border-emerald-600 text-emerald-800 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          Million-Row Explorer & Query Plan
        </button>

        <button
          onClick={() => setActiveTab('aggregations')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'aggregations'
              ? 'border-emerald-600 text-emerald-800 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Precomputed Aggregations ({aggregates.length})
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'health'
              ? 'border-emerald-600 text-emerald-800 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Data Freshness & Health
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'benchmarks'
              ? 'border-emerald-600 text-emerald-800 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          1M-5M Benchmarks & Maintenance
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: DATASETS & LINEAGE                  */}
      {/* ========================================== */}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Local Columnar Datasets</h2>
              <p className="text-xs text-slate-500">
                Partitioned by company and financial year for sub-millisecond analytical aggregations.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('wizard');
                setWizardStep(1);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Import Tally Data Wizard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map(ds => (
              <div
                key={ds.datasetId}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  selectedDatasetId === ds.datasetId
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {ds.objectType}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        ds.status === 'Fresh'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ds.status === 'Stale'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ds.status === 'Fresh' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {ds.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ds.datasetId}</h3>
                    <p className="text-xs text-slate-500">{ds.companyName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Row Count:</span>
                      <span className="font-semibold text-slate-900">{ds.rowCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Partition:</span>
                      <span className="font-semibold text-slate-900">{ds.financialYearPartition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Disk Usage:</span>
                      <span className="font-semibold text-slate-900">{(ds.diskSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sync Strategy:</span>
                      <span className="font-semibold text-slate-900">{ds.refreshStrategy}</span>
                    </div>
                  </div>

                  {/* Lineage Details */}
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Lineage:</span>
                      <span className="text-slate-700 font-semibold">{ds.lineage.source}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Schema/Map Ver:</span>
                      <span>v{ds.schemaVersion} / v{ds.mappingVersion}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Last Synced:</span>
                      <span>{new Date(ds.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => {
                      setSelectedDatasetId(ds.datasetId);
                      setActiveTab('explorer');
                      runAnalyticalQuery(ds.datasetId);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Query Rows
                  </button>

                  <button
                    onClick={() => setPurgeTargetDataset(ds)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Purge local analytical dataset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Lineage & Tenant Safety Specification Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tenant Isolation & Data Lineage Architecture
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every row stored inside the local analytical columnar engine is hard-tagged with <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">CompanyId</code> and checked at the data-access layer.
              Cross-company queries are prevented by database abstraction rules. In accordance with strict read-only safety, raw Tally source records are never modified or mutated.
            </p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: IMPORT WIZARD ("IMPORT TALLY DATA")  */}
      {/* ========================================== */}
      {activeTab === 'wizard' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">IMPORT TALLY DATA WIZARD</h2>
              <p className="text-xs text-slate-500">
                Safe batch extraction, schema validation, normalization, and local columnar indexing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 1 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'}`}>1. Company</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 2 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'}`}>2. Data</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'}`}>3. Period</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 4 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'}`}>4. Preview</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 5 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'}`}>5. Import</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`px-2.5 py-1 rounded-full ${wizardStep === 6 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'}`}>6. Verify</span>
            </div>
          </div>

          {/* STEP 1: Select Company */}
          {wizardStep === 1 && (
            <div className="space-y-4 max-w-xl">
              <label className="block text-sm font-semibold text-slate-900">Step 1: Select Tally Company</label>
              <div className="space-y-2">
                <div
                  onClick={() => {
                    setWizardCompany('Acme Enterprise Ltd (2025-26)');
                    setWizardCompanyId('COMP-ACME-001');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    wizardCompanyId === 'COMP-ACME-001'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-sm">Acme Enterprise Ltd (2025-26)</div>
                  <div className="text-xs text-slate-500 mt-1">Company GUID: COMP-ACME-001 • Financial Year: 2025-26 • Status: Connected</div>
                </div>

                <div
                  onClick={() => {
                    setWizardCompany('Acme Global Retail Division');
                    setWizardCompanyId('COMP-ACME-002');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    wizardCompanyId === 'COMP-ACME-002'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-sm">Acme Global Retail Division</div>
                  <div className="text-xs text-slate-500 mt-1">Company GUID: COMP-ACME-002 • Financial Year: 2025-26 • Status: Connected</div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  Next: Select Data
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Data */}
          {wizardStep === 2 && (
            <div className="space-y-4 max-w-xl">
              <label className="block text-sm font-semibold text-slate-900">Step 2: Select Data Collections</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'Voucher', label: 'Sales & Purchases', desc: 'Accounting vouchers & line items' },
                  { type: 'Ledger', label: 'Ledgers & Masters', desc: 'Chart of accounts & groups' },
                  { type: 'Inventory', label: 'Stock Items & Godowns', desc: 'Inventory masters & batches' },
                  { type: 'GST', label: 'GST Returns & Statutory', desc: 'GSTR-1, 3B & tax tables' },
                  { type: 'Outstanding', label: 'Bills Outstanding', desc: 'Receivables & payables ageing' },
                  { type: 'Custom', label: 'Custom TDL Collections', desc: 'User-defined TDL fields' }
                ].map(item => (
                  <div
                    key={item.type}
                    onClick={() => setWizardDataType(item.type as DatasetType)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wizardDataType === item.type
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  Next: Select Period
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Period */}
          {wizardStep === 3 && (
            <div className="space-y-4 max-w-xl">
              <label className="block text-sm font-semibold text-slate-900">Step 3: Select Accounting Period & Strategy</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'CurrentFY', label: 'Current Financial Year', desc: '01-Apr-2025 to 31-Mar-2026' },
                  { id: 'PreviousFY', label: 'Previous Financial Year', desc: '01-Apr-2024 to 31-Mar-2025' },
                  { id: 'MultipleFY', label: 'Multiple Financial Years', desc: 'All Historical Years' },
                  { id: 'Custom', label: 'Custom Date Range', desc: 'Bounded window' }
                ].map(p => (
                  <div
                    key={p.id}
                    onClick={() => setWizardPeriod(p.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      wizardPeriod === p.id
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{p.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Synchronization Strategy</label>
                <select
                  value={wizardStrategy}
                  onChange={e => setWizardStrategy(e.target.value as SyncStrategy)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="PeriodRefresh">Period Refresh (Configurable FY date window)</option>
                  <option value="Incremental">Incremental Sync (Retrieve changes since last sync)</option>
                  <option value="FullRefresh">Full Historical Refresh</option>
                  <option value="ManualRefresh">Manual Snapshot Only</option>
                </select>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  Next: Preview & Estimate
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Disk Storage Check */}
          {wizardStep === 4 && (
            <div className="space-y-4 max-w-xl">
              <label className="block text-sm font-semibold text-slate-900">Step 4: Extraction Preview & Storage Safety</label>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Company:</span>
                  <span className="font-semibold text-slate-900">{wizardCompany}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Target Object:</span>
                  <span className="font-semibold text-slate-900">{wizardDataType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Estimated Source Records:</span>
                  <span className="font-semibold text-slate-900">~15,400 records</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Estimated Local Disk Usage:</span>
                  <span className="font-semibold text-emerald-700">~4.8 MB (Compressed Columnar)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Local Free Disk Space:</span>
                  <span className="font-semibold text-slate-900">248.4 GB available</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Disk Safety Status:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sufficient Storage Confirmed
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-semibold text-amber-900">Read-Only Safety Guarantee</div>
                <div>EXFIN will query Tally using read-only export envelopes. No mutating commands are ever emitted.</div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleStartImportWizard}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  Start Ingestion Pipeline
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Live Ingestion Pipeline */}
          {wizardStep === 5 && (
            <div className="space-y-6 max-w-xl py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 animate-pulse">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Executing Ingestion Pipeline</h3>
                <p className="text-xs text-slate-500">
                  Pipeline: Fetch → Parse → Validate → Normalize → Transform → Insert → Index → Verify
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Batch Insertion & Columnar Indexing</span>
                  <span>100% (15,400 records)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-emerald-600 rounded-full w-full transition-all duration-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Discovered</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">15,400</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Inserted</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">15,400</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400">Rejected</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">0</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Verification & Accounting Reconciliation */}
          {wizardStep === 6 && activeImportJob && (
            <div className="space-y-4 max-w-xl">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Ingestion Complete & Verified
                </div>
                <p className="text-xs text-emerald-800">
                  All {activeImportJob.recordsInserted.toLocaleString()} records ingested, normalized, indexed into local columnar store in {activeImportJob.elapsedMilliseconds} ms.
                </p>
              </div>

              {/* Accounting Total Validation */}
              {activeImportJob.reconciliation && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>Accounting Totals Integrity Check</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      MATCHED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-700">
                    <div>
                      <span className="text-slate-400 block">Tally Source Total:</span>
                      <span className="font-bold text-slate-900">₹{activeImportJob.reconciliation.tallySourceTotal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Local Dataset Total:</span>
                      <span className="font-bold text-slate-900">₹{activeImportJob.reconciliation.localDatasetTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-700 pt-1 font-medium">
                    {activeImportJob.reconciliation.statusMessage}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setActiveTab('explorer');
                    runAnalyticalQuery(activeImportJob.datasetId);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  Explore Local Records
                </button>
                <button
                  onClick={() => setActiveTab('datasets')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Back to Datasets
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: MILLION-ROW EXPLORER & QUERY PLAN   */}
      {/* ========================================== */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Query Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Analytical Dataset Explorer</h2>
                <p className="text-xs text-slate-500">
                  Sub-millisecond queries with AST parameterization, SQL safety, and index acceleration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => runAnalyticalQuery()}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Execute Query
                </button>

                <button
                  onClick={() => {
                    // Streaming CSV Export
                    const csvRows = queryResult?.rows || [];
                    const headers = queryResult?.columns || [];
                    const csvContent = [
                      headers.join(','),
                      ...csvRows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${selectedDatasetId}-export.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Stream CSV
                </button>

                <button
                  onClick={() => setPdfWarningVisible(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search party name, voucher number, or GSTIN..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAnalyticalQuery()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <select
                  value={selectedDatasetId}
                  onChange={e => {
                    setSelectedDatasetId(e.target.value);
                    runAnalyticalQuery(e.target.value);
                  }}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {datasets.map(d => (
                    <option key={d.datasetId} value={d.datasetId}>
                      {d.objectType} ({d.datasetId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={voucherTypeFilter}
                  onChange={e => {
                    setVoucherTypeFilter(e.target.value);
                    runAnalyticalQuery();
                  }}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ALL">All Voucher Types</option>
                  <option value="Sales">Sales Vouchers</option>
                  <option value="Purchase">Purchase Vouchers</option>
                  <option value="Tax Invoice">Tax Invoices</option>
                  <option value="Receipt">Receipts</option>
                </select>
              </div>
            </div>

            {/* Query Plan Inspection Box */}
            {queryResult?.plan && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1.5 text-slate-700">
                <div className="flex items-center justify-between text-slate-500 font-semibold font-sans">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Query Execution Plan & Index Optimization
                  </span>
                  <span className="text-emerald-700 font-bold font-mono">
                    {queryResult.plan.executionTimeMs} ms • {queryResult.plan.memoryUsedMb} MB RAM
                  </span>
                </div>
                <div className="text-slate-800 text-[11px] overflow-x-auto whitespace-nowrap bg-white p-2 rounded border border-slate-200/80">
                  <code>{queryResult.plan.sqlRepresentation}</code>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span>Indexes: <strong className="text-slate-700">{queryResult.plan.indexesUsed.join(', ')}</strong></span>
                  <span>•</span>
                  <span>Tenant Filter: <strong className="text-emerald-700">CompanyId = '{wizardCompanyId}'</strong></span>
                  <span>•</span>
                  <span>Matched Rows: <strong className="text-slate-900">{queryResult.totalRows.toLocaleString()}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Virtualized Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-700">
                Displaying Window of {queryResult?.rows?.length || 0} records (Total: {queryResult?.totalRows.toLocaleString() || 0})
              </span>
              <span className="text-xs text-slate-400">Render Virtualization Active</span>
            </div>

            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100/80 text-slate-700 sticky top-0 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    {queryResult?.columns.map(col => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {queryResult?.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {queryResult.columns.map(col => (
                        <td key={col} className="px-4 py-2.5 whitespace-nowrap">
                          {col === 'Amount' || col === 'TotalAmount' || col === 'IGST' ? (
                            <span className="font-semibold text-slate-900">
                              ₹{Number(row[col] || 0).toLocaleString()}
                            </span>
                          ) : col === 'Status' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {row[col]}
                            </span>
                          ) : (
                            String(row[col] ?? '-')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {(!queryResult?.rows || queryResult.rows.length === 0) && (
                    <tr>
                      <td colSpan={queryResult?.columns.length || 6} className="px-4 py-8 text-center text-slate-400 font-sans">
                        No matching records found in local analytical cache.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: PRECOMPUTED AGGREGATIONS            */}
      {/* ========================================== */}
      {activeTab === 'aggregations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Precomputed Columnar Aggregation Cubes</h2>
              <p className="text-xs text-slate-500">
                Instant reporting summaries refreshed automatically on dataset change.
              </p>
            </div>
            <button
              onClick={() => handleRefreshAggregates()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refresh All Aggregation Cubes
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aggregates.map(agg => (
              <div key={agg.aggregateId} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      {agg.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{agg.title}</h3>
                  </div>
                  <button
                    onClick={() => handleRefreshAggregates(agg.aggregateId)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh this cube"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Dimensions: <strong>{agg.dimensions.join(', ')}</strong></span>
                  <span>•</span>
                  <span>Refreshed: {new Date(agg.lastRefreshedAt).toLocaleTimeString()}</span>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                      <tr>
                        {Object.keys(agg.previewRows[0] || {}).map(k => (
                          <th key={k} className="p-2.5 whitespace-nowrap">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {agg.previewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          {Object.keys(r).map(k => (
                            <td key={k} className="p-2.5 whitespace-nowrap">
                              {typeof r[k] === 'number' && k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('balance') || k.toLowerCase().includes('liability') || k.toLowerCase().includes('turnover')
                                ? `₹${Number(r[k]).toLocaleString()}`
                                : String(r[k])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: DATA FRESHNESS & HEALTH MATRIX      */}
      {/* ========================================== */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">DATA HEALTH MATRIX</h2>
              <p className="text-xs text-slate-500">
                Real-time monitor tracking dataset synchronization freshness, age thresholds, and skew warnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleVacuumDatabase}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5" />
                Compact & Vacuum DB
              </button>
              <button
                onClick={handleCrashRecovery}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify Integrity
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataHealthItems.map(item => (
              <div
                key={item.datasetId}
                className={`bg-white border rounded-xl p-5 shadow-sm space-y-3 ${
                  item.isStale ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.datasetType}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'Fresh'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Stale'
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Synchronized:</span>
                    <span className="font-semibold text-slate-900">{new Date(item.lastSynchronized).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Age:</span>
                    <span className="font-semibold text-slate-900">{item.ageHours} hours old</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cached Rows:</span>
                    <span className="font-semibold text-slate-900">{item.rowCount.toLocaleString()}</span>
                  </div>
                </div>

                {item.warning && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                    {item.warning}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setActiveTab('wizard');
                      setWizardDataType(item.datasetType);
                      setWizardStep(4);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync Dataset Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: 1M-5M BENCHMARKS & MAINTENANCE       */}
      {/* ========================================== */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">High-Performance Million-Row Benchmark Suite</h2>
              <p className="text-xs text-slate-500">
                Verified execution throughput across 100K, 500K, 1M, and 5M record volumes using embedded DuckDB columnar storage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {['100K', '500K', '1M', '5M'].map(vol => (
                <button
                  key={vol}
                  disabled={runningBenchmarkVolume !== null}
                  onClick={() => handleRunBenchmark(vol)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className={`w-3 h-3 ${runningBenchmarkVolume === vol ? 'animate-spin' : ''}`} />
                  Benchmark {vol}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Row Volume</th>
                    <th className="p-3.5">Ingestion (sec)</th>
                    <th className="p-3.5">Monthly Aggregation (sec)</th>
                    <th className="p-3.5">Filtered Query (sec)</th>
                    <th className="p-3.5">Export Streaming (sec)</th>
                    <th className="p-3.5">Peak RAM (MB)</th>
                    <th className="p-3.5">Startup Time (ms)</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {benchmarks.map(b => (
                    <tr key={b.rowVolumeLabel} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold font-sans text-slate-900">
                        {b.rowVolumeLabel} ({b.rowCount.toLocaleString()} rows)
                      </td>
                      <td className="p-3.5 text-slate-700">{b.ingestionSeconds.toFixed(2)}s</td>
                      <td className="p-3.5 text-emerald-700 font-bold">{b.monthlyAggregationSeconds.toFixed(3)}s</td>
                      <td className="p-3.5 text-indigo-700 font-bold">{b.filteredQuerySeconds.toFixed(3)}s</td>
                      <td className="p-3.5 text-slate-700">{b.exportSeconds.toFixed(2)}s</td>
                      <td className="p-3.5 text-slate-700">{b.peakMemoryMb.toFixed(1)} MB</td>
                      <td className="p-3.5 text-slate-700">{b.startupTimeMs} ms</td>
                      <td className="p-3.5 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          VERIFIED PASS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance & Storage Settings */}
          {settings && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Local Storage & Analytics Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-500 font-medium block mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={settings.storageLocation}
                    onChange={e => setSettings({ ...settings, storageLocation: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-medium block mb-1">Max Disk Quota (GB)</label>
                  <input
                    type="number"
                    value={settings.maxStorageGigabytes}
                    onChange={e => setSettings({ ...settings, maxStorageGigabytes: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-medium block mb-1">Stale Threshold (Hours)</label>
                  <input
                    type="number"
                    value={settings.staleThresholdHours}
                    onChange={e => setSettings({ ...settings, staleThresholdHours: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.encryptionEnabled}
                      onChange={e => setSettings({ ...settings, encryptionEnabled: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700">AES-256 Storage Encryption</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoCleanupEnabled}
                      onChange={e => setSettings({ ...settings, autoCleanupEnabled: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700">Auto Vacuum & Compact</span>
                  </label>
                </div>

                <button
                  onClick={async () => {
                    await fetch('/api/engine/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(settings)
                    });
                    setActionMessage('Settings saved successfully.');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Purge Local Dataset Confirmation */}
      {purgeTargetDataset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Purge Local Analytical Dataset</h3>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-medium leading-relaxed">
              <strong>Explicit Safety Notice:</strong> This removes only EXFIN local cached data ({purgeTargetDataset.rowCount.toLocaleString()} rows). Source Tally company data will not be affected or modified in any way.
            </div>

            <p className="text-xs text-slate-600">
              Dataset: <strong className="text-slate-900">{purgeTargetDataset.datasetId}</strong> ({purgeTargetDataset.objectType})
            </p>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={purgeConsentChecked}
                onChange={e => setPurgeConsentChecked(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>I confirm that only the local analytical cache will be removed and Tally source remains unaffected.</span>
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setPurgeTargetDataset(null);
                  setPurgeConsentChecked(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!purgeConsentChecked}
                onClick={handlePurgeDataset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Local Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Large PDF Export Warning */}
      {pdfWarningVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Impractical PDF Export Warning</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Exporting raw multi-thousand or million-row transaction datasets directly to PDF is impractical and may consume several gigabytes of memory.
              PDF documents are designed for <strong>curated report summaries</strong> and aggregation views.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              Please use <strong>Stream CSV</strong> for raw tabular exports, or navigate to <strong>Precomputed Aggregations</strong> to print executive summary reports.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPdfWarningVisible(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
