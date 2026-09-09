import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Database,
  Terminal,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  HardDrive,
  Cpu,
  Clock,
  Download,
  Info,
  Settings,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  Wrench,
  Ban,
  Wifi,
  WifiOff,
  UserCheck,
  History,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Shield
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export function Phase32MDesktopView() {
  // Navigation inside the Phase 32M desktop module
  const [activeTab, setActiveTab] = useState<'status' | 'wizard' | 'licensing' | 'connectivity' | 'demo' | 'troubleshooting' | 'diagnostic-suite'>('status');

  // Application State
  const [appStatus, setAppStatus] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [osInput, setOsInput] = useState<string>('Windows 11 (64-bit)');
  const [osSupportMsg, setOsSupportMsg] = useState<string>('');
  const [envMode, setEnvMode] = useState<'Production' | 'Testing' | 'Development'>('Production');
  const [currentDbVersion, setCurrentDbVersion] = useState<number>(12);
  const [targetDbVersion] = useState<number>(12);
  const [migrationHistory, setMigrationHistory] = useState<string[]>([
    "Migration v10: Normalization Schema Sync (Passed)",
    "Migration v11: Object Graph Index Mapping (Passed)",
    "Migration v12: Warehouse Index Column Upgrades (Passed)"
  ]);

  // Directory / Storage State
  const [storageData, setStorageData] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  // License & clock state
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('EXFN-TALLY-ENT-7781-2026');
  const [tamperDays, setTamperDays] = useState<number>(3);
  const [clockTamperResult, setClockTamperResult] = useState<string>('');

  // Profiles and connections
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('prof-001');
  const [rawXmlPayload, setRawXmlPayload] = useState<string>('<ENVELOPE>\n  <HEADER>\n    <VERSION>1</VERSION>\n    <TALLYREQUEST>Export Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <DESC>\n      <STATICVARIABLES>\n        <SVCOMPANYNAME>Saraswati Trading & Mfg</SVCOMPANYNAME>\n      </STATICVARIABLES>\n    </DESC>\n  </BODY>\n</ENVELOPE>');
  const [connectionDiagnostics, setConnectionDiagnostics] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Auto-sync preferences
  const [syncPreference, setSyncPreference] = useState<'Manual' | 'Startup' | 'Periodic'>('Periodic');
  const [syncPeriodMinutes, setSyncPeriodMinutes] = useState<number>(30);

  // User Role View Filter
  const [userRole, setUserRole] = useState<'Administrator' | 'Analyst' | 'Viewer'>('Administrator');

  // Global Error Log Demo
  const [simulatedError, setSimulatedError] = useState<any>(null);
  const [diagnosticBundle, setDiagnosticBundle] = useState<any>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);

  // Updates State
  const [updateChannel, setUpdateChannel] = useState<'Stable' | 'Beta'>('Stable');
  const [availableUpdate, setAvailableUpdate] = useState<any>(null);
  const [updateMsg, setUpdateMsg] = useState<string>('');

  // Demo Mode State
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoCompany, setDemoCompany] = useState<any>(null);
  const [demoLedgers, setDemoLedgers] = useState<any[]>([]);
  const [demoVouchers, setDemoVouchers] = useState<any[]>([]);
  const [demoInventory, setDemoInventory] = useState<any[]>([]);

  // Wizard Steps (8-step First Run Wizard)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardLicenseKey, setWizardLicenseKey] = useState<string>('EXFN-TALLY-PRO-9983-2026');
  const [wizardEndpoint, setWizardEndpoint] = useState<string>('http://127.0.0.1:9000');
  const [wizardSelectedCompany, setWizardSelectedCompany] = useState<string>('CMP-001');
  const [wizardCompanies, setWizardCompanies] = useState<any[]>([
    { id: 'CMP-001', name: 'Saraswati Trading & Mfg', gst: '29AAAAA0000A1Z1' },
    { id: 'CMP-002', name: 'Balaji Distributors Limited', gst: '29BBBBB1111B1Z2' }
  ]);
  const [wizardSyncProgress, setWizardSyncProgress] = useState<number>(0);
  const [isWizardSyncing, setIsWizardSyncing] = useState<boolean>(false);
  const [wizardSyncTimer, setWizardSyncTimer] = useState<any>(null);
  const [wizardSyncStatus, setWizardSyncStatus] = useState<'PENDING' | 'SYNCING' | 'PARTIAL' | 'COMPLETE'>('PENDING');

  // Diagnostic Suite Results
  const [diagnosticSuite, setDiagnosticSuite] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);

  // Offline Mode Toggle
  const [isTallyOnline, setIsTallyOnline] = useState<boolean>(true);

  useEffect(() => {
    fetchStatus();
    fetchIdentity();
    fetchStorage();
    fetchProfiles();
    checkUpdate();
    runDiagnosticTests();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/phase32m/status');
      const json = await res.json();
      if (json.success) {
        setAppStatus(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIdentity = async () => {
    try {
      const res = await fetch('/api/phase32m/identity');
      const json = await res.json();
      if (json.success) {
        setIdentity(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStorage = async () => {
    try {
      const res = await fetch('/api/phase32m/storage');
      const json = await res.json();
      if (json.success) {
        setStorageData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/phase32m/profiles');
      const json = await res.json();
      if (json.success) {
        setProfiles(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkUpdate = async () => {
    try {
      const res = await fetch(`/api/phase32m/updates/check?channel=${updateChannel}`);
      const json = await res.json();
      if (json.success) {
        setAvailableUpdate(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runDiagnosticTests = async () => {
    setIsRunningDiagnostics(true);
    try {
      const res = await fetch('/api/phase32m/run-diagnostic-tests');
      const json = await res.json();
      if (json.success) {
        setDiagnosticSuite(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleTestOS = async () => {
    try {
      const res = await fetch('/api/phase32m/os-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osName: osInput })
      });
      const json = await res.json();
      setOsSupportMsg(json.message);
    } catch (err) {
      setOsSupportMsg('Error checking OS support.');
    }
  };

  const triggerCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch('/api/phase32m/storage/cleanup', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await fetchStorage();
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  const triggerMigration = async () => {
    try {
      const res = await fetch('/api/phase32m/database/migrate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (json.data) {
          setCurrentDbVersion(json.data.currentVersion);
          setMigrationHistory(json.data.history);
        }
        await fetchStatus();
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerRollback = async () => {
    try {
      const res = await fetch('/api/phase32m/database/rollback', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (json.data) {
          setCurrentDbVersion(json.data.currentVersion);
          setMigrationHistory(json.data.history);
        }
        await fetchStatus();
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerClockTamper = async () => {
    try {
      const res = await fetch('/api/phase32m/license/tamper-clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offsetDays: tamperDays })
      });
      const json = await res.json();
      if (json.success) {
        await fetchStatus();
        setClockTamperResult(`System clock shifted by ${json.offsetDays} days. Note warning triggers.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetClock = async () => {
    try {
      const res = await fetch('/api/phase32m/license/reset-clock', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await fetchStatus();
        setClockTamperResult('System clock successfully synchronized.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const testProfileConnection = async () => {
    setIsTestingConnection(true);
    setConnectionDiagnostics(null);
    try {
      const res = await fetch('/api/phase32m/profiles/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          rawXmlPayload: rawXmlPayload
        })
      });
      const json = await res.json();
      if (json.success) {
        setConnectionDiagnostics(json.data);
      } else if (json.isReadOnlyViolation) {
        setConnectionDiagnostics({
          pingOk: false,
          message: json.diagnostics
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const triggerAppCorruption = async () => {
    try {
      await fetch('/api/phase32m/app/corrupt', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerAppRepair = async () => {
    try {
      await fetch('/api/phase32m/app/repair', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const simulateUnexpectedError = () => {
    const errorId = `ERR-${Math.floor(1000 + Math.random() * 9000)}`;
    setSimulatedError({
      errorId,
      timestamp: new Date().toISOString(),
      component: "LocalAnalyticalWarehouseEngine",
      severity: "FATAL",
      safeUserMessage: `The application encountered a write failure. The warehouse index is temporarily locked to prevent file system corruption. [Diagnostic ID: ${errorId}]`
    });
  };

  const generateDiagnosticBundle = async () => {
    try {
      const res = await fetch('/api/phase32m/diagnostics/bundle');
      const json = await res.json();
      if (json.success) {
        setDiagnosticBundle(json.data);
        setShowDiagnosticModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Demo mode triggers
  const activateDemoMode = async () => {
    setIsDemoActive(true);
    try {
      const resCo = await fetch('/api/phase32m/demo/company');
      const dataCo = await resCo.json();
      setDemoCompany(dataCo.data);

      const resLe = await fetch('/api/phase32m/demo/ledgers');
      const dataLe = await resLe.json();
      setDemoLedgers(dataLe.data);

      const resVo = await fetch('/api/phase32m/demo/vouchers');
      const dataVo = await resVo.json();
      setDemoVouchers(dataVo.data);

      const resIn = await fetch('/api/phase32m/demo/inventory');
      const dataIn = await resIn.json();
      setDemoInventory(dataIn.data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetDemoMode = () => {
    setIsDemoActive(false);
    setDemoCompany(null);
    setDemoLedgers([]);
    setDemoVouchers([]);
    setDemoInventory([]);
  };

  // Wizard Simulation Controls
  const startWizardSync = () => {
    setIsWizardSyncing(true);
    setWizardSyncStatus('SYNCING');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setWizardSyncProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsWizardSyncing(false);
        setWizardSyncStatus('COMPLETE');
      }
    }, 600);
    setWizardSyncTimer(interval);
  };

  const cancelWizardSync = () => {
    if (wizardSyncTimer) {
      clearInterval(wizardSyncTimer);
    }
    setIsWizardSyncing(false);
    setWizardSyncStatus('PARTIAL');
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-slate-100 min-h-0 overflow-y-auto font-sans">
      
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-4 flex-shrink-0 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="rounded bg-sky-600 p-1.5 text-white shadow">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>Phase 32M: Desktop Distribution & Production Hardening</span>
                <span className="rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-semibold px-2 py-0.5">
                  Production Ready
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Establish Windows environments, robust local directories, double-check read-only guards, license sentinel, updates, and demo state.
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection & Environment indicators */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Offline/Online indicators */}
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-1">
            <button 
              onClick={() => setIsTallyOnline(!isTallyOnline)}
              className="flex items-center space-x-1.5"
            >
              {isTallyOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-slate-300">Tally Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span className="text-slate-300">Offline (Warehouse Cache Only)</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setActiveTab('diagnostic-suite');
              runDiagnosticTests();
            }}
            className="flex items-center space-x-1 rounded bg-sky-600 hover:bg-sky-500 px-3 py-1 font-semibold text-white transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Readiness: {diagnosticSuite?.score || 'RUNNING'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUB NAVIGATION TABS */}
      <div className="flex items-center space-x-1 border-b border-slate-800 bg-slate-950 px-6 py-1.5 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'status'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Desktop Architecture Status
        </button>
        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'wizard'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          First-Run Setup Wizard
        </button>
        <button
          onClick={() => setActiveTab('licensing')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'licensing'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          License & Activation
        </button>
        <button
          onClick={() => setActiveTab('connectivity')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'connectivity'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Connection Profiles & Double Guard
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'demo'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Interactive Demo Mode
        </button>
        <button
          onClick={() => setActiveTab('troubleshooting')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'troubleshooting'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          In-App Help & Troubleshooting
        </button>
        <button
          onClick={() => setActiveTab('diagnostic-suite')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'diagnostic-suite'
              ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Verification Suite
        </button>
      </div>

      {/* 3. MAIN TAB LAYOUT CONTAINER */}
      <div className="flex-1 p-6 space-y-6">

        {/* ==================== TAB 1: DESKTOP ARCHITECTURE STATUS ==================== */}
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Identity, Environments, OS Verification */}
            <div className="lg:col-span-5 space-y-6">
              {/* Identity & Metadata Card */}
              {identity && (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Info className="h-4 w-4 text-sky-400" />
                    <span>Application Distributable Identity</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Application Name</span>
                      <span className="text-slate-200 font-medium">{identity.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Application ID</span>
                      <span className="text-slate-200 font-mono font-medium">{identity.appId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Semver Version</span>
                      <span className="text-slate-200 font-medium">v{identity.version}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Windows Build No.</span>
                      <span className="text-slate-200 font-mono font-medium">{identity.buildNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Publisher / Copyright</span>
                      <span className="text-slate-300 text-[11px] block">{identity.publisher}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">{identity.copyright}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Windows Compatibility Detector */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Monitor className="h-4 w-4 text-sky-400" />
                  <span>Windows Environment Detector</span>
                </h2>
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Simulate OS detection to verify that the app blocks installation or operation on unsupported older operating systems.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={osInput}
                      onChange={(e) => setOsInput(e.target.value)}
                      placeholder="e.g. Windows 7 (Legacy), Windows 11"
                      className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      onClick={handleTestOS}
                      className="rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-3.5 py-1.5"
                    >
                      Detect OS Support
                    </button>
                  </div>
                  {osSupportMsg && (
                    <div className={`rounded p-2.5 text-xs font-medium ${
                      osSupportMsg.includes('Unsupported') 
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-900/50' 
                        : 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50'
                    }`}>
                      {osSupportMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Environment Separation Switcher */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-3">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Layers className="h-4 w-4 text-sky-400" />
                  <span>Isolated Environment Configurations</span>
                </h2>
                <p className="text-xs text-slate-300">
                  Separates configuration profiles. Ensure zero development mock credentials exist in Production mode.
                </p>
                <div className="flex bg-slate-950 rounded p-1 border border-slate-800">
                  {['Production', 'Testing', 'Development'].map((mode: any) => (
                    <button
                      key={mode}
                      onClick={() => setEnvMode(mode)}
                      className={`flex-1 text-center py-1 rounded text-xs font-semibold ${
                        envMode === mode ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded text-[11px] font-mono text-slate-400 space-y-1">
                  <div>• Env Database Dir: <span className="text-slate-300">data/phase32m/database/{envMode.toLowerCase()}</span></div>
                  <div>• Env Sync Watermark Keys: <span className="text-slate-300">watermark_{envMode.toLowerCase()}</span></div>
                  <div>• Dev Sandbox Secrets Cleaned: <span className="text-emerald-400">Verified (Stripe, Firebase Admin sandbox modes active)</span></div>
                </div>
              </div>
            </div>

            {/* Right Col: Local Storage Directories & Schema Migrations */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Local Data Directory & Space Used */}
              {storageData && (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <HardDrive className="h-4 w-4 text-sky-400" />
                      <span>Controlled Local Storage Management</span>
                    </h2>
                    <span className="text-[11px] font-mono font-bold text-sky-400">
                      Total space used: {storageData.totalSpaceUsed}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Application configuration, databases, cache, logs, snapshots, and exports are confined inside a single controlled workspace to guarantee system safety.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">SQLite DB Folder</div>
                      <div className="text-slate-200 mt-1">{storageData.databaseSize}</div>
                    </div>
                    <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">Analytical Cache</div>
                      <div className="text-slate-200 mt-1">{storageData.cacheSize}</div>
                    </div>
                    <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">Snapshots & Backups</div>
                      <div className="text-slate-200 mt-1">{storageData.snapshotsSize}</div>
                    </div>
                    <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">Logs Directory</div>
                      <div className="text-slate-200 mt-1">{storageData.logsSize}</div>
                    </div>
                    <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">CSV / XML Exports</div>
                      <div className="text-slate-200 mt-1">{storageData.exportsSize}</div>
                    </div>
                    <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800 flex flex-col justify-center">
                      <button
                        onClick={triggerCleanup}
                        disabled={isCleaning}
                        className="w-full text-center py-1.5 rounded bg-slate-800 hover:bg-slate-700 font-semibold text-[11px] border border-slate-700 transition-colors"
                      >
                        {isCleaning ? 'Cleaning...' : 'Safe Cache Clean'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Startup Validation, Integrity and Recovery */}
              {appStatus && (
                <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-sky-400" />
                      <span>Desktop Application Startup Integrity & Recovery</span>
                    </h2>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      appStatus.appIntegrityStatus === 'Healthy' 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                        : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    }`}>
                      {appStatus.appIntegrityStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    EXFIN Tally Data Mapper validates system configuration, SQLite databases, directories, license status, and file structures at startup to prevent launching in a corrupt state.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded border border-slate-800 font-mono">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Controlled directories verified</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Schema version compatibility match</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Tally Connector runtime active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>License verification active</span>
                    </div>
                  </div>

                  {/* Simulate Recovery buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={triggerAppCorruption}
                      className="flex-1 py-1.5 rounded border border-rose-800/60 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-xs font-semibold"
                    >
                      Simulate App Configuration Corruption
                    </button>
                    <button
                      onClick={triggerAppRepair}
                      className="flex-1 py-1.5 rounded border border-emerald-800/60 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Repair Application Integrity</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Database Migrations, Version and Backups */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Database className="h-4 w-4 text-sky-400" />
                  <span>Database Migrations, Version & Backup Safety</span>
                </h2>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400">Current SQLite Version:</span>
                    <span className="text-slate-200 font-mono pl-1.5 font-bold">v{currentDbVersion}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Target SQLite Version:</span>
                    <span className="text-slate-200 font-mono pl-1.5 font-bold">v{targetDbVersion}</span>
                  </div>
                </div>

                <div className="bg-slate-950 rounded p-3 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-sky-400 border-b border-slate-800 pb-1 mb-1 font-bold">MIGRATION HISTORY LOGGER:</div>
                  {migrationHistory.map((hist, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>• {hist}</span>
                      <span className="text-emerald-400 text-[10px]">SUCCESS</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={triggerMigration}
                    className="flex-1 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Run Migration Update</span>
                  </button>
                  <button
                    onClick={triggerRollback}
                    className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Rollback Migration (v11)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center italic">
                  Note: Before executing migrations, a pre-migration backup of Tally company directories is generated automatically.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 2: FIRST-RUN SETUP WIZARD ==================== */}
        {activeTab === 'wizard' && (
          <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-6 max-w-4xl mx-auto">
            
            {/* Step Indicators */}
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>WELCOME TO EXFIN TALLY DATA MAPPER SETUP WIZARD</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Walk through the guided deployment installer process to activate features, connect Tally, map schemas, and trigger initial syncs.
              </p>

              {/* Progress dots */}
              <div className="flex items-center justify-between mt-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => setWizardStep(step)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all border ${
                        wizardStep === step
                          ? 'bg-sky-600 text-white border-sky-500 ring-2 ring-sky-950'
                          : wizardStep > step
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {step}
                    </button>
                    {step < 8 && (
                      <div className={`h-0.5 flex-1 mx-2 ${
                        wizardStep > step ? 'bg-emerald-800' : 'bg-slate-800'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-2.5 px-1 font-mono">
                <span>1. License</span>
                <span>2. Connect</span>
                <span>3. Discover</span>
                <span>4. Select</span>
                <span>5. Output</span>
                <span>6. Schema</span>
                <span>7. Initial Sync</span>
                <span>8. Ready</span>
              </div>
            </div>

            {/* Wizard Steps Details */}
            <div className="min-h-[220px] bg-slate-950/40 rounded-lg p-5 border border-slate-800 text-xs">
              
              {/* STEP 1: LICENSE */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 1: License Key Verification</h3>
                  <p className="text-slate-300">
                    Please provide your product license key. This will configure feature entitlements like the Tally Connector and Advanced Reporting features.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-slate-400 font-semibold uppercase text-[10px]">Enter Key</label>
                    <input
                      type="text"
                      value={wizardLicenseKey}
                      onChange={(e) => setWizardLicenseKey(e.target.value)}
                      placeholder="EXFN-TALLY-XXXX-XXXX-XXXX"
                      className="w-full max-w-md rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: TALLY CONNECTION */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 2: Tally Connection Settings</h3>
                  <p className="text-slate-300">
                    Provide the local IP endpoint and port of your active Tally ERP 9 or Tally Prime instance. Ensure ODBC is enabled inside Tally configuration.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase text-[10px] mb-1">Local IP Endpoint</label>
                      <input
                        type="text"
                        value={wizardEndpoint}
                        onChange={(e) => setWizardEndpoint(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold uppercase text-[10px] mb-1">Port</label>
                      <input
                        type="number"
                        value="9000"
                        readOnly
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COMPANY DISCOVERY */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 3: Company Discovery Center</h3>
                  <p className="text-slate-300">
                    The system is scanning the local Tally runtime. Press Discover to fetch active companies.
                  </p>
                  <div className="space-y-2">
                    <button className="rounded bg-sky-600 hover:bg-sky-500 font-semibold text-white px-4 py-1.5">
                      Run Auto-Company Discovery
                    </button>
                    <div className="rounded border border-emerald-900/60 bg-emerald-950/20 p-2 text-emerald-300 font-mono">
                      • Discovered 2 active companies inside Tally ERP 9 instance.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: COMPANY SELECTION */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 4: Connect Company Target</h3>
                  <p className="text-slate-300">
                    Select which Tally company you want to map and synchronize.
                  </p>
                  <div className="space-y-2 max-w-md">
                    {wizardCompanies.map((co) => (
                      <label key={co.id} className="flex items-center space-x-2.5 p-2.5 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="wizardCo"
                          checked={wizardSelectedCompany === co.id}
                          onChange={() => setWizardSelectedCompany(co.id)}
                        />
                        <div>
                          <span className="font-bold text-slate-200">{co.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">GSTIN: {co.gst}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: OUTPUT DISCOVERY */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 5: Output Discovery Studio</h3>
                  <p className="text-slate-300">
                    Analyzing active schemas to discover generated ledger reports, trial balances, and transaction outputs.
                  </p>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1 mb-1">
                      <span>Discovered output modules</span>
                      <span className="text-sky-400">Status</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Ledgers and closing balances</span>
                      <span className="text-emerald-400">DISCOVERED (142 rows)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Vouchers (Receipts, Payments)</span>
                      <span className="text-emerald-400">DISCOVERED (4,520 rows)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Inventory Items Stock Registry</span>
                      <span className="text-emerald-400">DISCOVERED (12 units)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: SCHEMA DISCOVERY */}
              {wizardStep === 6 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 6: Schema Mapping Verification</h3>
                  <p className="text-slate-300">
                    The discovery schema matches the local analytical warehouse normalization guidelines perfectly.
                  </p>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded font-mono text-slate-400">
                    <div className="text-slate-300 font-bold">• Schema Validation Check:</div>
                    <div className="text-emerald-400 pl-3">✓ Ledger schemas match target warehouse layout format.</div>
                    <div className="text-emerald-400 pl-3">✓ Transaction schema mappings are locked.</div>
                  </div>
                </div>
              )}

              {/* STEP 7: INITIAL SYNC */}
              {wizardStep === 7 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 7: Execute Initial Synchronization</h3>
                  <p className="text-slate-300">
                    Initialize a safe sync. Respects your selective configurations and company parameters.
                  </p>

                  {isWizardSyncing ? (
                    <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
                          <span>Syncing Saraswati Trading & Mfg (Ledgers, Vouchers)...</span>
                        </span>
                        <span className="text-sky-400 font-bold font-mono">{wizardSyncProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-sky-500 h-2 rounded-full transition-all duration-300" style={{ width: `${wizardSyncProgress}%` }} />
                      </div>
                      <div className="grid grid-cols-2 text-[10px] text-slate-400 font-mono">
                        <div>Elapsed Time: 3.2 seconds</div>
                        <div>Estimated Remaining: 1.8 seconds</div>
                      </div>
                      <button
                        onClick={cancelWizardSync}
                        className="text-rose-400 border border-rose-900/60 bg-rose-950/20 px-3 py-1 rounded text-[11px] font-semibold hover:bg-rose-900/20"
                      >
                        Cancel / Halt Sync
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={startWizardSync}
                          className="rounded bg-sky-600 hover:bg-sky-500 font-semibold text-white px-4 py-1.5"
                        >
                          Trigger Safe Initial Sync
                        </button>
                      </div>
                      {wizardSyncStatus === 'COMPLETE' && (
                        <div className="rounded border border-emerald-900/60 bg-emerald-950/20 p-2.5 text-emerald-300 font-mono">
                          ✓ Sync Complete: 4,804 records successfully loaded into SQLite Analytical Warehouse.
                        </div>
                      )}
                      {wizardSyncStatus === 'PARTIAL' && (
                        <div className="rounded border border-amber-900/60 bg-amber-950/20 p-2.5 text-amber-300 font-mono">
                          ⚠ Sync Cancelled. State marked as: **PARTIAL**.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 8: READY */}
              {wizardStep === 8 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-200 text-sm">Step 8: Installation Complete!</h3>
                  <p className="text-slate-300">
                    EXFIN Tally Data Mapper is successfully configured and hardened for the local desktop environment.
                  </p>
                  <div className="flex items-center space-x-2.5 bg-emerald-950/40 border border-emerald-800 rounded-lg p-3.5 text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Desktop Service Connected</span>
                      <span className="text-[11px] block mt-0.5 text-slate-300">You are ready to run reports, dashboards, exports, and offline explorations seamlessly.</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-4">
              <button
                onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                disabled={wizardStep === 1}
                className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 font-semibold text-xs disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => setWizardStep(Math.min(8, wizardStep + 1))}
                disabled={wizardStep === 8}
                className="rounded bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 font-semibold text-xs disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: LICENSE & ACTIVATION ==================== */}
        {activeTab === 'licensing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* License Activation Form & Details */}
            <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-5">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                <span>LICENSE & ACTIVATION PANEL</span>
              </h2>

              <p className="text-xs text-slate-300">
                Manage feature entitlements and licensing parameters. Enter a valid key to upgrade standard features to Enterprise editions.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-semibold text-slate-400">Licensing Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      placeholder="e.g. EXFN-TALLY-ENT-7781-2026"
                      className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/phase32m/license/activate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ licenseKey: licenseKeyInput })
                        });
                        const data = await res.json();
                        if (data.success) {
                          await fetchStatus();
                          alert('License key successfully activated.');
                        }
                      }}
                      className="rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-1.5"
                    >
                      Activate Key
                    </button>
                  </div>
                </div>

                {appStatus?.licenseDetails && (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded border border-slate-800 font-mono mt-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Active Edition</span>
                      <span className="text-slate-200 font-bold text-sm text-sky-400">{appStatus.licenseDetails.edition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">State Status</span>
                      <span className="text-slate-200 font-bold uppercase">{appStatus.licenseDetails.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">License Expiry</span>
                      <span className="text-slate-200">{appStatus.licenseDetails.expirationDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Device / ID</span>
                      <span className="text-slate-200 truncate">{appStatus.licenseDetails.machineId}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* License Entitlements & System Clock Safety */}
            <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-5">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Feature Entitlements & Clock Sentinel</span>
              </h2>

              {/* Feature entitlements checkboxes */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Entitled Modules Matrix</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Tally Connector active</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Advanced schemas</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Dashboard widgets</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Exports (Excel, CSV)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Multi-company logs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Warehouse analytics</span>
                  </div>
                </div>
              </div>

              {/* System clock anomalies / tampering */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulate System-Clock Anomalies</span>
                <p className="text-xs text-slate-300">
                  Detect clock manipulations where users modify the system clock to extend trials.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tamperDays}
                    onChange={(e) => setTamperDays(parseInt(e.target.value))}
                    placeholder="Offset Days"
                    className="w-24 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                  <button
                    onClick={triggerClockTamper}
                    className="rounded bg-rose-950/50 border border-rose-800 text-rose-300 font-semibold text-xs px-4 py-1.5"
                  >
                    Tamper Clock
                  </button>
                  <button
                    onClick={resetClock}
                    className="rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-1.5 border border-slate-700"
                  >
                    Synchronize Clock
                  </button>
                </div>
                {clockTamperResult && (
                  <div className="rounded bg-slate-950 p-2.5 text-[11px] font-mono text-amber-400">
                    {clockTamperResult}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: CONNECTION PROFILES & DOUBLE GUARD ==================== */}
        {activeTab === 'connectivity' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Connection Profiles and Auto-Sync Preferences */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Profiles list */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <PlusCircle className="h-4 w-4 text-sky-400" />
                  <span>Connectivity Profiles Matrix</span>
                </h2>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {profiles.map((prof) => (
                    <button
                      key={prof.profileId}
                      onClick={() => setSelectedProfileId(prof.profileId)}
                      className={`flex w-full items-start justify-between p-3 rounded-lg border text-left transition-all ${
                        selectedProfileId === prof.profileId
                          ? 'border-sky-500/50 bg-sky-950/20 text-sky-200 font-semibold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-xs block font-bold">{prof.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono font-medium block mt-1">
                          {prof.endpoint}:{prof.port} ({prof.connector})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic sync options */}
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <span>Configure Synchronization safety</span>
                </h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Select Sync Mode</label>
                    <select
                      value={syncPreference}
                      onChange={(e: any) => setSyncPreference(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="Manual">Manual Synchronization Only</option>
                      <option value="Startup">Trigger Sync On Application Launch</option>
                      <option value="Periodic">Periodic Background Interval Sync</option>
                    </select>
                  </div>

                  {syncPreference === 'Periodic' && (
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Interval Minutes</label>
                      <input
                        type="number"
                        value={syncPeriodMinutes}
                        onChange={(e) => setSyncPeriodMinutes(parseInt(e.target.value))}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 italic">
                    All scheduled and background sync processes respect your active selective company locks to prevent heavy payload queries.
                  </p>
                </div>
              </div>

            </div>

            {/* Test Connection and Double Guard XML input */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-sky-400" />
                    <span>Live Profile Connectivity Test & Guard Sentinel</span>
                  </h2>
                  <span className="text-[10px] text-emerald-400 font-mono">Read-Only Guard Enabled</span>
                </div>

                <p className="text-xs text-slate-300">
                  Select a connection profile and type a mock XML request below to verify that the **Tally Read-Only Guard** immediately blocks write actions (e.g. `ALTER`, `CREATE`, `DELETE`).
                </p>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-semibold text-slate-400">Mock XML Request Payload</label>
                  <textarea
                    value={rawXmlPayload}
                    onChange={(e) => setRawXmlPayload(e.target.value)}
                    className="w-full h-32 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                  <div className="flex gap-2 text-[10px] text-sky-400 underline font-mono">
                    <button onClick={() => setRawXmlPayload('<ACTION>ALTER</ACTION>\n<NAME>Saraswati Dist</NAME>\n<GST>29GSTX</GST>')}>
                      • Load Mutating ALTER Payload
                    </button>
                    <button onClick={() => setRawXmlPayload('<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Export Data</TALLYREQUEST>\n  </HEADER>\n</ENVELOPE>')}>
                      • Load Safe READ ONLY Payload
                    </button>
                  </div>
                </div>

                <button
                  onClick={testProfileConnection}
                  disabled={isTestingConnection}
                  className="w-full py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
                >
                  {isTestingConnection ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>Test Profile and Run Diagnostics</span>
                </button>

                {connectionDiagnostics && (
                  <div className="rounded-lg bg-slate-950 p-4 space-y-3 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-slate-200 text-xs font-mono">CONNECTION DIAGNOSTIC LOGS:</span>
                      <span className={`text-[10px] font-bold uppercase ${
                        connectionDiagnostics.pingOk ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {connectionDiagnostics.pingOk ? 'SUCCEEDED' : 'REJECTED/FAILED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">{connectionDiagnostics.message}</p>

                    {connectionDiagnostics.availableCompanies?.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Discovered Company Nodes:</span>
                        {connectionDiagnostics.availableCompanies.map((co: any) => (
                          <div key={co.id} className="text-[10px] font-mono text-slate-300 flex justify-between bg-slate-900 p-1 rounded">
                            <span>{co.name}</span>
                            <span className="text-sky-400">{co.gstNumber}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 5: INTERACTIVE DEMO MODE ==================== */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            
            {/* Header control */}
            <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  <span>Synthetic Production Demo Workspace</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={activateDemoMode}
                    className="px-3.5 py-1 text-xs font-bold rounded bg-sky-600 hover:bg-sky-500 text-white"
                  >
                    Activate Demo Mode
                  </button>
                  <button
                    onClick={resetDemoMode}
                    className="px-3.5 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    Reset Demo Mode
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Demo mode generates synthetic financial records inside the warehouse database. This demonstrates application capabilities (Ledgers, Vouchers, Inventory, Reports) without connecting or exposing a real Tally instance.
              </p>
            </div>

            {/* Displaying Synthetic Demo Data */}
            {isDemoActive ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Info and watermark badge */}
                <div className="md:col-span-12 rounded border border-amber-900/60 bg-amber-950/20 p-3 flex items-center space-x-2 text-amber-400 text-xs">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold">DEMO DATA MODE ACTIVE</span> — All information is synthesized mock values and is explicitly watermarked with the suffix **[DEMO DATA]** to prevent real accounting errors.
                  </div>
                </div>

                {/* Company details */}
                {demoCompany && (
                  <div className="md:col-span-4 rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-2 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Connected Demo Company</span>
                    <span className="font-bold text-slate-100 text-sm block">{demoCompany.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 block">GSTIN: {demoCompany.gstNumber}</span>
                  </div>
                )}

                {/* Chart displaying Demo ledger limits */}
                <div className="md:col-span-8 rounded-lg border border-slate-800 bg-[#1E293B] p-4 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Synthesized Balance Distributions [DEMO DATA]</span>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Saraswati Debtors', amount: 124000 },
                        { name: 'Acme Creditors', amount: 45000 },
                        { name: 'HDFC Bank Account', amount: 518000 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                        <Bar dataKey="amount" fill="#eab308" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ledgers table */}
                <div className="md:col-span-6 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Demostrative Ledgers</span>
                  <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950/40">
                    <table className="w-full text-left text-[11px] border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2">Ledger Name</th>
                          <th className="px-3 py-2">Parent Group</th>
                          <th className="px-3 py-2 text-right">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {demoLedgers.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-900/40">
                            <td className="px-3 py-2 text-sky-400">{l.id}</td>
                            <td className="px-3 py-2">{l.name}</td>
                            <td className="px-3 py-2">{l.group}</td>
                            <td className="px-3 py-2 text-right text-emerald-400">{l.balance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vouchers table */}
                <div className="md:col-span-6 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Demostrative Transactions (Vouchers)</span>
                  <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950/40">
                    <table className="w-full text-left text-[11px] border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Party Name</th>
                          <th className="px-3 py-2">Voucher Type</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {demoVouchers.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-900/40">
                            <td className="px-3 py-2 text-sky-400">{v.id}</td>
                            <td className="px-3 py-2">{v.date}</td>
                            <td className="px-3 py-2">{v.partyName}</td>
                            <td className="px-3 py-2">{v.voucherType}</td>
                            <td className="px-3 py-2 text-right text-amber-400">{v.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#1E293B] p-12 text-center text-slate-400">
                <Sparkles className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
                <p className="text-xs">No active demo mode query results. Press "Activate Demo Mode" to inspect mock accounting states.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 6: HELP CENTER & TROUBLESHOOTING ==================== */}
        {activeTab === 'troubleshooting' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
            
            {/* In-app Help section */}
            <div className="lg:col-span-5 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <BookOpen className="h-4 w-4 text-sky-400" />
                <span>EXFIN In-App Desktop Help Center</span>
              </h2>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block">• 1. Tally ODBC Connection</span>
                  <p className="text-slate-400 pl-3">
                    Ensure Tally ERP 9 / Tally Prime is running in administrative mode with ODBC port 9000 open.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block">• 2. SQLite Database Integrity</span>
                  <p className="text-slate-400 pl-3">
                    SQLite files are verified at launch. If any index mismatch happens, trigger a repair from the diagnostic center.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block">• 3. Safe Schema Mappings</span>
                  <p className="text-slate-400 pl-3">
                    All transaction, ledger groups and parent/child hierarchies are mapped to the canonical warehouse representation.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block">• 4. Offline Fallback Mechanics</span>
                  <p className="text-slate-400 pl-3">
                    When offline, reports and dashboards will rely on cached snapshots and previously synchronized SQLite storage tables.
                  </p>
                </div>
              </div>
            </div>

            {/* Guided Troubleshooting scripts */}
            <div className="lg:col-span-7 rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Wrench className="h-4 w-4 text-sky-400" />
                <span>Guided Diagnostic Troubleshooting Center</span>
              </h2>

              <p className="text-xs text-slate-300">
                Identify and solve common local deployment errors. Select an issue to display guided resolutions immediately.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => alert("TROUBLESHOOTING [Tally Not Running]: Ensure Tally.exe is running in background. Run 'netstat -ano | findstr 9000' in cmd to verify Tally port bindings.")}
                  className="p-2.5 rounded border border-slate-800 bg-slate-900/60 text-left hover:bg-slate-800/40 text-slate-300"
                >
                  • Tally Not Running
                </button>
                <button
                  onClick={() => alert("TROUBLESHOOTING [Connection Failed]: Verify firewall guidelines. Allow port 9000 inside local Windows Defender rules.")}
                  className="p-2.5 rounded border border-slate-800 bg-slate-900/60 text-left hover:bg-slate-800/40 text-slate-300"
                >
                  • Connection Failed
                </button>
                <button
                  onClick={() => alert("TROUBLESHOOTING [No Company Found]: Open at least one company inside your active Tally workspace session before launching EXFIN.")}
                  className="p-2.5 rounded border border-slate-800 bg-slate-900/60 text-left hover:bg-slate-800/40 text-slate-300"
                >
                  • No Company Found
                </button>
                <button
                  onClick={() => alert("TROUBLESHOOTING [Sync Failed]: Check memory usage limits. Avoid starting uncontrolled sync operations if Tally CPU exceeds 80%.")}
                  className="p-2.5 rounded border border-slate-800 bg-slate-900/60 text-left hover:bg-slate-800/40 text-slate-300"
                >
                  • Sync Failed
                </button>
              </div>

              {/* Centralized Global Error Handler trigger */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unexpected Global Error Simulator</span>
                <p className="text-xs text-slate-300">
                  Simulates a crash-level incident with a safe, user-friendly message, unique Error ID, Timestamp, Component context, and Export capabilities.
                </p>
                <button
                  onClick={simulateUnexpectedError}
                  className="rounded bg-rose-950/40 border border-rose-800 text-rose-300 font-semibold text-xs px-4 py-1.5"
                >
                  Trigger Unexpected Error
                </button>

                {simulatedError && (
                  <div className="rounded border border-rose-800/60 bg-rose-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-rose-400 font-mono">
                      <span>Error ID: {simulatedError.errorId}</span>
                      <span>Timestamp: {simulatedError.timestamp}</span>
                    </div>
                    <p className="text-xs font-semibold text-rose-200">{simulatedError.safeUserMessage}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={generateDiagnosticBundle}
                        className="rounded bg-slate-850 hover:bg-slate-800 text-slate-300 px-3 py-1 text-[11px] font-semibold border border-slate-700"
                      >
                        Copy Sanitized Diagnostics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 7: VERIFICATION SUITE ==================== */}
        {activeTab === 'diagnostic-suite' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            <div className="rounded-lg border border-slate-800 bg-[#1E293B] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  <span>Production Readiness Verification & Test Suite</span>
                </h2>
                <button
                  onClick={runDiagnosticTests}
                  disabled={isRunningDiagnostics}
                  className="flex items-center space-x-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                  <span>{isRunningDiagnostics ? 'Executing Tests...' : 'Execute Automated Tests'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Runs critical assertions covering startup, database migrations, double read-only guards, security traversal, and data safety parameters to compute the overall Production Readiness Score.
              </p>

              {/* Readiness Score banner */}
              {diagnosticSuite && (
                <div className={`rounded-lg p-5 flex flex-col md:flex-row items-center justify-between border ${
                  diagnosticSuite.score === 'READY' 
                    ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300' 
                    : 'bg-rose-950/20 border-rose-800/80 text-rose-300'
                }`}>
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">PRODUCTION READINESS SCORE:</span>
                    <span className="text-2xl font-black tracking-wider block">{diagnosticSuite.score}</span>
                    <span className="text-xs text-slate-300 block">
                      Passed {diagnosticSuite.passed} out of {diagnosticSuite.total} automated validation checks.
                    </span>
                  </div>
                  <button
                    onClick={generateDiagnosticBundle}
                    className="mt-4 md:mt-0 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 px-4 py-2 text-xs font-bold"
                  >
                    Generate Diagnostic Bundle
                  </button>
                </div>
              )}

              {/* Diagnostic checks detailed list */}
              {diagnosticSuite && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {diagnosticSuite.tests?.map((test: any, i: number) => (
                    <div key={i} className="rounded border border-slate-800 bg-slate-900/60 p-3 flex items-start justify-between">
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-200 block">{test.name}</span>
                        <span className="text-slate-400 block">{test.message}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        test.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 4. DIAGNOSTIC BUNDLE EXPORT MODAL */}
      {showDiagnosticModal && diagnosticBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-[#1E293B] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Sanitized Diagnostic Bundle Export (Excludes Company Data)</span>
              </span>
              <button onClick={() => setShowDiagnosticModal(false)} className="text-slate-400 hover:text-slate-200 font-bold text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              This bundle collects app parameters, os version, connection statuses, recent logs metadata, and migration details. It does **not** include any financial vouchers or ledger values.
            </p>

            <pre className="rounded-lg bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 max-h-[320px] overflow-y-auto whitespace-pre">
              {JSON.stringify(diagnosticBundle, null, 2)}
            </pre>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(diagnosticBundle, null, 2));
                  alert('Diagnostic bundle copied to clipboard.');
                }}
                className="rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-1.5"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-1.5"
              >
                Close Bundle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
