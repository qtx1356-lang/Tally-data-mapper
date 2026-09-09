import React, { useState, useEffect } from 'react';
import {
  Radio,
  Server,
  Zap,
  Activity,
  Layers,
  Database,
  Search,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sliders,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  Eye,
  FileText,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  Unplug,
  Copy,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Lock,
  GitCompare,
  HardDrive
} from 'lucide-react';
import {
  ConnectionModel,
  DiscoveredCompany,
  TallyCapability,
  TallySnapshot,
  SnapshotDiff,
  ImportedDataset,
  DataFileAnalysis,
  AdapterMetadata,
  CompatibilityItem,
  DiagnosticsReport,
  ConnectionAuditLog,
  BlockedWriteLog,
  ProtocolType
} from '../types/phase28UniversalConnector';

type ConnectionsTab =
  | 'Active Connections'
  | 'Discover'
  | 'Add Connection'
  | 'Diagnostics'
  | 'Capabilities'
  | 'Adapters & SDK'
  | 'Import Center'
  | 'Snapshots'
  | 'Data File Analyzer'
  | 'History & Audits';

export const ConnectionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConnectionsTab>('Active Connections');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core States
  const [connections, setConnections] = useState<ConnectionModel[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionModel | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);
  const [compatibility, setCompatibility] = useState<CompatibilityItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsReport | null>(null);
  const [snapshots, setSnapshots] = useState<TallySnapshot[]>([]);
  const [snapshotDiff, setSnapshotDiff] = useState<SnapshotDiff | null>(null);
  const [datasets, setDatasets] = useState<ImportedDataset[]>([]);
  const [adapters, setAdapters] = useState<AdapterMetadata[]>([]);
  const [auditLogs, setAuditLogs] = useState<ConnectionAuditLog[]>([]);
  const [blockedWrites, setBlockedWrites] = useState<BlockedWriteLog[]>([]);

  // Add Connection Form
  const [newConnForm, setNewConnForm] = useState({
    name: 'Tally Server 1',
    host: '127.0.0.1',
    port: 9000,
    protocol: 'HTTP' as ProtocolType
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // File Analyzer State
  const [fileToAnalyze, setFileToAnalyze] = useState<string>('Tally_DayBook_Export.xml');
  const [fileAnalysisResult, setFileAnalysisResult] = useState<DataFileAnalysis | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState<boolean>(false);

  // Snapshot Creation Modal
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [snapshotPeriod, setSnapshotPeriod] = useState<string>('01-Apr-2025 to 31-Mar-2026 (FY26)');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resConn, resDisc, resComp, resDiag, resSnap, resDs, resAdp, resAud] = await Promise.all([
        fetch('/api/universal-connector/connections'),
        fetch('/api/universal-connector/discover'),
        fetch('/api/universal-connector/compatibility'),
        fetch('/api/universal-connector/diagnostics'),
        fetch('/api/universal-connector/snapshots'),
        fetch('/api/universal-connector/import/datasets'),
        fetch('/api/universal-connector/adapters'),
        fetch('/api/universal-connector/audits')
      ]);

      const dataConn = await resConn.json();
      const dataDisc = await resDisc.json();
      const dataComp = await resComp.json();
      const dataDiag = await resDiag.json();
      const dataSnap = await resSnap.json();
      const dataDs = await resDs.json();
      const dataAdp = await resAdp.json();
      const dataAud = await resAud.json();

      if (dataConn.success) {
        setConnections(dataConn.data);
        if (dataConn.data.length > 0) setSelectedConnection(dataConn.data[0]);
      }
      if (dataDisc.success) setDiscoveryResults(dataDisc.data);
      if (dataComp.success) setCompatibility(dataComp.data);
      if (dataDiag.success) setDiagnostics(dataDiag.data);
      if (dataSnap.success) setSnapshots(dataSnap.data);
      if (dataDs.success) setDatasets(dataDs.data);
      if (dataAdp.success) setAdapters(dataAdp.data);
      if (dataAud.success) {
        setAuditLogs(dataAud.data.audits || []);
        setBlockedWrites(dataAud.data.blockedWrites || []);
      }
    } catch (err) {
      console.error('Failed to load Universal Connector data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (host = newConnForm.host, port = newConnForm.port) => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/universal-connector/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.data);
        showNotification('success', data.data.message);
      } else {
        showNotification('error', data.error || 'Connection test failed');
      }
    } catch (err) {
      showNotification('error', 'Error reaching target Tally socket');
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/universal-connector/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnForm)
      });
      const data = await res.json();
      if (data.success) {
        setConnections([data.data, ...connections]);
        setSelectedConnection(data.data);
        showNotification('success', `Connection "${data.data.name}" added and verified.`);
        setActiveTab('Active Connections');
      }
    } catch (err) {
      showNotification('error', 'Failed to create connection');
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch('/api/universal-connector/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedConnection?.activeCompanyId || 'comp-101',
          period: snapshotPeriod,
          domains: ['Ledgers', 'Vouchers', 'Stock Items', 'GST Registers']
        })
      });
      const data = await res.json();
      if (data.success) {
        setSnapshots([data.data, ...snapshots]);
        showNotification('success', `Snapshot ${data.data.snapshotId} generated with SHA-256 seal.`);
        setIsSnapshotModalOpen(false);
      }
    } catch (err) {
      showNotification('error', 'Failed to create snapshot');
    }
  };

  const handleCompareSnapshots = async () => {
    try {
      const res = await fetch('/api/universal-connector/snapshots/compare');
      const data = await res.json();
      if (data.success) {
        setSnapshotDiff(data.data);
        showNotification('info', 'Snapshot diff calculation completed.');
      }
    } catch (err) {
      showNotification('error', 'Failed to compare snapshots');
    }
  };

  const handleAnalyzeFile = async (name: string) => {
    setIsAnalyzingFile(true);
    try {
      const res = await fetch('/api/universal-connector/import/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: name })
      });
      const data = await res.json();
      if (data.success) {
        setFileAnalysisResult(data.data);
      }
    } catch (err) {
      showNotification('error', 'File analysis failed');
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Universal Tally Connector</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  PHASE 28 INGESTION & PROTOCOLS
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  READ-ONLY TALLY GUARD ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Protocol XML/JSON/HTTP Ingestion, Port Auto-Discovery, Version Compatibility & Immutable Snapshots
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-200 font-medium">Socket: 127.0.0.1:9000 (HTTP)</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 font-medium">Latency: 18ms</span>
            </div>
            <button
              onClick={() => {
                fetchInitialData();
                showNotification('info', 'Refreshed connection states and socket telemetry.');
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'Active Connections', label: `Active Connections (${connections.length})`, icon: Server },
            { id: 'Discover', label: 'Local Port Discovery', icon: Zap },
            { id: 'Add Connection', label: 'Add Connection', icon: Plus },
            { id: 'Diagnostics', label: 'Live Diagnostics', icon: Activity },
            { id: 'Capabilities', label: 'Tally Capabilities', icon: Layers },
            { id: 'Adapters & SDK', label: 'Connector SDK & Adapters', icon: Sliders },
            { id: 'Import Center', label: `Import Center (${datasets.length})`, icon: UploadCloud },
            { id: 'Snapshots', label: `Snapshots (${snapshots.length})`, icon: Database },
            { id: 'Data File Analyzer', label: 'Data File Analyzer', icon: HardDrive },
            { id: 'History & Audits', label: 'Security & Audit Logs', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ConnectionsTab)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-t-md font-medium whitespace-nowrap transition ${
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
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* TAB 1: ACTIVE CONNECTIONS */}
        {/* ========================================== */}
        {activeTab === 'Active Connections' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Connection Cards */}
              <div className="lg:col-span-2 space-y-4">
                {connections.map((conn) => (
                  <div
                    key={conn.connectionId}
                    onClick={() => setSelectedConnection(conn)}
                    className={`p-5 rounded-xl border cursor-pointer transition ${
                      selectedConnection?.connectionId === conn.connectionId
                        ? 'bg-slate-900 border-blue-500 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <h3 className="text-base font-bold text-white">{conn.name}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                            {conn.protocol}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Socket: <strong className="text-slate-200">{conn.host}:{conn.port}</strong> • Latency: <strong className="text-emerald-400">{conn.latencyMs}ms</strong>
                        </p>
                      </div>

                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {conn.status}
                      </span>
                    </div>

                    {/* Discovered Companies List */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Discovered Accessible Companies ({conn.discoveredCompanies.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {conn.discoveredCompanies.map((comp) => (
                          <div
                            key={comp.companyId}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                              conn.activeCompanyId === comp.companyId
                                ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-semibold text-white truncate">{comp.name}</div>
                              <div className="text-[11px] text-slate-400">{comp.financialYear}</div>
                            </div>
                            {conn.activeCompanyId === comp.companyId && (
                              <span className="text-[10px] font-bold text-blue-400 uppercase">Active</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company Profile Drawer */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Selected Company Profile</span>
                </h3>

                {selectedConnection ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                      <div>Company Name: <strong className="text-white">Acme Enterprise Ltd (HO)</strong></div>
                      <div>Base Currency: <strong className="text-slate-200">INR (₹)</strong></div>
                      <div>Financial Period: <strong className="text-slate-200">01-Apr-2025 to 31-Mar-2026</strong></div>
                      <div>Tally Version: <strong className="text-blue-400">{selectedConnection.tallyVersion.edition}</strong></div>
                      <div>Build String: <strong className="text-slate-400">{selectedConnection.tallyVersion.build}</strong></div>
                    </div>

                    <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg text-blue-300 text-[11px]">
                      <strong>Origin Label:</strong>
                      <div className="mt-1 font-mono text-emerald-400">● LIVE TALLY (Verified Direct Connection)</div>
                    </div>

                    <button
                      onClick={() => setIsSnapshotModalOpen(true)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
                    >
                      <Database className="w-4 h-4" />
                      <span>Generate Immutable Snapshot</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Select a connection to view company details.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: LOCAL PORT DISCOVERY */}
        {/* ========================================== */}
        {activeTab === 'Discover' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Candidate Port Auto-Scanner (Localhost)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Probes standard local Tally XML server ports without requiring manual socket configuration.
                  </p>
                </div>
                <button
                  onClick={() => {
                    fetchInitialData();
                    showNotification('info', 'Re-scanned local candidate sockets.');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Sockets</span>
                </button>
              </div>

              <div className="space-y-3">
                {discoveryResults.map((disc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          disc.versionDetected ? 'bg-emerald-400' : 'bg-slate-700'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-white">Port {disc.port} (127.0.0.1:{disc.port})</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{disc.status}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {disc.versionDetected && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          {disc.versionDetected} ({disc.latencyMs}ms)
                        </span>
                      )}
                      {disc.versionDetected && (
                        <button
                          onClick={() => handleTestConnection('127.0.0.1', disc.port)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: ADD CONNECTION */}
        {/* ========================================== */}
        {activeTab === 'Add Connection' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Configure New Tally Server Connection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Establish direct read-only connectivity to local or networked TallyPrime / Tally.ERP 9 instances.
              </p>
            </div>

            <form onSubmit={handleAddConnection} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Connection Label</label>
                <input
                  type="text"
                  value={newConnForm.name}
                  onChange={(e) => setNewConnForm({ ...newConnForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Host / IP Address</label>
                  <input
                    type="text"
                    value={newConnForm.host}
                    onChange={(e) => setNewConnForm({ ...newConnForm, host: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Port</label>
                  <input
                    type="number"
                    value={newConnForm.port}
                    onChange={(e) => setNewConnForm({ ...newConnForm, port: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Protocol</label>
                <select
                  value={newConnForm.protocol}
                  onChange={(e) => setNewConnForm({ ...newConnForm, protocol: e.target.value as ProtocolType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="HTTP">HTTP (Standard Tally XML Socket)</option>
                  <option value="HTTPS">HTTPS (Encrypted TLS Tunnel)</option>
                  <option value="Local IPC">Local IPC (Memory Pipe)</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection()}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition"
                >
                  {isTesting ? 'Testing Socket...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow"
                >
                  Save & Connect
                </button>
              </div>

              {testResult && (
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1 mt-3">
                  <div className="font-semibold text-emerald-400">✓ {testResult.message}</div>
                  <div className="text-slate-300">Detected Version: <strong>{testResult.tallyVersion}</strong></div>
                  <div className="text-slate-400">Latency: {testResult.latencyMs}ms • Accessible Companies: {testResult.companyCount}</div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: DIAGNOSTICS */}
        {/* ========================================== */}
        {activeTab === 'Diagnostics' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Connection Diagnostics & Telemetry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verifies socket health, latency benchmarks, XML parser safety, and read-only protocol enforcement.
                </p>
              </div>

              {diagnostics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">Socket Metrics</span>
                    <div>Target Socket: <strong className="text-white">{diagnostics.host}:{diagnostics.port} ({diagnostics.protocol})</strong></div>
                    <div>Roundtrip Latency: <strong className="text-emerald-400">{diagnostics.latencyMs}ms</strong></div>
                    <div>Last HTTP Status: <strong className="text-emerald-400">{diagnostics.lastResponseCode} OK</strong> (in {diagnostics.lastResponseDurationMs}ms)</div>
                    <div>SSL Certificate Status: <strong className="text-slate-400">{diagnostics.sslCertificateStatus}</strong></div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">Security Guard</span>
                    <div className="text-emerald-400 font-semibold">{diagnostics.securityGuardStatus}</div>
                    <div className="text-slate-400">XXE Injection Defense: <strong className="text-slate-200">Active (Entity Expansion Blocked)</strong></div>
                    <div className="text-slate-400">Write-Operation Blocker: <strong className="text-slate-200">Enforced (HTTP 403 Hard Rejection)</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: CAPABILITIES */}
        {/* ========================================== */}
        {activeTab === 'Capabilities' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Tally Capability Detector (ICapabilityDetector)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Probes accessible Tally modules to confirm schema availability before executing queries.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedConnection?.capabilities.map((cap) => (
                  <div key={cap.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-semibold">
                          {cap.category}
                        </span>
                        <span className="font-bold text-white">{cap.name}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{cap.details}</p>
                    </div>

                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {cap.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: ADAPTERS & SDK */}
        {/* ========================================== */}
        {activeTab === 'Adapters & SDK' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Connector SDK & Protocol Adapter Registry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extensible adapter framework abstracting TallyPrime 4.x, Tally.ERP 9, and universal file parsers.
                </p>
              </div>

              <div className="space-y-3">
                {adapters.map((adp) => (
                  <div key={adp.adapterId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{adp.name}</span>
                        <span className="text-[11px] text-purple-300 font-mono">v{adp.version}</span>
                      </div>
                      <p className="text-slate-400">
                        Supported Protocols: <strong className="text-slate-200">{adp.supportedProtocols.join(', ')}</strong> • Versions: <strong className="text-slate-200">{adp.supportedTallyVersions.join(', ')}</strong>
                      </p>
                      <div className="text-[10px] text-slate-500">Author: {adp.author} • Production Verified</div>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {adp.health}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 7: IMPORT CENTER */}
        {/* ========================================== */}
        {activeTab === 'Import Center' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Universal Import Center (XML / JSON / CSV / XLSX)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Stage, validate, map, and publish external accounting files into the canonical data catalog.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {datasets.map((ds) => (
                  <div key={ds.datasetId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                            {ds.sourceFormat}
                          </span>
                          <h4 className="text-sm font-bold text-white">{ds.name}</h4>
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          {ds.recordCount} Records • Published into Canonical Catalog
                        </p>
                      </div>

                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {ds.status}
                      </span>
                    </div>

                    {/* Field Mappings Preview */}
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="font-semibold text-slate-300 block">Canonical Field Mappings:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ds.fields.map((f, i) => (
                          <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">{f.fieldName}</span>
                            <span className="text-blue-400 font-semibold">→ {f.canonicalName} ({f.inferredType})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: SNAPSHOTS */}
        {/* ========================================== */}
        {activeTab === 'Snapshots' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>Immutable Snapshots & Offline Engine</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Point-in-time cryptographic captures enabling offline analysis, historical reproducibility, and diff tracking.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCompareSnapshots()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Compare Snapshots</span>
                  </button>
                  <button
                    onClick={() => setIsSnapshotModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Snapshot</span>
                  </button>
                </div>
              </div>

              {snapshotDiff && (
                <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-300 block">Snapshot Comparison Delta:</span>
                  <p className="text-slate-200">{snapshotDiff.deltaSummary}</p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    +{snapshotDiff.addedRecordsCount} Added Records • ~{snapshotDiff.modifiedRecordsCount} Modified • 0 Removed
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {snapshots.map((snap) => (
                  <div key={snap.snapshotId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-purple-400 font-bold">{snap.snapshotId}</span>
                          <span className="text-sm font-bold text-white">• {snap.companyName}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          Period: {snap.period} • {snap.recordCount} Records (~{(snap.storageSizeBytes / 1000000).toFixed(2)} MB)
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 text-xs font-bold rounded bg-blue-950 text-blue-300 border border-blue-800">
                          TALLY SNAPSHOT — {snap.createdAt.slice(0, 10)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">SHA-256: {snap.integrityHash}</span>
                      <span className="text-emerald-400 font-sans font-semibold text-[10px] uppercase ml-2">Verified Seal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 9: DATA FILE ANALYZER */}
        {/* ========================================== */}
        {activeTab === 'Data File Analyzer' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>Tally Data File & Diagnostic Analyzer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspects file formats, magic signatures, and metadata without attempting invalid decoding of proprietary binaries.
                </p>
              </div>

              {/* Sample Files to Probe */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                {['Tally_DayBook_Export.xml', 'Company_Master_Ledgers.json', 'Tally_Company_Data.dat'].map((fn, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFileToAnalyze(fn);
                      handleAnalyzeFile(fn);
                    }}
                    className={`px-3 py-1.5 rounded-lg border transition ${
                      fileToAnalyze === fn
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Inspect {fn}
                  </button>
                ))}
              </div>

              {fileAnalysisResult && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{fileAnalysisResult.fileName}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        fileAnalysisResult.isParsable
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {fileAnalysisResult.detectedFormat}
                    </span>
                  </div>

                  <p className="text-slate-300">{fileAnalysisResult.diagnosticMessage}</p>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px] text-slate-400">
                    <div>Encoding: {fileAnalysisResult.encoding}</div>
                    <div>File Size: {(fileAnalysisResult.fileSizeBytes / 1000000).toFixed(2)} MB</div>
                    <div>Signatures: {fileAnalysisResult.recognizedSignatures.join(', ')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 10: HISTORY & AUDITS */}
        {/* ========================================== */}
        {activeTab === 'History & Audits' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Connection Audit Logs & Blocked-Write Guard</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monotonically logs connection events and records blocked write attempts to preserve strict read-only compliance.
                </p>
              </div>

              {/* Blocked Writes Banner */}
              {blockedWrites.length > 0 && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-rose-300 block flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Blocked Write Attempts ({blockedWrites.length})</span>
                  </span>
                  {blockedWrites.map((blk) => (
                    <div key={blk.logId} className="p-2.5 bg-slate-950 rounded border border-rose-900/60 space-y-1">
                      <div className="flex items-center justify-between text-rose-300 font-mono text-[11px]">
                        <span>{blk.endpointAttempted}</span>
                        <span>{blk.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{blk.auditAction}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Audit Stream */}
              <div className="space-y-2 text-xs">
                {auditLogs.map((aud) => (
                  <div key={aud.logId} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{aud.action}</span>
                        <span className="text-slate-400">• {aud.actor}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{aud.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{aud.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: CREATE SNAPSHOT */}
      {/* ========================================== */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Immutable Tally Snapshot</h3>
            <p className="text-xs text-slate-400">
              Extract and cryptographically seal point-in-time accounting datasets for offline analysis.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company</label>
                <input
                  type="text"
                  value="Acme Enterprise Ltd (HO)"
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Period Scope</label>
                <input
                  type="text"
                  value={snapshotPeriod}
                  onChange={(e) => setSnapshotPeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400">
                Estimated Size: ~4.8 MB (~2,840 records across Ledgers, Vouchers, Stock & GST)
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsSnapshotModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
              >
                Create Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
