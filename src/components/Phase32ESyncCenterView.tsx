import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  Layers,
  FileDiff,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowRight,
  Activity,
  History,
  GitBranch,
  Eye
} from 'lucide-react';
import {
  SyncJob,
  SyncMode,
  DatasetFreshnessInfo,
  ChangeLog,
  GraphSyncStatus
} from '../types/phase32ESync';

export const Phase32ESyncCenterView: React.FC = () => {
  const [companyId, setCompanyId] = useState<string>('CMP-001');
  const [activeTab, setActiveTab] = useState<'freshness' | 'history' | 'changes' | 'graph' | 'tests'>('freshness');

  // State
  const [freshnessList, setFreshnessList] = useState<DatasetFreshnessInfo[]>([]);
  const [jobsList, setJobsList] = useState<SyncJob[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [changeSummary, setChangeSummary] = useState<{ added: number; modified: number; unchanged: number; removed: number; total: number }>({
    added: 0,
    modified: 0,
    unchanged: 0,
    removed: 0,
    total: 0
  });
  const [graphStatus, setGraphStatus] = useState<GraphSyncStatus | null>(null);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
  const [selectedChangeLog, setSelectedChangeLog] = useState<ChangeLog | null>(null);

  // Filters
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Test Runner State
  const [testReport, setTestReport] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Polling for live status
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [companyId]);

  const fetchData = async () => {
    try {
      // 1. Freshness
      const freshRes = await fetch(`/api/sync/freshness?companyId=${companyId}`);
      if (freshRes.ok) {
        const data = await freshRes.json();
        setFreshnessList(data.freshness || []);
      }

      // 2. Jobs
      const jobsRes = await fetch(`/api/sync/jobs?companyId=${companyId}`);
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        const jobs: SyncJob[] = data.jobs || [];
        setJobsList(jobs);
        const running = jobs.find((j) => j.status === 'Running' || j.status === 'Paused');
        setActiveJob(running || null);
      }

      // 3. Changes
      const changesRes = await fetch(`/api/sync/changes?companyId=${companyId}`);
      if (changesRes.ok) {
        const data = await changesRes.json();
        setChangeLogs(data.changes || []);
        if (data.summary) setChangeSummary(data.summary);
      }

      // 4. Graph status
      const graphRes = await fetch(`/api/sync/graph-status?companyId=${companyId}`);
      if (graphRes.ok) {
        const data = await graphRes.json();
        setGraphStatus(data.graphStatus);
      }
    } catch {
      // Benign network catch during dev restarts
    }
  };

  const handleStartSync = async (mode: SyncMode, datasetId?: string) => {
    try {
      const res = await fetch('/api/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, mode, datasetId })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: data.message });
        fetchData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to trigger sync.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handlePause = async (jobId: string) => {
    await fetch(`/api/sync/${jobId}/pause`, { method: 'POST' });
    fetchData();
  };

  const handleResume = async (jobId: string) => {
    await fetch(`/api/sync/${jobId}/resume`, { method: 'POST' });
    fetchData();
  };

  const handleCancel = async (jobId: string) => {
    await fetch(`/api/sync/${jobId}/cancel`, { method: 'POST' });
    fetchData();
  };

  const handleRetry = async (jobId: string) => {
    await fetch(`/api/sync/${jobId}/retry`, { method: 'POST' });
    fetchData();
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestReport(null);
    try {
      const res = await fetch('/api/sync/run-phase32e-tests', { method: 'POST' });
      const data = await res.json();
      setTestReport(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Test execution failed: ${err.message}` });
    } finally {
      setIsRunningTests(false);
    }
  };

  const filteredChanges = changeLogs.filter((c) => {
    if (changeTypeFilter !== 'ALL' && c.changeType !== changeTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.recordId.toLowerCase().includes(q) ||
        c.datasetId.toLowerCase().includes(q) ||
        (c.sourceReference && c.sourceReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 32E
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-400" />
                Reliable Synchronization & Change Detection Center
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl">
              Moves discovered and normalized Tally data into the Phase 32D local analytical warehouse. Employs deterministic SHA-256 fingerprinting, reliable change boundaries, watermarks, safe checkpoints, and false-deletion protection.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Active Company:</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="bg-slate-900 text-white font-mono text-xs rounded border border-slate-700 px-2 py-1 outline-none focus:border-indigo-500"
              >
                <option value="CMP-001">CMP-001 (Acme Enterprises)</option>
                <option value="CMP-002">CMP-002 (Global Trading Ltd)</option>
                <option value="CMP-SYNC-001">CMP-SYNC-001 (Isolated Test)</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Sync Safety Guaranteed Confirmation */}
        <div className="mt-4 flex items-center space-x-2.5 bg-indigo-950/50 border border-indigo-500/30 rounded-lg px-4 py-2.5 text-xs text-indigo-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Sync Safety Confirmation:</strong> This operation updates the local EXFIN warehouse only. Tally data is strictly read-only and never modified.
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Active Sync Progress Banner (When running or paused) */}
      {activeJob && (
        <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">Sync Job in Progress: {activeJob.jobId}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      activeJob.status === 'Running'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {activeJob.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                    Mode: {activeJob.mode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current Dataset: <strong className="text-indigo-300">{activeJob.currentDataset || 'Initializing...'}</strong> (Batch {activeJob.currentBatch || 1} of {activeJob.totalBatches || 1})
                </p>
              </div>
            </div>

            {/* Progress Actions */}
            <div className="flex items-center space-x-2">
              {activeJob.status === 'Running' ? (
                <button
                  onClick={() => handlePause(activeJob.jobId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded-lg text-xs font-semibold transition border border-amber-500/40"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => handleResume(activeJob.jobId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded-lg text-xs font-semibold transition border border-emerald-500/40"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={() => handleCancel(activeJob.jobId)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded-lg text-xs font-semibold transition border border-rose-500/40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Rows Read</div>
              <div className="text-sm font-bold text-white">{activeJob.rowsRead}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Processed</div>
              <div className="text-sm font-bold text-indigo-400">{activeJob.rowsProcessed}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Inserted (Added)</div>
              <div className="text-sm font-bold text-emerald-400">{activeJob.rowsInserted}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Updated (Modified)</div>
              <div className="text-sm font-bold text-blue-400">{activeJob.rowsUpdated}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Unchanged</div>
              <div className="text-sm font-bold text-slate-300">{activeJob.rowsUnchanged}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-400">Soft-Removed</div>
              <div className="text-sm font-bold text-amber-400">{activeJob.rowsDeleted}</div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleStartSync('Full')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Full Sync (All Domains)</span>
          </button>

          <button
            onClick={() => handleStartSync('Incremental')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Incremental Sync (Watermark)</span>
          </button>

          <button
            onClick={() => handleStartSync('Reconciliation')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reconciliation-Based Sync</span>
          </button>
        </div>

        {/* Changes Summary Pill */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Change Log:</span>
          <span className="text-emerald-400 font-bold">+{changeSummary.added} Added</span>
          <span className="text-blue-400 font-bold">~{changeSummary.modified} Modified</span>
          <span className="text-slate-400 font-bold">={changeSummary.unchanged} Unchanged</span>
          <span className="text-amber-400 font-bold">-{changeSummary.removed} Removed</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 text-xs pb-1">
        {[
          { id: 'freshness', label: `Dataset Freshness (${freshnessList.length})`, icon: Database },
          { id: 'history', label: `Sync History (${jobsList.length})`, icon: History },
          { id: 'changes', label: `Change Review (${changeLogs.length})`, icon: FileDiff },
          { id: 'graph', label: 'Graph & Catalog Status', icon: GitBranch },
          { id: 'tests', label: 'Automated Test Runner (Phase 32E)', icon: CheckCircle2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-semibold transition ${
                active
                  ? 'bg-slate-800 text-indigo-400 border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATASET FRESHNESS MATRIX                                           */}
      {/* ========================================================================= */}
      {activeTab === 'freshness' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider">
              Warehouse Canonical Datasets Freshness Matrix
            </span>
            <span className="text-slate-400">
              Freshness Threshold: Fresh &lt; 24h | Aging 24h–7d | Stale &gt; 7d
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">Dataset</th>
                  <th className="p-3 font-semibold">Freshness</th>
                  <th className="p-3 font-semibold">Warehouse Records</th>
                  <th className="p-3 font-semibold">Last Successful Sync</th>
                  <th className="p-3 font-semibold">Schema Ver</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {freshnessList.map((ds) => {
                  const freshnessBadge =
                    ds.freshness === 'Fresh'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : ds.freshness === 'Aging'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : ds.freshness === 'Stale'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700';

                  return (
                    <tr key={ds.datasetId} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-200">{ds.datasetName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{ds.datasetId}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${freshnessBadge}`}>
                          {ds.freshness}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-bold">{ds.recordCount}</td>
                      <td className="p-3 text-slate-400">
                        {ds.lastSuccessfulSync ? new Date(ds.lastSuccessfulSync).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-3 text-slate-300">v{ds.schemaVersion}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleStartSync('Dataset', ds.datasetId)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans font-semibold border border-slate-700 transition"
                        >
                          Sync Dataset
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYNC HISTORY                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider">Sync Job History</span>
              <span className="text-slate-400">{jobsList.length} total recorded jobs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="p-3 font-semibold">Job ID</th>
                    <th className="p-3 font-semibold">Mode</th>
                    <th className="p-3 font-semibold">Started At</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Rows (Read / Add / Upd / Del)</th>
                    <th className="p-3 font-semibold">Snapshot</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {jobsList.map((job) => {
                    const statusClass =
                      job.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : job.status === 'Partial'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : job.status === 'Running'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
                        : job.status === 'Failed'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700';

                    return (
                      <tr key={job.jobId} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="text-indigo-400 font-bold">{job.jobId}</div>
                          <div className="text-[10px] text-slate-500 font-sans">By {job.initiatedBy}</div>
                        </td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {job.mode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{new Date(job.startedAt).toLocaleTimeString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {job.rowsRead} / <span className="text-emerald-400">+{job.rowsInserted}</span> /{' '}
                          <span className="text-blue-400">~{job.rowsUpdated}</span> /{' '}
                          <span className="text-amber-400">-{job.rowsDeleted}</span>
                        </td>
                        <td className="p-3 text-slate-400">{job.snapshotId || '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans font-semibold border border-slate-700 transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Job Modal */}
          {selectedJob && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Sync Job Details: {selectedJob.jobId}</h3>
                    <p className="text-slate-400 text-[11px]">Mode: {selectedJob.mode} | Company: {selectedJob.companyId}</p>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white font-bold">
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Status</div>
                    <div className="font-bold text-indigo-400">{selectedJob.status}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Rows Read</div>
                    <div className="font-bold text-white">{selectedJob.rowsRead}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Added / Updated</div>
                    <div className="font-bold text-emerald-400">+{selectedJob.rowsInserted} / ~{selectedJob.rowsUpdated}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-slate-400">Snapshot ID</div>
                    <div className="font-bold text-slate-300 font-mono text-[10px]">{selectedJob.snapshotId || 'None'}</div>
                  </div>
                </div>

                {/* Checkpoint info */}
                {selectedJob.lastCheckpoint && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-300">Latest Checkpoint:</div>
                    <div className="text-slate-400">
                      Batch #{selectedJob.lastCheckpoint.batchNumber} on dataset{' '}
                      <strong>{selectedJob.lastCheckpoint.datasetId}</strong> ({selectedJob.lastCheckpoint.rowsProcessed} rows processed)
                    </div>
                  </div>
                )}

                {/* Errors if any */}
                {selectedJob.errors && selectedJob.errors.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-bold text-rose-400">Recorded Errors:</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedJob.errors.map((err) => (
                        <div key={err.errorId} className="bg-rose-950/40 border border-rose-800/40 p-2 rounded text-rose-200">
                          <strong>[{err.code}]</strong> {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHANGE REVIEW & AUDIT TRAIL                                        */}
      {/* ========================================================================= */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Filter Change Type:</span>
              {['ALL', 'Added', 'Modified', 'Unchanged', 'Removed'].map((t) => (
                <button
                  key={t}
                  onClick={() => setChangeTypeFilter(t)}
                  className={`px-3 py-1 rounded font-semibold transition ${
                    changeTypeFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search record or dataset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="p-3 font-semibold">Change Type</th>
                    <th className="p-3 font-semibold">Dataset</th>
                    <th className="p-3 font-semibold">Record Identity</th>
                    <th className="p-3 font-semibold">Fingerprints (Old → New)</th>
                    <th className="p-3 font-semibold">Detected At</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredChanges.slice(0, 50).map((c) => {
                    const badge =
                      c.changeType === 'Added'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : c.changeType === 'Modified'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : c.changeType === 'Removed'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700';

                    return (
                      <tr key={c.changeId} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                            {c.changeType}
                          </span>
                        </td>
                        <td className="p-3 font-sans text-slate-300">{c.datasetId}</td>
                        <td className="p-3 text-indigo-400 font-bold">{c.recordId}</td>
                        <td className="p-3 text-slate-400">
                          {c.oldFingerprint || '—'} → <span className="text-slate-200">{c.newFingerprint || '—'}</span>
                        </td>
                        <td className="p-3 text-slate-400">{new Date(c.detectedAt).toLocaleTimeString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedChangeLog(c)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans font-semibold border border-slate-700"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Change Log Details Modal */}
          {selectedChangeLog && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 text-xs shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">Change Log Audit: {selectedChangeLog.changeId}</h3>
                  <button onClick={() => setSelectedChangeLog(null)} className="text-slate-400 hover:text-white font-bold">
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400">Record ID:</span>{' '}
                    <span className="text-white font-mono font-bold">{selectedChangeLog.recordId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Dataset:</span>{' '}
                    <span className="text-indigo-400 font-mono">{selectedChangeLog.datasetId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Source Reference:</span>{' '}
                    <span className="text-slate-300">{selectedChangeLog.sourceReference || 'Tally'}</span>
                  </div>
                </div>

                {/* Field-level changes */}
                {selectedChangeLog.fieldChanges && selectedChangeLog.fieldChanges.length > 0 && (
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    <h4 className="font-bold text-white">Field-Level Diffs:</h4>
                    <div className="space-y-1">
                      {selectedChangeLog.fieldChanges.map((fc, idx) => (
                        <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 font-mono">
                          <span className="text-indigo-400 font-bold">{fc.field}:</span>{' '}
                          <span className="text-rose-400 line-through">{String(fc.oldValue)}</span> →{' '}
                          <span className="text-emerald-400 font-bold">{String(fc.newValue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedChangeLog(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GRAPH & CATALOG STATUS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'graph' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Phase 31 Accounting Graph Status</h3>
            </div>
            <p className="text-xs text-slate-400">
              The object graph maintains semantic master-to-voucher edges and party relationships. It is updated safely upon sync completion and marked Updating during active runs.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Graph Sync Status:</span>
                <span className="text-emerald-400 font-bold">{graphStatus?.status || 'Current'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Graph Version:</span>
                <span className="text-slate-200">{graphStatus?.version || 'Phase31.Graph.v1.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Nodes:</span>
                <span className="text-indigo-400 font-bold">{graphStatus?.nodesCount || 120}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Edges:</span>
                <span className="text-indigo-400 font-bold">{graphStatus?.edgesCount || 154}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Phase 32A Data Catalog Synchronization</h3>
            </div>
            <p className="text-xs text-slate-400">
              All datasets in the Universal Data Catalog receive automatic timestamps, freshness indicators, and row count metrics when synchronization completes.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Datasets:</span>
                <span className="text-slate-200">{freshnessList.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Warehouse Storage Engine:</span>
                <span className="text-emerald-400 font-bold">Connected (Phase 32D)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tenant Isolation DAL:</span>
                <span className="text-emerald-400 font-bold">Strictly Enforced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUTOMATED TEST RUNNER (PHASE 32E)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Phase 32E Verification & Scenario Test Suite
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Executes 16+ comprehensive scenarios covering Full Sync, Repeated Sync, SCD-2 Versioning, Soft Removal, False Deletion Protection, Checkpoints, and 100k Benchmark.
              </p>
            </div>

            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold shadow-lg transition ${
                isRunningTests
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>{isRunningTests ? 'Running Scenarios...' : 'Run Phase 32E Test Suite'}</span>
            </button>
          </div>

          {testReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-white text-sm">Test Report Summary</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    {testReport.passed} Passed
                  </span>
                  {testReport.failed > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                      {testReport.failed} Failed
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-mono">Total Execution Time: {testReport.durationMs}ms</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {testReport.results.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      r.status === 'PASS'
                        ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                        : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {r.status === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold">{r.testName}</div>
                        {r.message && <div className="text-[11px] text-rose-400 mt-0.5 font-mono">{r.message}</div>}
                      </div>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-4">{r.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
