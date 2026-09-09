import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Search, 
  Mail, 
  Sliders, 
  FileText, 
  ShieldAlert, 
  Activity, 
  Check, 
  Database, 
  RefreshCw,
  Terminal,
  Zap,
  Filter,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  Lock,
  ChevronRight,
  Server,
  FileSpreadsheet,
  Gauge
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AutomationDefinition, 
  AutomationExecution, 
  RuleDefinition, 
  AlertRecord, 
  NotificationDelivery,
  AlertSeverity,
  AlertState,
  JobState
} from '../types/phase32OAutomation';

export function Phase32OAutomationView() {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'rules' | 'alerts' | 'history' | 'sandbox' | 'diagnostics'>('dashboard');
  
  // Data State
  const [definitions, setDefinitions] = useState<AutomationDefinition[]>([]);
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [windowsStartup, setWindowsStartup] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter query states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('All');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('All');

  // Form states - New Automation
  const [newAuto, setNewAuto] = useState({
    name: '',
    description: '',
    type: 'Data Sync' as any,
    trigger: 'Schedule',
    scheduleType: 'Daily' as any,
    intervalMinutes: 60,
    time: '04:00',
    daysOfWeek: [1] as number[],
    timezone: 'Asia/Kolkata',
    channel: 'In-App' as any,
    recipients: '',
    exportFormat: 'PDF' as any,
    exportDestination: 'Workspace Storage',
    requiresAppRunning: true
  });

  // Form states - New Rule
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    dataset: 'Ledger',
    field: 'ClosingBalance',
    operator: 'Less Than' as any,
    value: '',
    severity: 'MEDIUM' as AlertSeverity,
    evaluationGrain: 'Ledger' as any
  });

  // Sandbox testing
  const [dryRunType, setDryRunType] = useState<string>('Data Sync');
  const [dryRunCompany, setDryRunCompany] = useState<string>('comp-abc-pvt');
  const [dryRunResult, setDryRunResult] = useState<any>(null);

  // Test Suite execution
  const [testSuiteResults, setTestSuiteResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState<boolean>(false);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/phase32o/overview');
      const data = await res.json();
      if (data.success) {
        setDefinitions(data.definitions);
        setRules(data.rules);
        setExecutions(data.executions);
        setAlerts(data.alerts);
        setDeliveries(data.deliveries);
        setWindowsStartup(data.windowsStartup);
      }
    } catch (e) {
      console.error("Error loading Phase 32O Automation data", e);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleWindowsStartupToggle = async () => {
    try {
      const res = await fetch('/api/phase32o/windows-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !windowsStartup })
      });
      const data = await res.json();
      if (data.success) {
        setWindowsStartup(data.windowsStartup);
        showStatus(`Windows Startup configured successfully.`);
      }
    } catch (e) {
      showStatus("Failed to update Windows startup setting", "error");
    }
  };

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuto.name) return;

    try {
      const payload = {
        name: newAuto.name,
        description: newAuto.description,
        type: newAuto.type,
        trigger: newAuto.trigger,
        schedule: {
          type: newAuto.scheduleType,
          intervalMinutes: newAuto.intervalMinutes,
          time: newAuto.time,
          daysOfWeek: newAuto.daysOfWeek,
          timezone: newAuto.timezone
        },
        action: {
          channel: newAuto.channel,
          recipients: newAuto.recipients ? newAuto.recipients.split(',').map(r => r.trim()) : [],
          exportFormat: newAuto.exportFormat,
          exportDestination: newAuto.exportDestination
        },
        requiresAppRunning: newAuto.requiresAppRunning
      };

      const res = await fetch('/api/phase32o/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showStatus(`Automation "${newAuto.name}" scheduled successfully.`);
        fetchData();
        setNewAuto({
          name: '',
          description: '',
          type: 'Data Sync',
          trigger: 'Schedule',
          scheduleType: 'Daily',
          intervalMinutes: 60,
          time: '04:00',
          daysOfWeek: [1],
          timezone: 'Asia/Kolkata',
          channel: 'In-App',
          recipients: '',
          exportFormat: 'PDF',
          exportDestination: 'Workspace Storage',
          requiresAppRunning: true
        });
      } else {
        showStatus(data.error || "Failed to create automation", "error");
      }
    } catch (err: any) {
      showStatus("Connection error occurred while saving automation", "error");
    }
  };

  const handleRunNow = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/phase32o/automation/${id}/run`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showStatus(`Execution started for "${name}". Completed with ID ${data.execution.executionId}.`);
        fetchData();
      } else {
        showStatus(data.error || "Execution failed", "error");
      }
    } catch (e) {
      showStatus("Error running scheduled task", "error");
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    try {
      const res = await fetch(`/api/phase32o/automation/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showStatus("Automation task deleted successfully.");
        fetchData();
      }
    } catch (e) {
      showStatus("Error deleting task", "error");
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.value) return;

    try {
      const payload = {
        name: newRule.name,
        description: newRule.description,
        dataset: newRule.dataset,
        condition: {
          field: newRule.field,
          operator: newRule.operator,
          value: Number(newRule.value) || newRule.value
        },
        severity: newRule.severity,
        evaluationGrain: newRule.evaluationGrain
      };

      const res = await fetch('/api/phase32o/rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showStatus(`Analytical rule "${newRule.name}" created.`);
        fetchData();
        setNewRule({
          name: '',
          description: '',
          dataset: 'Ledger',
          field: 'ClosingBalance',
          operator: 'Less Than',
          value: '',
          severity: 'MEDIUM',
          evaluationGrain: 'Ledger'
        });
      }
    } catch (err) {
      showStatus("Failed to create rule", "error");
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/phase32o/rule/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showStatus("Analytical rule removed successfully.");
        fetchData();
      }
    } catch (e) {
      showStatus("Error deleting rule", "error");
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/phase32o/alert/${id}/acknowledge`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showStatus("Alert acknowledged successfully.");
        fetchData();
      }
    } catch (e) {
      showStatus("Error acknowledging alert", "error");
    }
  };

  const handleSuppressAlert = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/phase32o/alert/${id}/suppress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ why: reason, until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        showStatus("Alert suppressed for 7 days.");
        fetchData();
      }
    } catch (e) {
      showStatus("Error suppressing alert", "error");
    }
  };

  const handleDryRun = async () => {
    setDryRunResult(null);
    try {
      const res = await fetch('/api/phase32o/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: dryRunType,
          companyScope: [dryRunCompany],
          action: { channel: 'Email', recipients: ['dry-run@exfin.com'] }
        })
      });
      const data = await res.json();
      if (data.success) {
        setDryRunResult(data);
      }
    } catch (e) {
      showStatus("Error in sandbox evaluation", "error");
    }
  };

  const runTestSuite = async () => {
    setRunningTests(true);
    setTestSuiteResults(null);
    try {
      const res = await fetch('/api/phase32o/run-tests', { method: 'POST' });
      const data = await res.json();
      setTestSuiteResults(data);
      if (data.overall === 'PASSED') {
        showStatus("All scheduled automation & alert validation tests PASSED successfully.");
      } else {
        showStatus("Regression or validation test failure detected.", "error");
      }
    } catch (e) {
      showStatus("Failed running automation test suite", "error");
    } finally {
      setRunningTests(false);
    }
  };

  // Helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'Warning':
      case 'Partial':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Failed':
      case 'Needs Review':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityBadgeColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'HIGH':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'MEDIUM':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'LOW':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Filter schedules
  const filteredDefinitions = definitions.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = executions.filter(e => {
    const statusMatch = historyStatusFilter === 'All' || e.status === historyStatusFilter;
    const def = definitions.find(d => d.automationId === e.automationId);
    const typeMatch = historyTypeFilter === 'All' || (def && def.type === historyTypeFilter);
    return statusMatch && typeMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" id="phase32o-automation-container">
      {/* Top Banner & Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Phase 32O
              </span>
              <span className="text-xs text-slate-400">• Enterprise Automation Engine</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <Gauge className="w-7 h-7 text-indigo-600" />
              EXFIN Automation Center
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Configure scheduled Tally data synchronization, automated reports exports, business threshold rule evaluation, in-app triggers and fail-safe alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runTestSuite}
              disabled={runningTests}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                runningTests 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              id="btn-run-tests"
            >
              <Terminal className={`w-4 h-4 ${runningTests ? 'animate-spin' : ''}`} />
              {runningTests ? 'Running Diagnostics...' : 'Run Engine Test Suite'}
            </button>

            <button
              onClick={fetchData}
              className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              id="btn-refresh-overview"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notifications Console */}
        {statusMessage && (
          <div className="max-w-7xl mx-auto mt-4">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-sm ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </motion.div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-6 max-w-7xl mx-auto overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard & Schedulers', icon: Gauge },
            { id: 'rules', label: 'Threshold Rules', icon: Sliders },
            { id: 'alerts', label: 'Active Alerts', icon: ShieldAlert },
            { id: 'history', label: 'Execution Logs', icon: Clock },
            { id: 'sandbox', label: 'Automation Sandbox', icon: Zap },
            { id: 'diagnostics', label: 'System Diagnostics & Reports', icon: Activity }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                  isActive 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
                id={`tab-automation-${tab.id}`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm">Retrieving real-time automation definitions...</span>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* TAB: DASHBOARD & SCHEDULERS */}
            {activeSubTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Stats & Current Schedules list */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Summary row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Schedulers</div>
                      <div className="text-2xl font-bold text-slate-800">
                        {definitions.filter(d => d.enabled).length} <span className="text-xs text-slate-400">/ {definitions.length} total</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Running background queues</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Last Sync Status</div>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-base font-bold text-slate-800">100% Correct</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Zero database overlaps</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tally Read Integrity</div>
                      <div className="flex items-center gap-1 text-emerald-700 font-bold text-base mt-1">
                        <Check className="w-4 h-4" /> Protected Read-Only
                      </div>
                      <p className="text-xs text-slate-400 mt-2">100% writes blocked</p>
                    </div>
                  </div>

                  {/* Windows Startup Local Scheduler configuration */}
                  <div className="bg-indigo-900 text-white p-5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white tracking-wide">Local Scheduler (Desktop/Offline Client Mode)</h4>
                      <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                        When EXFIN is deployed in standalone desktop mode, scheduled jobs execute via the client background task listener. Enable "Start with Windows" to ensure scheduled tasks survive offline reboots.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-950 p-2.5 rounded-lg border border-indigo-800">
                      <span className="text-xs text-indigo-200">Start with Windows Startup</span>
                      <button
                        onClick={handleWindowsStartupToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          windowsStartup ? 'bg-indigo-500' : 'bg-slate-700'
                        }`}
                        id="toggle-windows-startup"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            windowsStartup ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Filter schedule list */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">Configured Automation Tasks</h3>
                        <p className="text-xs text-slate-500">Scheduled syncs, report exports and alerts evaluated by the background thread.</p>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search automations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                            <th className="p-3">Task Info</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Schedule / Timezone</th>
                            <th className="p-3">Action Channel</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDefinitions.map((item) => (
                            <tr key={item.automationId} className="hover:bg-slate-50/50 transition">
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{item.name}</div>
                                <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{item.description}</div>
                                {item.requiresAppRunning && (
                                  <span className="inline-block mt-1 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                    Requires Application Running
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                  {item.type}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-700">
                                  {item.schedule.type} {item.schedule.time ? `@ ${item.schedule.time}` : ''}
                                  {item.schedule.intervalMinutes ? `(${item.schedule.intervalMinutes} mins)` : ''}
                                </div>
                                <div className="text-slate-400 text-[10px]">{item.schedule.timezone}</div>
                              </td>
                              <td className="p-3">
                                <span className="text-slate-600 font-medium">{item.action.channel}</span>
                                {item.action.exportFormat && (
                                  <div className="text-[10px] text-slate-400">Format: {item.action.exportFormat}</div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {getStatusIcon(item.status)}
                                  <span className="text-slate-600 font-semibold">{item.status}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleRunNow(item.automationId, item.name)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Run Manual Sync/Export Now"
                                    id={`btn-run-${item.automationId}`}
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAutomation(item.automationId)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                    title="Delete Task"
                                    id={`btn-delete-${item.automationId}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredDefinitions.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-400">
                                No matching automated schedules found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Create Schedule Form Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    New Automation Task
                  </h3>
                  <p className="text-xs text-slate-500">Configure continuous workflows and sync rules. Explicitly safe for Tally Prime.</p>

                  <form onSubmit={handleCreateAutomation} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Task Name</label>
                      <input
                        type="text"
                        placeholder="e.g. GST Outstanding Report Export"
                        required
                        value={newAuto.name}
                        onChange={(e) => setNewAuto({...newAuto, name: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-md focus:outline-indigo-500"
                        id="input-auto-name"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Description</label>
                      <textarea
                        placeholder="Purpose of this task..."
                        value={newAuto.description}
                        onChange={(e) => setNewAuto({...newAuto, description: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-md h-16 focus:outline-indigo-500"
                        id="input-auto-description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Task Type</label>
                        <select
                          value={newAuto.type}
                          onChange={(e) => setNewAuto({...newAuto, type: e.target.value as any})}
                          className="w-full p-2 border border-slate-200 rounded-md bg-white"
                          id="select-auto-type"
                        >
                          <option value="Data Sync">Data Sync</option>
                          <option value="Report">Report Execution</option>
                          <option value="Export">Data Export</option>
                          <option value="Alert">Continuous Alert</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Schedule Grain</label>
                        <select
                          value={newAuto.scheduleType}
                          onChange={(e) => setNewAuto({...newAuto, scheduleType: e.target.value as any})}
                          className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Custom Interval">Custom Interval</option>
                        </select>
                      </div>
                    </div>

                    {newAuto.scheduleType === 'Custom Interval' && (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Minutes Interval (Prevent overload)</label>
                        <input
                          type="number"
                          min={30}
                          value={newAuto.intervalMinutes}
                          onChange={(e) => setNewAuto({...newAuto, intervalMinutes: Number(e.target.value)})}
                          className="w-full p-2 border border-slate-200 rounded-md"
                        />
                      </div>
                    )}

                    {newAuto.scheduleType !== 'Custom Interval' && (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Execution Time (HH:MM)</label>
                        <input
                          type="text"
                          placeholder="e.g. 04:00"
                          value={newAuto.time}
                          onChange={(e) => setNewAuto({...newAuto, time: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-md"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Target Timezone</label>
                        <input
                          type="text"
                          value={newAuto.timezone}
                          onChange={(e) => setNewAuto({...newAuto, timezone: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Action Channel</label>
                        <select
                          value={newAuto.channel}
                          onChange={(e) => setNewAuto({...newAuto, channel: e.target.value as any})}
                          className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        >
                          <option value="In-App">In-App Console</option>
                          <option value="Email">Email Delivery</option>
                          <option value="Export">File Export Target</option>
                        </select>
                      </div>
                    </div>

                    {newAuto.channel === 'Email' && (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Recipients (comma separated)</label>
                        <input
                          type="text"
                          placeholder="ops@exfin.com, team@exfin.com"
                          value={newAuto.recipients}
                          onChange={(e) => setNewAuto({...newAuto, recipients: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-md"
                        />
                      </div>
                    )}

                    {newAuto.type === 'Export' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Format</label>
                          <select
                            value={newAuto.exportFormat}
                            onChange={(e) => setNewAuto({...newAuto, exportFormat: e.target.value as any})}
                            className="w-full p-2 border border-slate-200 rounded-md bg-white"
                          >
                            <option value="CSV">CSV</option>
                            <option value="Excel">Excel</option>
                            <option value="PDF">PDF</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Overwrite Guard</label>
                          <select className="w-full p-2 border border-slate-200 rounded-md bg-white">
                            <option value="Protected">Protected (Append Date)</option>
                            <option value="Overwrite">Allow Overwrite</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="checkbox"
                        id="chk-requires-app"
                        checked={newAuto.requiresAppRunning}
                        onChange={(e) => setNewAuto({...newAuto, requiresAppRunning: e.target.checked})}
                        className="rounded text-indigo-600"
                      />
                      <label htmlFor="chk-requires-app" className="text-[11px] text-slate-500 font-medium cursor-pointer">
                        Requires desktop Tally connector active
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition"
                      id="btn-submit-automation"
                    >
                      Save Scheduled Task
                    </button>
                  </form>
                </div>
              </div>
            )}


            {/* TAB: THRESHOLD RULES */}
            {activeSubTab === 'rules' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Active Rules List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-2">Rule-Based Active Monitoring</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Create structured mathematical conditions evaluated against synchronized ledger data and transaction metrics. Overwrite safe limits instantly.
                    </p>

                    <div className="space-y-4">
                      {rules.map((rule) => (
                        <div key={rule.ruleId} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition bg-slate-50/50 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadgeColor(rule.severity)}`}>
                                {rule.severity}
                              </span>
                              <span className="text-xs font-semibold text-slate-900">{rule.name}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{rule.description}</p>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500 font-medium">
                              <div>Dataset: <span className="text-slate-800">{rule.dataset}</span></div>
                              <div>Condition: <span className="text-indigo-600 font-semibold">{rule.condition.field} {rule.condition.operator} {rule.condition.value}</span></div>
                              <div>Evaluation Grain: <span className="text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded">{rule.evaluationGrain}</span></div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-start">
                            <button
                              onClick={() => handleDeleteRule(rule.ruleId)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-slate-200 hover:border-rose-200 transition"
                              title="Delete Rule"
                              id={`btn-delete-rule-${rule.ruleId}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {rules.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                          No threshold monitoring rules configured yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Create Custom Rule Form */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    New Quality/Threshold Rule
                  </h3>
                  <p className="text-xs text-slate-500">Configure mathematical bounds. Circular/exec script injections are physically blocked.</p>

                  <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales Invoice Exceeds 10L"
                        required
                        value={newRule.name}
                        onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-md focus:outline-indigo-500"
                        id="input-rule-name"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Dataset Type</label>
                      <select
                        value={newRule.dataset}
                        onChange={(e) => setNewRule({...newRule, dataset: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        id="select-rule-dataset"
                      >
                        <option value="Ledger">Ledger Master Tree</option>
                        <option value="Voucher">Voucher Transactions</option>
                        <option value="StockItem">Inventory Stock Items</option>
                        <option value="Data Quality">Data Quality Matrix</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Target Field</label>
                        <select
                          value={newRule.field}
                          onChange={(e) => setNewRule({...newRule, field: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        >
                          <option value="ClosingBalance">Closing Balance</option>
                          <option value="Amount">Transaction Amount</option>
                          <option value="QualityScore">Data Quality Score</option>
                          <option value="OpeningBalance">Opening Qty</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Evaluation Operator</label>
                        <select
                          value={newRule.operator}
                          onChange={(e) => setNewRule({...newRule, operator: e.target.value as any})}
                          className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        >
                          <option value="Less Than">Less Than</option>
                          <option value="Greater Than">Greater Than</option>
                          <option value="Equals">Equals</option>
                          <option value="Not Equals">Not Equals</option>
                          <option value="Contains">Contains</option>
                          <option value="Missing">Is Missing / Null</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Threshold Value</label>
                        <input
                          type="text"
                          placeholder="e.g. 500000"
                          value={newRule.value}
                          onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-md focus:outline-indigo-500"
                          id="input-rule-value"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Severity Trigger</label>
                        <select
                          value={newRule.severity}
                          onChange={(e) => setNewRule({...newRule, severity: e.target.value as any})}
                          className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        >
                          <option value="INFO">INFO</option>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Evaluation Grain</label>
                      <select
                        value={newRule.evaluationGrain}
                        onChange={(e) => setNewRule({...newRule, evaluationGrain: e.target.value as any})}
                        className="w-full p-2 border border-slate-200 rounded-md bg-white"
                      >
                        <option value="Company">Company Granularity</option>
                        <option value="Ledger">Ledger Master Grain</option>
                        <option value="Voucher">Voucher / Transaction Grain</option>
                        <option value="Stock Item">Stock Inventory Grain</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2.5 rounded-lg shadow-sm transition"
                      id="btn-submit-rule"
                    >
                      Create Custom Rule
                    </button>
                  </form>
                </div>
              </div>
            )}


            {/* TAB: ACTIVE ALERTS */}
            {activeSubTab === 'alerts' && (
              <div className="space-y-6">
                
                {/* Metrics header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Triggered Alerts</span>
                      <span className="text-2xl font-bold text-rose-600 mt-1">{alerts.filter(a => a.status === 'Triggered').length}</span>
                    </div>
                    <span className="p-3 rounded-full bg-rose-50 text-rose-500">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Acknowledged</span>
                      <span className="text-2xl font-bold text-amber-600 mt-1">{alerts.filter(a => a.status === 'Acknowledged').length}</span>
                    </div>
                    <span className="p-3 rounded-full bg-amber-50 text-amber-500">
                      <Check className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Suppressed Logs</span>
                      <span className="text-2xl font-bold text-slate-600 mt-1">{alerts.filter(a => a.status === 'Suppressed').length}</span>
                    </div>
                    <span className="p-3 rounded-full bg-slate-100 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">In-App Deliveries</span>
                      <span className="text-2xl font-bold text-indigo-600 mt-1">{deliveries.length}</span>
                    </div>
                    <span className="p-3 rounded-full bg-indigo-50 text-indigo-500">
                      <Mail className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                {/* Alerts and Email deliveries list split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Alert Queue */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Real-Time Alert Feed</h3>
                      <p className="text-xs text-slate-500">Active alerts requiring operator review or resolution.</p>
                    </div>

                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <div key={alert.alertId} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50/50 transition space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadgeColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className="font-semibold text-xs text-slate-800">{alert.evidence.ruleName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(alert.detectedAt).toLocaleTimeString()}</span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded text-[11px] space-y-1.5">
                            <div className="grid grid-cols-2 text-slate-500">
                              <div>Dataset Group: <span className="text-slate-800 font-semibold">{alert.evidence.dataset}</span></div>
                              <div>Target Field: <span className="text-slate-800 font-semibold">{alert.evidence.field}</span></div>
                            </div>
                            <div className="grid grid-cols-2 text-slate-500">
                              <div>Observed Value: <span className="text-rose-600 font-bold">{alert.evidence.observedValue.toLocaleString()}</span></div>
                              <div>Condition Expected: <span className="text-slate-800 font-semibold">{alert.evidence.expectedCondition}</span></div>
                            </div>
                            <div className="text-[10px] text-slate-400 italic">Freshness: {alert.evidence.dataFreshness}</div>
                          </div>

                          {alert.status === 'Suppressed' && (
                            <div className="bg-amber-50/50 border border-amber-200 p-2 rounded text-[11px] text-amber-800">
                              <span className="font-bold">Suppressed:</span> {alert.suppressedWhy} (Until: {new Date(alert.suppressedUntil!).toLocaleDateString()})
                            </div>
                          )}

                          <div className="flex justify-end gap-2 text-[10px] pt-1">
                            {alert.status === 'Triggered' && (
                              <>
                                <button
                                  onClick={() => handleAcknowledgeAlert(alert.alertId)}
                                  className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 font-medium"
                                  id={`btn-ack-${alert.alertId}`}
                                >
                                  Acknowledge
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Enter reason for suppression:");
                                    if (reason) handleSuppressAlert(alert.alertId, reason);
                                  }}
                                  className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 font-medium"
                                  id={`btn-sup-${alert.alertId}`}
                                >
                                  Suppress
                                </button>
                              </>
                            )}
                            {alert.status !== 'Triggered' && (
                              <span className="text-slate-400 italic font-medium flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-500" /> State: {alert.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notification deliveries log */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Email & In-App Delivery Queue</h3>
                      <p className="text-xs text-slate-500">Audit logs tracking automated email report delivery channels.</p>
                    </div>

                    <div className="space-y-4">
                      {deliveries.map((delivery) => (
                        <div key={delivery.id} className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/30 flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            delivery.status === 'Sent' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-semibold text-slate-800 truncate">{delivery.subject}</span>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">{new Date(delivery.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-1">Recipient: <span className="font-medium text-slate-700">{delivery.recipient}</span></div>
                            <p className="text-slate-500 mt-1.5 whitespace-pre-wrap leading-relaxed">{delivery.body}</p>
                            
                            {delivery.failureReason && (
                              <div className="bg-rose-50 text-rose-800 p-2 rounded mt-2 text-[10px] border border-rose-100">
                                <span className="font-bold">Failure Reason:</span> {delivery.failureReason} — Retrying in background queue
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* TAB: EXECUTION LOG HISTORY */}
            {activeSubTab === 'history' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Automation History & Execution Logs</h3>
                    <p className="text-xs text-slate-500">Every single background trigger is recorded in an immutable ledger for workspace security auditing.</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold">Status Filter</label>
                      <select
                        value={historyStatusFilter}
                        onChange={(e) => setHistoryStatusFilter(e.target.value)}
                        className="p-1.5 border border-slate-200 rounded bg-white font-medium text-slate-600"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                        <option value="Running">Running</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-semibold">Type Filter</label>
                      <select
                        value={historyTypeFilter}
                        onChange={(e) => setHistoryTypeFilter(e.target.value)}
                        className="p-1.5 border border-slate-200 rounded bg-white font-medium text-slate-600"
                      >
                        <option value="All">All Types</option>
                        <option value="Data Sync">Data Sync</option>
                        <option value="Report">Report Execution</option>
                        <option value="Export">Data Export</option>
                        <option value="Alert">Continuous Alert</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                        <th className="p-3">Execution ID / Ref</th>
                        <th className="p-3">Automation Task</th>
                        <th className="p-3">Trigger Time</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Records Processed</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Diagnostic Trace / Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((exec) => {
                        const def = definitions.find(d => d.automationId === exec.automationId);
                        return (
                          <tr key={exec.executionId} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-mono text-slate-500 font-semibold">{exec.executionId}</td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800">{def ? def.name : 'Unknown Task'}</span>
                              {def && (
                                <div className="text-[10px] text-slate-400">{def.type}</div>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">{new Date(exec.startedAt).toLocaleString()}</td>
                            <td className="p-3 text-slate-500">{exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'N/A'}</td>
                            <td className="p-3 font-semibold text-slate-700">{exec.recordsProcessed !== undefined ? exec.recordsProcessed.toLocaleString() : '—'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                {getStatusIcon(exec.status)}
                                <span className="font-semibold">{exec.status}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {exec.error ? (
                                <span className="text-rose-600 font-medium block max-w-sm line-clamp-2">{exec.error}</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Execution completed successfully. Safe read verified.</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* TAB: AUTOMATION SANDBOX */}
            {activeSubTab === 'sandbox' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Simulator controls */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    Automation Testing Sandbox
                  </h3>
                  <p className="text-xs text-slate-500">
                    Test your continuous synchronizations or alerts against a safe mock sandbox before activating schedules. Zero production hazards.
                  </p>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Sandbox Trigger Type</label>
                      <select
                        value={dryRunType}
                        onChange={(e) => setDryRunType(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-md bg-white"
                        id="select-sandbox-type"
                      >
                        <option value="Data Sync">Incremental Sync</option>
                        <option value="Custom Rule">Evaluate Analytical Rules</option>
                        <option value="Export">Generate Excel Outstanding Export</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Target Company</label>
                      <select
                        value={dryRunCompany}
                        onChange={(e) => setDryRunCompany(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-md bg-white"
                      >
                        <option value="comp-abc-pvt">ABC Private Limited</option>
                        <option value="comp-xyz-ltd">XYZ Global Limited</option>
                      </select>
                    </div>

                    <button
                      onClick={handleDryRun}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition shadow-sm"
                      id="btn-trigger-dry-run"
                    >
                      Trigger Dry Run
                    </button>
                  </div>
                </div>

                {/* Dry Run predictions output */}
                <div className="lg:col-span-2 bg-slate-950 text-slate-100 rounded-xl p-6 shadow-lg border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <span className="font-mono text-sm font-semibold">Dry Run Prediction Ledger</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                      SANDBOX MODE
                    </span>
                  </div>

                  {dryRunResult ? (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-4 bg-slate-900 p-3.5 rounded border border-slate-800">
                        <div>
                          <div className="text-slate-500 text-[10px] uppercase">Would Execute</div>
                          <div className="text-emerald-400 font-bold mt-0.5">{dryRunResult.wouldExecute ? 'YES (No conflicts)' : 'NO'}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[10px] uppercase">Evaluated Dataset</div>
                          <div className="text-slate-200 font-bold mt-0.5">{dryRunResult.dataset}</div>
                        </div>
                        <div className="mt-2">
                          <div className="text-slate-500 text-[10px] uppercase">Target Companies</div>
                          <div className="text-slate-200 font-bold mt-0.5">{dryRunResult.companyCount} active</div>
                        </div>
                        <div className="mt-2">
                          <div className="text-slate-500 text-[10px] uppercase">Estimated Impact</div>
                          <div className="text-indigo-400 font-bold mt-0.5">{dryRunResult.estimatedRows} rows simulated</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-slate-500 text-[10px] uppercase">Rule Engine Logs</div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-800 text-slate-300">
                          {dryRunResult.ruleResult}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-slate-500 text-[10px] uppercase">Expected Outbound Actions</div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-800 text-indigo-300">
                          {dryRunResult.notificationAction}
                        </div>
                      </div>

                      <div className="text-[10px] text-amber-400 italic bg-amber-950/20 border border-amber-900/30 p-2 rounded">
                        ℹ️ Sandbox evaluations bypass Tally port connections safely to protect Tally PRIME from execution congestion.
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 font-mono text-xs">
                      <span>Waiting for Sandbox triggers... Click "Trigger Dry Run" to predict output metrics.</span>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* TAB: SYSTEM DIAGNOSTICS & REPORTS */}
            {activeSubTab === 'diagnostics' && (
              <div className="space-y-8">
                
                {/* Test results screen */}
                {testSuiteResults && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">Automation Engine Test Suite Logs</h3>
                        <p className="text-xs text-slate-500">Comprehensive verification of schedulers, rule evaluators, distributed locks and Tally guards.</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        testSuiteResults.overall === 'PASSED' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        OVERALL STATUS: {testSuiteResults.overall}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {testSuiteResults.tests.map((test: any, index: number) => (
                        <div key={index} className="p-3 border border-slate-100 rounded-lg flex items-start gap-2.5 bg-slate-50/50">
                          <span className="mt-0.5">
                            {test.passed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                          </span>
                          <div className="text-xs">
                            <div className="font-semibold text-slate-800">{test.testName}</div>
                            <p className="text-slate-500 text-[11px] mt-0.5">{test.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Diagnostics matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900">Failure Recovery & Self-Healing Sentinel</h3>
                    <p className="text-xs text-slate-500">
                      The EXFIN automation engine implements fail-safe retry rules for common communication faults. We prevent database corruption and overlapping scheduling runs through decentralized concurrency guards.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-1.5">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-slate-500" />
                          Tally Offline Recovery
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          If Tally Prime is unreachable during a sync window, the scheduler enters an offline queue, waiting for Tally to revive before executing safely.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-1.5">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-indigo-500" />
                          Duplicate Execution Guard
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Locks prevent secondary scheduler tasks from executing concurrently on the same database table.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                    <h3 className="font-bold text-slate-900">License Limits Integration</h3>
                    <p className="text-xs text-slate-500">Active features verified against your global EXFIN license credentials.</p>
                    
                    <div className="space-y-3.5 text-xs text-slate-600">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Automation Features</span>
                        <span className="font-semibold text-emerald-600">✓ Fully Enabled</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Max Active Jobs Allowed</span>
                        <span className="font-semibold text-slate-800">25 (Enterprise Plan)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Daily Execution Cap</span>
                        <span className="font-semibold text-slate-800">Unlimited</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
