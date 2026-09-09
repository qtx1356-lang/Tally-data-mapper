import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Plus,
  RefreshCw,
  Copy,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Server,
  Sparkles,
  Terminal,
  Settings2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { AutomationJob, JobExecution, SystemAutomationStatus } from '../types/automation';
import { CreateJobWizard } from './CreateJobWizard';

interface AutomationViewProps {
  selectedCompany?: any;
}

export const AutomationView: React.FC<AutomationViewProps> = ({ selectedCompany }) => {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemAutomationStatus | null>(null);
  const [history, setHistory] = useState<JobExecution[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<JobExecution | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Jobs & System Status
  const loadData = () => {
    setIsRefreshing(true);
    Promise.all([
      fetch('/api/automation/jobs').then((res) => res.json()),
      fetch('/api/automation/system-status').then((res) => res.json()),
      fetch('/api/automation/history').then((res) => res.json())
    ])
      .then(([jobsData, statusData, historyData]) => {
        if (Array.isArray(jobsData)) setJobs(jobsData);
        if (statusData) setSystemStatus(statusData);
        if (Array.isArray(historyData)) setHistory(historyData);
      })
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleToggleJob = (id: string) => {
    fetch(`/api/automation/jobs/${id}/toggle`, { method: 'POST' })
      .then((res) => res.json())
      .then(() => loadData());
  };

  const handleRunNow = (id: string) => {
    fetch(`/api/automation/jobs/${id}/run-now`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        loadData();
        if (data.execution) {
          setSelectedExecution(data.execution);
        }
      });
  };

  const handleDuplicateJob = (id: string) => {
    fetch('/api/automation/jobs/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
      .then((res) => res.json())
      .then(() => loadData());
  };

  const handleDeleteJob = (id: string) => {
    if (confirm('Are you sure you want to delete this automation job?')) {
      fetch(`/api/automation/jobs/${id}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then(() => loadData());
    }
  };

  const handleInstallTaskScheduler = (jobId: string) => {
    fetch('/api/automation/task-scheduler/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    })
      .then((res) => res.json())
      .then(() => loadData());
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'Enabled') return j.isEnabled;
    if (filter === 'Disabled') return !j.isEnabled;
    if (filter === 'Running') return j.status === 'Running';
    if (filter === 'Failed') return j.status === 'Failed' || j.status === 'CompanyMismatch';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'Running':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center space-x-1 animate-pulse">
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'Enabled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Enabled
          </span>
        );
      case 'Disabled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
            Disabled
          </span>
        );
      case 'CompanyMismatch':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Company Mismatch</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center space-x-1">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & System Engine Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black text-slate-100 tracking-wide flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>AUTOMATION ENGINE & SCHEDULED EXPORTS</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center space-x-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine Active (Windows Service)</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Phase 7 — Automated execution of saved output mappings and export profiles with company safety guardrails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh Automation State"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>NEW AUTOMATION JOB</span>
          </button>
        </div>
      </div>

      {/* System Status Metrics Bar */}
      {systemStatus && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Scheduled Jobs</p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">{systemStatus.activeJobsCount}</p>
              <p className="text-[10px] text-slate-500 mt-1">Total configured: {jobs.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Next Scheduled Run</p>
              <p className="text-xs font-bold text-emerald-400 mt-1 truncate max-w-[170px]">
                {systemStatus.nextJobName || 'No jobs scheduled'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {systemStatus.nextJobTime ? new Date(systemStatus.nextJobTime).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Task Scheduler Integration</p>
              <p className="text-xs font-bold text-slate-200 mt-1">
                {systemStatus.taskSchedulerInstalled ? 'Windows Task Installed' : 'Local App Scheduler'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">CLI: --run-job &lt;id&gt;</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Failed / Mismatch Count</p>
              <p className={`text-2xl font-black mt-0.5 ${systemStatus.failedJobsCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {systemStatus.failedJobsCount}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Safety aborts recorded</p>
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
              systemStatus.failedJobsCount > 0
                ? 'bg-rose-950 border-rose-800 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Filter Tabs & Jobs ASCII Grid Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Table Filter Tabs */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex space-x-1">
            {['All', 'Enabled', 'Disabled', 'Running', 'Failed'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === t
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </span>
        </div>

        {/* Automation Jobs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Job Name / Description</th>
                <th className="py-3 px-4">Company Binding</th>
                <th className="py-3 px-4">Schedule Rules</th>
                <th className="py-3 px-4">Last Run / Next Run</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
              {filteredJobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleJob(j.id)}
                      className={`w-8 h-4.5 rounded-full transition p-0.5 border ${
                        j.isEnabled ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-800 border-slate-700'
                      }`}
                      title={j.isEnabled ? 'Disable Job' : 'Enable Job'}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-slate-950 transition transform ${
                          j.isEnabled ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-100">{j.name}</p>
                      <p className="text-[11px] text-slate-400 max-w-xs truncate">{j.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded font-mono">
                          {j.mappingName || j.mappingId}
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                          {j.exportProfileName || j.exportProfileId}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-slate-200">{j.companyName}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-slate-200 font-mono">
                        {j.schedule.type} {j.schedule.time ? `@ ${j.schedule.time}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {j.schedule.daysOfWeek ? `Days: ${j.schedule.daysOfWeek.join(',')}` : 'All Days'}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div>
                      <p className="text-slate-400">
                        Last: {j.lastRunAt ? new Date(j.lastRunAt).toLocaleTimeString() : 'Never'}
                      </p>
                      <p className="text-emerald-400">
                        Next: {j.nextRunAt ? new Date(j.nextRunAt).toLocaleString() : 'Disabled'}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4">{getStatusBadge(j.status)}</td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleRunNow(j.id)}
                        disabled={j.status === 'Running'}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-[11px] font-bold rounded flex items-center space-x-1 transition disabled:opacity-50"
                        title="Run Immediately"
                      >
                        <Play className="w-3 h-3 fill-emerald-400" />
                        <span>Run Now</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateJob(j.id)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        title="Duplicate Job"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleInstallTaskScheduler(j.id)}
                        className={`p-1 rounded border transition ${
                          j.taskSchedulerInstalled
                            ? 'bg-indigo-950 border-indigo-800 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Install into Windows Task Scheduler"
                      >
                        <Server className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteJob(j.id)}
                        className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded border border-slate-700 transition"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No automation jobs match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Logs / Audit History Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>RECENT AUTOMATION EXECUTION HISTORY & STRUCTURED LOGS</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">{history.length} records in audit trail</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {history.map((exec) => (
            <div
              key={exec.id}
              onClick={() => setSelectedExecution(exec)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-700 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {exec.status === 'Completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : exec.status === 'CompanyMismatch' ? (
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-200">{exec.jobName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{exec.companyName}]</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Path: {exec.destinationPath} • {exec.recordsWritten.toLocaleString()} rows • Duration: {(exec.durationMs / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block">
                  {new Date(exec.startedAt).toLocaleTimeString()}
                </span>
                {getStatusBadge(exec.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Execution Structured Logs Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Execution Log — {selectedExecution.jobName}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedExecution.id} • Target: {selectedExecution.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 max-h-80 overflow-y-auto space-y-1">
              {selectedExecution.logs?.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span>Records Processed: {selectedExecution.recordsWritten.toLocaleString()}</span>
              <span>SHA-256 Hash Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Wizard Dialog */}
      {showWizard && (
        <CreateJobWizard
          selectedCompany={selectedCompany}
          onClose={() => setShowWizard(false)}
          onJobSaved={() => {
            setShowWizard(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
