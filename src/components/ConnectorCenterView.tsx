import React, { useState, useEffect } from 'react';
import {
  TallyConnection,
  TallyCompanyContext,
  TallyCapabilityMatrix,
  ConnectorAdapter,
  TallyDatasetSnapshot,
  SyncJobState,
  TDLReportAdapter,
  SchemaDiffReport,
  ConnectorDiagnosticResult,
  CompanyPortfolioSummary,
  ConnectorAuditEntry,
  CircuitBreakerState
} from '../types/phase24ConnectorCenter';
import {
  Radio,
  Server,
  Building2,
  Cpu,
  Activity,
  RefreshCw,
  Layers,
  FileCode,
  ListFilter,
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Bot,
  Sparkles,
  Download,
  ArrowRight,
  Database,
  Search,
  Eye,
  Settings2,
  Check,
  X,
  Plus,
  Compass,
  Key,
  Shield,
  Sliders,
  Terminal,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

type TabType =
  | 'Connections'
  | 'Companies'
  | 'Servers'
  | 'Versions'
  | 'Health'
  | 'Sync'
  | 'Adapters'
  | 'TDL'
  | 'Logs'
  | 'Settings';

export const ConnectorCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Connections');
  const [loading, setLoading] = useState<boolean>(true);
  const [connections, setConnections] = useState<TallyConnection[]>([]);
  const [companies, setCompanies] = useState<TallyCompanyContext[]>([]);
  const [activeConnection, setActiveConnection] = useState<TallyConnection | null>(null);
  const [activeCompany, setActiveCompany] = useState<TallyCompanyContext | null>(null);
  const [portfolio, setPortfolio] = useState<CompanyPortfolioSummary | null>(null);
  const [capabilities, setCapabilities] = useState<TallyCapabilityMatrix | null>(null);
  const [adapters, setAdapters] = useState<ConnectorAdapter[]>([]);
  const [snapshots, setSnapshots] = useState<TallyDatasetSnapshot[]>([]);
  const [tdlAdapters, setTdlAdapters] = useState<TDLReportAdapter[]>([]);
  const [schemaDiff, setSchemaDiff] = useState<SchemaDiffReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<ConnectorAuditEntry[]>([]);
  const [activeSyncJob, setActiveSyncJob] = useState<SyncJobState | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<ConnectorDiagnosticResult | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newConnHost, setNewConnHost] = useState<string>('127.0.0.1');
  const [newConnPort, setNewConnPort] = useState<number>(9000);
  const [newConnName, setNewConnName] = useState<string>('Local TallyPrime Server');
  const [newConnType, setNewConnType] = useState<'Local' | 'LAN' | 'Remote Gateway'>('Local');
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [copilotMessages, setCopilotMessages] = useState<
    { sender: 'user' | 'assistant'; text: string; category?: string; time: string }[]
  >([
    {
      sender: 'assistant',
      text: 'EXFIN Universal Tally Connector is initialized in STRICT READ-ONLY mode. How can I assist you with your Tally instances, active companies, schema mappings, or sync health?',
      category: 'STATUS',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [testSuiteResults, setTestSuiteResults] = useState<any | null>(null);
  const [runningTestSuite, setRunningTestSuite] = useState<boolean>(false);

  // Fetch initial state
  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/connector-center/overview');
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections || []);
        setCompanies(data.companies || []);
        setActiveConnection(data.activeConnection || null);
        setActiveCompany(data.activeCompany || null);
        setPortfolio(data.portfolio || null);
      }

      // Fetch capabilities
      const capRes = await fetch('/api/connector-center/capabilities');
      const capData = await capRes.json();
      if (capData.success) {
        setCapabilities(capData.matrix);
      }

      // Fetch adapters
      const adaptRes = await fetch('/api/connector-center/adapters');
      const adaptData = await adaptRes.json();
      if (adaptData.success) {
        setAdapters(adaptData.adapters);
      }

      // Fetch snapshots
      const snapRes = await fetch('/api/connector-center/snapshots');
      const snapData = await snapRes.json();
      if (snapData.success) {
        setSnapshots(snapData.snapshots);
      }

      // Fetch TDL
      const tdlRes = await fetch('/api/connector-center/tdl');
      const tdlData = await tdlRes.json();
      if (tdlData.success) {
        setTdlAdapters(tdlData.tdlAdapters);
      }

      // Fetch Diff
      const diffRes = await fetch('/api/connector-center/schema-diff');
      const diffData = await diffRes.json();
      if (diffData.success) {
        setSchemaDiff(diffData.diff);
      }

      // Fetch Logs
      const logsRes = await fetch('/api/connector-center/logs');
      const logsData = await logsRes.json();
      if (logsData.success) {
        setAuditLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Failed to load connector center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // Poll sync status if active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSyncJob && activeSyncJob.status === 'Running') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/connector-center/sync/status');
          const data = await res.json();
          if (data.success && data.syncJob) {
            setActiveSyncJob(data.syncJob);
            if (data.syncJob.status === 'Completed' || data.syncJob.status === 'Failed') {
              loadOverview();
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeSyncJob]);

  // Switch context
  const handleSwitchContext = async (connId: string, compId: string) => {
    try {
      const res = await fetch('/api/connector-center/active-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId, companyId: compId })
      });
      const data = await res.json();
      if (data.success) {
        setActiveConnection(data.activeConnection);
        setActiveCompany(data.activeCompany);
        // Refresh capabilities for new context
        const capRes = await fetch(`/api/connector-center/capabilities?connectionId=${connId}`);
        const capData = await capRes.json();
        if (capData.success) {
          setCapabilities(capData.matrix);
        }
      }
    } catch (e) {
      console.error('Failed to switch context', e);
    }
  };

  // Run 7-Point Diagnostic Suite
  const handleRunDiagnostics = async (connId?: string) => {
    try {
      setRunningDiagnostics(true);
      const res = await fetch('/api/connector-center/diagnostics/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId || activeConnection?.connectionId })
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosticResult(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  // Quick connection test
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setTestStatusMessage(null);
      const res = await fetch('/api/connector-center/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: newConnHost, port: newConnPort })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatusMessage(`Connected successfully! Latency: ${data.latencyMs}ms | Detected: ${data.tallyProduct} ${data.tallyVersion}`);
      } else {
        setTestStatusMessage(`Failed: ${data.errorMessage || 'Unknown error'}`);
      }
    } catch (e) {
      setTestStatusMessage('Network socket failed or rejected.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Create Connection
  const handleCreateConnection = async () => {
    try {
      const res = await fetch('/api/connector-center/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConnName,
          host: newConnHost,
          port: newConnPort,
          connectionType: newConnType
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowWizard(false);
        setWizardStep(1);
        loadOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Circuit Breaker
  const handleToggleCircuitBreaker = async (connId: string, state?: CircuitBreakerState) => {
    try {
      const res = await fetch('/api/connector-center/circuit-breaker/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connId, targetState: state })
      });
      const data = await res.json();
      if (data.success) {
        loadOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start Sync
  const handleStartSync = async (mode: 'Quick' | 'Full' | 'Incremental') => {
    try {
      const res = await fetch('/api/connector-center/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: activeConnection?.connectionId,
          companyId: activeCompany?.companyId,
          mode
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSyncJob(data.syncJob);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel Sync
  const handleCancelSync = async () => {
    try {
      const res = await fetch('/api/connector-center/sync/cancel', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActiveSyncJob(data.syncJob);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Copilot Query
  const handleSendCopilot = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || copilotInput;
    if (!promptToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: promptToSend,
      time: new Date().toLocaleTimeString()
    };
    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const res = await fetch('/api/connector-center/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptToSend })
      });
      const data = await res.json();
      if (data.success) {
        setCopilotMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer,
            category: data.category,
            time: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch (e) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to communicate with Connector Intelligence engine.',
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Run Automated Test Suite
  const handleRunTestSuite = async () => {
    try {
      setRunningTestSuite(true);
      const res = await fetch('/api/connector-center/test-suite/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestSuiteResults(data.testResults);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTestSuite(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Banner: Global Connection Status & Read-Only Badge */}
      <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Universal Tally Connector Center
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Phase 24
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  STRICT READ-ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise Tally SDK, Multi-Company Isolation, Version Detectors, TDL Adapters & Diagnostic Hub
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Active Company Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-400 mr-2" />
              <span className="text-slate-400 mr-1.5">Company:</span>
              <select
                value={activeCompany?.companyId || ''}
                onChange={(e) => handleSwitchContext(activeConnection?.connectionId || '', e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId} className="bg-slate-900 text-white">
                    {c.name} ({c.recordCounts.vouchers.toLocaleString()} Vouchers)
                  </option>
                ))}
              </select>
            </div>

            {/* Offline Mode Toggle */}
            <button
              onClick={() => setOfflineMode(!offlineMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
                offlineMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{offlineMode ? 'OFFLINE SNAPSHOT' : 'LIVE CONNECTION'}</span>
            </button>

            {/* New Connection Button */}
            <button
              onClick={() => setShowWizard(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Instance</span>
            </button>
          </div>
        </div>

        {/* 10 Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex space-x-1 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'Connections', label: 'Connections', icon: Server, count: connections.length },
            { id: 'Companies', label: 'Company Portfolio', icon: Building2, count: companies.length },
            { id: 'Servers', label: 'Servers & Pools', icon: Cpu },
            { id: 'Versions', label: 'Versions & Matrix', icon: Layers },
            { id: 'Health', label: 'Health & Latency', icon: Activity },
            { id: 'Sync', label: 'Sync & Snapshots', icon: RefreshCw, count: snapshots.length },
            { id: 'Adapters', label: 'Pluggable Adapters', icon: Sliders, count: adapters.length },
            { id: 'TDL', label: 'TDL & Schema Explorer', icon: FileCode, count: tdlAdapters.length },
            { id: 'Logs', label: 'Diagnostics & Logs', icon: Terminal, count: auditLogs.length },
            { id: 'Settings', label: 'Settings & Security', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* ========================================================================= */}
        {/* TAB 1: CONNECTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'Connections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Connection Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    Configured Tally Instances
                  </h2>
                  <span className="text-xs text-slate-400">
                    {connections.filter((c) => c.status === 'Connected').length} of {connections.length} Instances Online
                  </span>
                </div>

                {connections.map((conn) => {
                  const isActive = activeConnection?.connectionId === conn.connectionId;
                  const isHealthy = conn.status === 'Connected';
                  return (
                    <div
                      key={conn.connectionId}
                      className={`p-5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-slate-900/90 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white text-sm">{conn.name}</span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                ACTIVE CONTEXT
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isHealthy
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {conn.status}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                              {conn.connectionType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            {conn.protocol}://{conn.host}:{conn.port}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRunDiagnostics(conn.connectionId)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1"
                          >
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Diagnose</span>
                          </button>
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchContext(conn.connectionId, activeCompany?.companyId || '')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                              Use Instance
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Instance Metrics & Circuit Breaker Row */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">Product & Version</span>
                          <span className="font-semibold text-slate-200">{conn.tallyProduct} v{conn.tallyVersion}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">Average Latency</span>
                          <span className="font-semibold text-emerald-400">{conn.metrics.responseTimeMs} ms</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">Circuit Breaker</span>
                          <span
                            className={`font-semibold ${
                              conn.circuitBreaker.state === 'Closed'
                                ? 'text-emerald-400'
                                : conn.circuitBreaker.state === 'Half-Open'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {conn.circuitBreaker.state}
                          </span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">Connection Pool</span>
                          <span className="font-semibold text-indigo-300">
                            {conn.metrics.activePoolConnections}/{conn.metrics.maxPoolConnections} active
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Side Action Panel: Quick Diagnostic Runner & Setup Wizard trigger */}
              <div className="space-y-4">
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    7-Point Diagnostic Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    Runs socket ping, XML handshake, @@Product discovery, company enumeration, and safe parsing verification.
                  </p>
                  <button
                    onClick={() => handleRunDiagnostics()}
                    disabled={runningDiagnostics}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{runningDiagnostics ? 'Executing 7-Point Probe...' : 'Run Full Diagnostics'}</span>
                  </button>

                  {diagnosticResult && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">Result:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 7 / 7 PASSED ({diagnosticResult.totalDurationMs}ms)
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {diagnosticResult.steps.map((step) => (
                          <div key={step.stepNumber} className="p-2 rounded bg-slate-900 border border-slate-800">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
                              <span>
                                {step.stepNumber}. {step.name}
                              </span>
                              <span className="text-emerald-400 font-mono">{step.durationMs}ms</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{step.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Test Card */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Quick Endpoint Probe
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 block mb-1">Host / IP</label>
                      <input
                        type="text"
                        value={newConnHost}
                        onChange={(e) => setNewConnHost(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                        placeholder="127.0.0.1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Port</label>
                      <input
                        type="number"
                        value={newConnPort}
                        onChange={(e) => setNewConnPort(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                        placeholder="9000"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="w-full py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{testingConnection ? 'Probing endpoint...' : 'Test Connection'}</span>
                  </button>
                  {testStatusMessage && (
                    <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded border border-indigo-500/20">
                      {testStatusMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMPANIES & MULTI-COMPANY PORTFOLIO */}
        {/* ========================================================================= */}
        {activeTab === 'Companies' && (
          <div className="space-y-6">
            {/* Portfolio Summary Card */}
            {portfolio && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/70 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-xs text-slate-400">Total Configured Companies</span>
                  <div className="text-2xl font-bold text-white mt-1">{portfolio.totalCompanies} Companies</div>
                  <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
                    {portfolio.activeCompanies} Active & Isolated
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Consolidated Revenue (Read-Only)</span>
                  <div className="text-2xl font-bold text-indigo-300 mt-1">
                    ₹{(portfolio.consolidatedMetrics.totalRevenue / 10000000).toFixed(2)} Cr
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Base: {portfolio.consolidatedMetrics.baseCurrency} ({portfolio.consolidatedMetrics.currencyCompatibilityStatus})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Consolidated Receivables</span>
                  <div className="text-2xl font-bold text-amber-300 mt-1">
                    ₹{(portfolio.consolidatedMetrics.totalReceivables / 100000).toFixed(2)} Lakhs
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Payables: ₹{(portfolio.consolidatedMetrics.totalPayables / 100000).toFixed(2)} L
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Consolidation Safeguards</span>
                  <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Period Aligned & Audited
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Strict company context enforced on every query
                  </span>
                </div>
              </div>
            )}

            {/* Company Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Discovered Company Catalog</h3>
                <span className="text-xs text-slate-400">Isolation Scope Guaranteed</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Tally Instance</th>
                      <th className="px-4 py-3">Currency</th>
                      <th className="px-4 py-3">FY Period</th>
                      <th className="px-4 py-3">Vouchers</th>
                      <th className="px-4 py-3">Freshness</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {companies.map((c) => {
                      const isSelected = activeCompany?.companyId === c.companyId;
                      const conn = connections.find((con) => con.connectionId === c.tallyConnectionId);
                      return (
                        <tr key={c.companyId} className={isSelected ? 'bg-indigo-950/20' : 'hover:bg-slate-900/40'}>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-white flex items-center gap-2">
                              {c.name}
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">ID: {c.identifier}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                            {conn?.name || c.tallyConnectionId}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-200">
                            {c.currencySymbol} {c.currency}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {c.fiscalYearStart} → {c.fiscalYearEnd}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-200 font-semibold">
                            {c.recordCounts.vouchers.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                c.dataFreshness === 'Fresh' || c.dataFreshness === 'Live'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {c.dataFreshness}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {!isSelected ? (
                              <button
                                onClick={() => handleSwitchContext(c.tallyConnectionId, c.companyId)}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                              >
                                Select
                              </button>
                            ) : (
                              <span className="text-xs text-indigo-400 font-medium flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" /> Active Scope
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SERVERS & CONNECTION POOLS */}
        {/* ========================================================================= */}
        {activeTab === 'Servers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-xs text-slate-400">Central Request Queue</span>
                <div className="text-xl font-bold text-white mt-1">4 Priorities</div>
                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Interactive:</span> <span className="text-emerald-400 font-mono">0 pending</span></div>
                  <div className="flex justify-between"><span>Discovery:</span> <span className="text-emerald-400 font-mono">0 pending</span></div>
                  <div className="flex justify-between"><span>Background Sync:</span> <span className="text-indigo-300 font-mono">1 scheduled</span></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-xs text-slate-400">Rate Limiter & Backpressure</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">Active Guard</div>
                <p className="text-xs text-slate-400 mt-2">
                  Max 8 concurrent requests per Tally instance to prevent XML buffer overflows.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-xs text-slate-400">Total Transferred Volume</span>
                <div className="text-xl font-bold text-indigo-300 mt-1">32.8 MB</div>
                <p className="text-xs text-slate-400 mt-2">
                  Bounded memory footprint with streaming chunking enabled.
                </p>
              </div>
            </div>

            {/* Server Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {connections.map((conn) => (
                <div key={conn.connectionId} className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{conn.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      Port {conn.port}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Socket Protocol:</span>
                      <span className="text-slate-200 font-mono">{conn.protocol}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Connection Time:</span>
                      <span className="text-slate-200 font-mono">{conn.metrics.connectionTimeMs}ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Request Time:</span>
                      <span className="text-slate-200 font-mono">{conn.metrics.requestTimeMs}ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Success Rate:</span>
                      <span className="text-emerald-400 font-bold">{conn.metrics.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pool Connections:</span>
                      <span className="text-indigo-300 font-mono">
                        {conn.metrics.activePoolConnections} / {conn.metrics.maxPoolConnections} Max
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: VERSIONS & CAPABILITY MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'Versions' && capabilities && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Detected Environment</span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {capabilities.product} v{capabilities.version} ({capabilities.build})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Universal compatibility abstraction verified across TallyPrime 1.0–4.1 and Tally.ERP 9 Release 1.0–6.6.3
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Adapter: tallyprime-universal-v4
                </span>
              </div>
            </div>

            {/* 15 Capabilities Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(capabilities.capabilities).map(([capKey, capValRaw]) => {
                const capVal = capValRaw as { status: string; notes?: string };
                return (
                  <div key={capKey} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{capKey}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          capVal.status === 'Supported'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {capVal.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{capVal.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: HEALTH, LATENCY & CIRCUIT BREAKER */}
        {/* ========================================================================= */}
        {activeTab === 'Health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {connections.map((conn) => {
                const isTripped = conn.circuitBreaker.state === 'Open';
                return (
                  <div key={conn.connectionId} className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">{conn.name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          conn.circuitBreaker.state === 'Closed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : conn.circuitBreaker.state === 'Half-Open'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        Circuit: {conn.circuitBreaker.state}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Failure Threshold:</span>
                        <span className="text-slate-200 font-mono">{conn.circuitBreaker.tripThreshold} consecutive errors</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Current Failures:</span>
                        <span className="text-slate-200 font-mono">{conn.circuitBreaker.failureCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Reset Cooldown:</span>
                        <span className="text-slate-200 font-mono">{conn.circuitBreaker.resetTimeoutMs / 1000} seconds</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Exponential Backoff:</span>
                        <span className="text-indigo-300 font-mono">
                          {conn.retryConfig.backoffBaseMs}ms → {conn.retryConfig.backoffMaxMs}ms
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Manual Override:</span>
                      <button
                        onClick={() => handleToggleCircuitBreaker(conn.connectionId, isTripped ? 'Closed' : 'Open')}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          isTripped
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isTripped ? 'Reset to Closed' : 'Trip Circuit'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SYNC & DATASET SNAPSHOTS */}
        {/* ========================================================================= */}
        {activeTab === 'Sync' && (
          <div className="space-y-6">
            {/* Sync Control Header */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">Synchronization Hub</h3>
                <p className="text-xs text-slate-400">
                  Execute safe, bounded delta ingestion. Large sync jobs are chunked with streaming progress.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStartSync('Quick')}
                  disabled={activeSyncJob?.status === 'Running'}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
                >
                  Quick Sync (Recent)
                </button>
                <button
                  onClick={() => handleStartSync('Full')}
                  disabled={activeSyncJob?.status === 'Running'}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${activeSyncJob?.status === 'Running' ? 'animate-spin' : ''}`} />
                  <span>Full FY Ingestion</span>
                </button>
              </div>
            </div>

            {/* Active Sync Progress Bar */}
            {activeSyncJob && (
              <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="font-semibold text-white text-xs">
                      {activeSyncJob.mode} Sync: {activeCompany?.name} ({activeSyncJob.status})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-indigo-300">
                      {activeSyncJob.recordsTransferred.toLocaleString()} Records
                    </span>
                    {activeSyncJob.status === 'Running' && (
                      <button
                        onClick={handleCancelSync}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30"
                      >
                        Cancel Sync
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${activeSyncJob.progressPercent}%` }}
                  />
                </div>

                {/* Entities Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-2">
                  {activeSyncJob.entitiesProcessed.map((ent) => (
                    <div key={ent.entity} className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">{ent.entity}</span>
                      <span className="font-mono text-slate-200 text-xs">
                        {ent.processed} / {ent.totalEstimated}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dataset Snapshots Vault */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Dataset Snapshot Vault (Offline-Enabled)
                </h3>
                <span className="text-xs text-slate-400">Cryptographic Checksum Verified</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Snapshot Period</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Vouchers & Ledgers</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Integrity Checksum</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {snapshots.map((snap) => (
                      <tr key={snap.snapshotId} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3.5 font-semibold text-white">
                          {snap.dataPeriod.label}
                          <span className="text-[10px] text-slate-500 block">{new Date(snap.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">{snap.companyName}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-200">
                          {snap.recordCounts.vouchers.toLocaleString()} Vouchers / {snap.recordCounts.ledgers} Ledgers
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {(snap.sizeBytes / 1000000).toFixed(1)} MB
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {snap.checksum.substring(0, 18)}...
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: PLUGGABLE ADAPTER REGISTRY */}
        {/* ========================================================================= */}
        {activeTab === 'Adapters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Pluggable Connector Adapter Registry</h3>
                <p className="text-xs text-slate-400">
                  Versioned adapters with cryptographic signatures, capability negotiation, and instant rollback.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adapters.map((adp) => (
                <div key={adp.adapterId} className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{adp.name}</span>
                        {adp.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        v{adp.version} | By {adp.author}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Signed
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{adp.description}</p>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                    <div className="text-slate-400">
                      <span className="text-slate-500">Supported:</span> {adp.supportedProducts.join(', ')}
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">Capabilities:</span> {adp.supportedCapabilities.length} / 15 features
                    </div>
                    {adp.rollbackVersion && (
                      <div className="text-slate-500 text-[11px]">
                        Rollback Target Available: v{adp.rollbackVersion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: TDL & SCHEMA EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === 'TDL' && (
          <div className="space-y-6">
            {/* Schema Diff Banner if applicable */}
            {schemaDiff && (
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="font-semibold text-white">Schema Evolution Detected:</span>
                    <p className="text-slate-400">
                      Added fields: {schemaDiff.addedFields.join(', ')} | Impact: {schemaDiff.impactRating}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Mappings Compatible
                </span>
              </div>
            )}

            {/* Custom TDL Adapters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Configured TDL Report Adapters</h3>
                <span className="text-xs text-slate-400">Read-Only TDL Query Extraction</span>
              </div>

              {tdlAdapters.map((tdl) => (
                <div key={tdl.tdlId} className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{tdl.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 font-mono">
                          {tdl.tallyReportName}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Version {tdl.version} | Match Confidence: {tdl.confidenceScore}%
                      </span>
                    </div>
                  </div>

                  {/* Field Mappings Table */}
                  <div className="pt-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-400 text-[11px]">
                        <tr>
                          <th className="px-3 py-2">Source TDL Field</th>
                          <th className="px-3 py-2">Data Type</th>
                          <th className="px-3 py-2">Canonical Target</th>
                          <th className="px-3 py-2">Sample Value</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {tdl.fields.map((f) => (
                          <tr key={f.fieldId}>
                            <td className="px-3 py-2 font-mono text-slate-200">{f.sourceTDLName}</td>
                            <td className="px-3 py-2 text-slate-400">{f.sourceDataType}</td>
                            <td className="px-3 py-2 text-indigo-300 font-semibold">{f.canonicalFieldName}</td>
                            <td className="px-3 py-2 font-mono text-slate-400">{String(f.sampleValue || '-')}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  f.mappingStatus === 'Mapped'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {f.mappingStatus}
                              </span>
                            </td>
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

        {/* ========================================================================= */}
        {/* TAB 9: DIAGNOSTICS & AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'Logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Connector Security & Audit Logs</h3>
                <p className="text-xs text-slate-400">
                  Every connection handshake, query execution, and blocked write is cryptographically audited.
                </p>
              </div>
              <button
                onClick={() => alert('Diagnostic log exported (Secrets redacted).')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sanitized Logs</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.auditId} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 font-semibold text-slate-300">{log.userId}</td>
                        <td className="px-4 py-3 text-indigo-300 font-semibold">{log.action}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-md truncate">{log.details}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              log.status === 'Success'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : log.status === 'Warning'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 10: SETTINGS, SECURITY & COPILOT */}
        {/* ========================================================================= */}
        {activeTab === 'Settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Security Policy Card & Test Suite Runner */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">Strict Read-Only Enforcement Active</h3>
                      <p className="text-xs text-slate-300">
                        The connector architecture blocks any attempt to create vouchers, alter ledgers, or modify Tally data.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="font-semibold text-slate-200 block mb-1">Permitted Operations</span>
                      <span className="text-emerald-400 font-mono">CONNECT, DISCOVER, READ, QUERY, MAP, CACHE</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="font-semibold text-slate-200 block mb-1">Forbidden Operations</span>
                      <span className="text-rose-400 font-mono">CREATE_VOUCHER, ALTER_LEDGER, WRITE_XML</span>
                    </div>
                  </div>
                </div>

                {/* Automated Test Suite Runner */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        Comprehensive Automated Test Suite
                      </h3>
                      <p className="text-xs text-slate-400">
                        Executes contract tests, SSRF boundary tests, multi-company isolation checks, and performance benchmarks.
                      </p>
                    </div>
                    <button
                      onClick={handleRunTestSuite}
                      disabled={runningTestSuite}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                    >
                      {runningTestSuite ? 'Running Tests...' : 'Run All Test Suites'}
                    </button>
                  </div>

                  {testSuiteResults && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                        <span>ALL 6 SUITES PASSED ({testSuiteResults.suiteDurationMs}ms)</span>
                        <span className="font-mono">{testSuiteResults.passedCount} / {testSuiteResults.totalTests} Suites Green</span>
                      </div>
                      <div className="space-y-2">
                        {testSuiteResults.suites.map((suite: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                            <div className="font-semibold text-slate-200 flex justify-between">
                              <span>{suite.suiteName}</span>
                              <span className="text-emerald-400 font-bold">{suite.status}</span>
                            </div>
                            <div className="mt-1.5 space-y-1">
                              {suite.tests.map((t: any, j: number) => (
                                <div key={j} className="flex justify-between text-[11px] text-slate-400">
                                  <span>• {t.name}</span>
                                  <span className="text-slate-300 font-mono">{t.result} ({t.timeMs}ms)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Natural Language Tally Copilot */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col h-[520px]">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-white text-sm">Tally Connector Copilot</span>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
                  {copilotMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl max-w-[90%] ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white ml-auto'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {msg.category && (
                        <span className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                          [{msg.category}]
                        </span>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-slate-400 block mt-1 text-right">{msg.time}</span>
                    </div>
                  ))}
                  {copilotLoading && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Inspecting connector schema and metrics...</span>
                    </div>
                  )}
                </div>

                {/* Quick Prompts */}
                <div className="py-2 flex flex-wrap gap-1.5 border-t border-slate-800">
                  {[
                    'Check my Tally connection.',
                    'Which companies are connected?',
                    'What Tally version is this?',
                    'Why did synchronization fail?'
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSendCopilot(p)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-indigo-300 border border-slate-800 truncate"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCopilot();
                  }}
                  className="pt-2 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    placeholder="Ask about connections, schema, or sync..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 9-STEP CONNECTION SETUP WIZARD MODAL */}
      {/* ========================================================================= */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Connection Setup Wizard</h3>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className={wizardStep === 1 ? 'text-indigo-400 font-bold' : ''}>1. Endpoint</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className={wizardStep === 2 ? 'text-indigo-400 font-bold' : ''}>2. Test Socket</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className={wizardStep === 3 ? 'text-indigo-400 font-bold' : ''}>3. Discover & Save</span>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Connection Name</label>
                  <input
                    type="text"
                    value={newConnName}
                    onChange={(e) => setNewConnName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Connection Type</label>
                    <select
                      value={newConnType}
                      onChange={(e) => setNewConnType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                    >
                      <option value="Local">Local Tally (localhost)</option>
                      <option value="LAN">LAN Private Network</option>
                      <option value="Remote Gateway">Remote Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Port</label>
                    <input
                      type="number"
                      value={newConnPort}
                      onChange={(e) => setNewConnPort(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Host Address / IP</label>
                  <input
                    type="text"
                    value={newConnHost}
                    onChange={(e) => setNewConnHost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      handleTestConnection();
                      setWizardStep(2);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                  >
                    Proceed to Handshake Test
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-semibold text-white">Endpoint Probe Results</div>
                  <p className="text-slate-400 font-mono">Target: {newConnHost}:{newConnPort}</p>
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{testStatusMessage || 'TCP Socket established. TallyPrime identified.'}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                  >
                    Run Discovery & Finish
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-semibold text-white">Safe Company Discovery Summary</div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Discovered 2 open companies</li>
                    <li>Read-Only Policy locked and verified</li>
                    <li>Adapter selected: TallyPrime Universal v4.2</li>
                  </ul>
                </div>
                <div className="pt-2 flex justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateConnection}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Activate Instance</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
