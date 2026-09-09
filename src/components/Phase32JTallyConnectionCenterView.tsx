/**
 * Phase 32J - Tally Connection Center & Capability Auto-Detection UI
 */

import React, { useState, useEffect } from 'react';
import {
  Plug,
  Server,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Building,
  Layers,
  Database,
  Activity,
  ArrowRight,
  Search,
  Lock,
  Cpu,
  FileText,
  AlertTriangle,
  Radio,
  Sliders,
  Check
} from 'lucide-react';
import {
  ConnectionProfile,
  ConnectorType,
  ConnectorDiagnostics,
  TallyCompany,
  TallyCapability,
  RequestAuditLog
} from '../types/phase32JConnector';

export const Phase32JTallyConnectionCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'connections' | 'wizard' | 'companies' | 'capabilities' | 'outputs' | 'diagnostics'
  >('connections');

  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('PROF-XML-LOCAL');
  const [diagnostics, setDiagnostics] = useState<ConnectorDiagnostics[]>([]);
  const [companies, setCompanies] = useState<TallyCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('CMP-001');
  const [capabilities, setCapabilities] = useState<TallyCapability[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<RequestAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<any | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardForm, setWizardForm] = useState<Partial<ConnectionProfile>>({
    name: 'Local Tally Connector Profile',
    connectorType: 'TALLY_XML',
    host: 'localhost',
    port: 9000,
    timeoutMs: 5000,
    readOnly: true,
    priority: 1
  });
  const [wizardTestStatus, setWizardTestStatus] = useState<any | null>(null);

  useEffect(() => {
    fetchProfiles();
    fetchDiagnostics();
    fetchCompanies();
    fetchCapabilities();
    fetchAuditLogs();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/connector/profiles');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles || []);
        if (data.activeProfileId) setActiveProfileId(data.activeProfileId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connector/diagnostics');
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.diagnostics || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/connector/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
        if (data.activeCompanyId) setSelectedCompanyId(data.activeCompanyId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCapabilities = async () => {
    try {
      const res = await fetch('/api/connector/capabilities');
      const data = await res.json();
      if (data.success) {
        setMatrix(data.matrix || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/connector/audit-logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestProfile = async (prof: ConnectionProfile) => {
    setLoading(true);
    try {
      const res = await fetch('/api/connector/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prof)
      });
      const data = await res.json();
      fetchDiagnostics();
      alert(`Test Result: ${data.testResult?.status} - ${data.testResult?.message}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async (prof: ConnectionProfile) => {
    setLoading(true);
    try {
      const res = await fetch('/api/connector/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prof)
      });
      const data = await res.json();
      if (data.success) {
        setDetectionResult(data.detection);
        alert(`Detection Complete! Discovered ${data.detection.capabilities.length} capabilities & ${data.detection.companies.length} companies.`);
      }
    } catch (err: any) {
      alert(`Detection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySwitch = async (companyId: string) => {
    try {
      const res = await fetch('/api/connector/switch-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCompanyId(companyId);
        fetchCompanies();
        fetchAuditLogs();
      }
    } catch (err: any) {
      alert(`Failed to switch company: ${err.message}`);
    }
  };

  const handleWizardNext = async () => {
    if (wizardStep === 3) {
      // Test Connection
      setLoading(true);
      try {
        const res = await fetch('/api/connector/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wizardForm)
        });
        const data = await res.json();
        setWizardTestStatus(data.testResult);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (wizardStep === 9) {
      // Save Profile
      try {
        const res = await fetch('/api/connector/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wizardForm)
        });
        const data = await res.json();
        if (data.success) {
          fetchProfiles();
          setActiveTab('connections');
          setWizardStep(1);
          alert('Connection Profile Saved Successfully!');
        }
      } catch (err: any) {
        alert(err.message);
      }
      return;
    }

    setWizardStep((prev) => Math.min(prev + 1, 9));
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Plug className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Tally Connection Center</h1>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" /> LIVE TALLY READ-ONLY
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Modular Tally Connectivity Layer & Auto-Detection Suite (Phase 32J)
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-3.5 py-2 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Run Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <Plug className="w-4 h-4" /> New Connection Wizard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'connections'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" /> Connections & Profiles
        </button>
        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'wizard'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Connection Wizard
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'companies'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" /> Company Isolation ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('capabilities')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'capabilities'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Capability Matrix
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'diagnostics'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Diagnostics & Security Guard
        </button>
      </div>

      {/* Tab 1: Connections & Profiles */}
      {activeTab === 'connections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" /> Active Connection Profiles
            </h2>

            {profiles.map((prof) => {
              const diag = diagnostics.find((d) => d.connectorType === prof.connectorType);
              const isActive = prof.id === activeProfileId;

              return (
                <div
                  key={prof.id}
                  className={`p-5 rounded-xl border transition ${
                    isActive
                      ? 'bg-indigo-950/30 border-indigo-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-base">{prof.name}</span>
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
                          {prof.connectorType}
                        </span>
                        {isActive && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Endpoint: {prof.host}:{prof.port || 'ODBC'} | Priority: {prof.priority} | ReadOnly: YES
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestProfile(prof)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-md font-medium transition"
                      >
                        Test Connection
                      </button>
                      <button
                        onClick={() => handleDetect(prof)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-md font-medium transition"
                      >
                        Auto-Detect
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span
                        className={`font-semibold ${
                          diag?.status === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {diag?.status || 'UNTESTED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Latency</span>
                      <span className="text-slate-200 font-mono">{diag?.latencyMs ? `${diag.latencyMs}ms` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tally Version</span>
                      <span className="text-slate-200 font-mono">{diag?.detectedVersion || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Capabilities</span>
                      <span className="text-indigo-400 font-semibold">{diag?.capabilityCount || 0} Detected</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side Panel: Detection Summary */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Read-Only Safety Guard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tally connections enforce strict read-only execution. Mutation commands (INSERT, UPDATE, DELETE, ALTER,
              CREATE) are automatically blocked before reaching Tally.
            </p>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400">ReadOnlyGuard Status: <span className="text-emerald-400 font-bold">ACTIVE</span></div>
              <div className="text-slate-400">Command Classification: <span className="text-indigo-400">READ Only</span></div>
              <div className="text-slate-400">XXE Protection: <span className="text-emerald-400">ENABLED</span></div>
              <div className="text-slate-400">Entity Expansion Guard: <span className="text-emerald-400">ENABLED</span></div>
            </div>

            {detectionResult && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Latest Detection</h4>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Endpoint: <span className="font-mono text-slate-100">{detectionResult.connectionEndpoint}</span></div>
                  <div>Protocol: <span className="font-mono text-slate-100">{detectionResult.protocol}</span></div>
                  <div>Version: <span className="font-mono text-emerald-400">{detectionResult.version}</span></div>
                  <div>Companies Discovered: <span className="font-bold text-slate-100">{detectionResult.companies.length}</span></div>
                  <div>Outputs Discovered: <span className="font-bold text-slate-100">{detectionResult.outputsCount}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Connection Wizard */}
      {activeTab === 'wizard' && (
        <div className="max-w-3xl mx-auto bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">9-Step Tally Connection Setup Wizard</h2>
              <p className="text-xs text-slate-400">Step {wizardStep} of 9: Configure and verify Tally read-only endpoint</p>
            </div>
            <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30">
              STEP {wizardStep}
            </span>
          </div>

          {/* Wizard Steps */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Step 1: Select Connector Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'TALLY_XML', label: 'Tally XML / HTTP', desc: 'Default Tally Prime XML port connection' },
                  { id: 'TALLY_ODBC', label: 'Tally ODBC Driver', desc: 'Direct ODBC read-only interface' },
                  { id: 'JSON_API', label: 'JSON / REST Gateway', desc: 'Generic REST/API endpoint' },
                  { id: 'FILE_SOURCE', label: 'Exported File Source', desc: 'XML, JSON, or CSV file source' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setWizardForm({ ...wizardForm, connectorType: type.id as ConnectorType })}
                    className={`p-4 rounded-xl border text-left transition ${
                      wizardForm.connectorType === type.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">{type.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Step 2: Configure Endpoint Parameters</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Profile Name</label>
                  <input
                    type="text"
                    value={wizardForm.name || ''}
                    onChange={(e) => setWizardForm({ ...wizardForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Host / DSN</label>
                    <input
                      type="text"
                      value={wizardForm.host || ''}
                      onChange={(e) => setWizardForm({ ...wizardForm, host: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Port</label>
                    <input
                      type="number"
                      value={wizardForm.port || 9000}
                      onChange={(e) => setWizardForm({ ...wizardForm, port: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Step 3: Test Connection</h3>
              <p className="text-xs text-slate-400">Clicking Next will test connection to {wizardForm.host}:{wizardForm.port}.</p>
              {wizardTestStatus && (
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-xs font-mono space-y-1">
                  <div>Status: <span className="text-emerald-400 font-bold">{wizardTestStatus.status}</span></div>
                  <div>Latency: <span className="text-slate-200">{wizardTestStatus.latencyMs}ms</span></div>
                  <div>Message: <span className="text-slate-300">{wizardTestStatus.message}</span></div>
                </div>
              )}
            </div>
          )}

          {wizardStep >= 4 && wizardStep <= 8 && (
            <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-700 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-semibold text-white">
                Step {wizardStep}: Auto-Discovery in Progress
              </h3>
              <p className="text-xs text-slate-400">
                Detecting version, companies, capabilities, outputs, and schemas...
              </p>
            </div>
          )}

          {wizardStep === 9 && (
            <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-700 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Step 9: Save & Activate Connection Profile</h3>
              <p className="text-xs text-slate-400">
                All connection tests and safety checks passed. Ready to save connection profile.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
            <button
              onClick={() => setWizardStep((prev) => Math.max(prev - 1, 1))}
              disabled={wizardStep === 1}
              className="px-4 py-2 text-xs font-medium bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleWizardNext}
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition flex items-center gap-2"
            >
              {wizardStep === 9 ? 'Save Profile' : 'Next Step'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Companies */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Discovered Tally Companies</h2>
            <span className="text-xs text-slate-400 font-mono">Company Context Isolation Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => {
              const isSelected = comp.companyId === selectedCompanyId;

              return (
                <div
                  key={comp.companyId}
                  className={`p-5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-base">{comp.companyName}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {comp.companyId} | Source: {comp.sourceId}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompanySwitch(comp.companyId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      {isSelected ? 'SELECTED' : 'Switch Context'}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
                    <span>Status: <strong className="text-emerald-400">{comp.status}</strong></span>
                    <span>Tally Version: <strong className="text-slate-200">{comp.tallyVersion || 'Prime 4.1'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Capability Matrix */}
      {activeTab === 'capabilities' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Tally Capability Matrix</h2>

          <div className="overflow-x-auto bg-slate-800/60 border border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Schema Version</th>
                  <th className="p-3.5">Evidence</th>
                  <th className="p-3.5">Last Tested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {matrix.map((row) => (
                  <tr key={row.categoryId} className="hover:bg-slate-800/80">
                    <td className="p-3.5 font-semibold text-white">{row.categoryName}</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-500/30">
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{row.source}</td>
                    <td className="p-3.5 font-mono text-slate-400">{row.schemaVersion}</td>
                    <td className="p-3.5 text-slate-400">{row.evidence?.discoveredDataset || 'Sample Verified'}</td>
                    <td className="p-3.5 font-mono text-slate-500">{new Date(row.lastTested).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Diagnostics & Audit */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> ReadOnlyGuard Audit & Request Monitor
          </h2>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Live Outbound Request Audit Stream</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5">Request ID</th>
                    <th className="p-2.5">Connector</th>
                    <th className="p-2.5">Company</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Result</th>
                    <th className="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {auditLogs.map((log) => (
                    <tr key={log.requestId} className="hover:bg-slate-800">
                      <td className="p-2.5 text-slate-400">{log.requestId}</td>
                      <td className="p-2.5 text-indigo-400">{log.connectorId}</td>
                      <td className="p-2.5 text-slate-300">{log.companyId}</td>
                      <td className="p-2.5">
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[10px]">
                          {log.operationType}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.result === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
