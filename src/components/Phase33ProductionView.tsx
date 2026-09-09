import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  Settings,
  ShieldCheck,
  Activity,
  HardDrive,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Key,
  Database,
  Server,
  Zap,
  RefreshCw,
  Terminal
} from 'lucide-react';

import { AppDiagnostics, LicenseInfo, SupportBundle } from '../types/phase33Production';
import { runPhase33Tests, TestResult } from '../tests/phase33ProductionTests';

export default function Phase33ProductionView() {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'license' | 'tests' | 'settings'>('diagnostics');
  const [loading, setLoading] = useState(true);

  const [diagnostics, setDiagnostics] = useState<AppDiagnostics | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [diagRes, licRes] = await Promise.all([
        fetch('/api/phase33/diagnostics'),
        fetch('/api/phase33/license')
      ]);
      setDiagnostics(await diagRes.json());
      setLicense(await licRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      setTestResults(runPhase33Tests());
      setTestsRunning(false);
    }, 600);
  };

  const downloadSupportBundle = async () => {
    try {
      const res = await fetch('/api/phase33/support-bundle', { method: 'POST' });
      const bundle = await res.json();
      
      // Simulate file download
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exfin_support_${bundle.diagnosticId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate bundle', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 33: Desktop Production</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">Environment & Diagnostics</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Release Candidate</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-md flex items-center gap-2 mr-2">
            <ShieldCheck className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-bold text-stone-800">Production Build</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-[#EAE6DF] flex flex-col p-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">System</div>
          
          <div className="flex flex-col gap-1">
            <button onClick={() => setActiveTab('diagnostics')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'diagnostics' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <Activity className="w-4.5 h-4.5" /> <span>Diagnostics</span>
            </button>
            <button onClick={() => setActiveTab('license')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'license' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <Key className="w-4.5 h-4.5" /> <span>License & Edition</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <Settings className="w-4.5 h-4.5" /> <span>Application Settings</span>
            </button>
            <div className="mt-4 mb-2 border-t border-[#EAE6DF]"></div>
            <button onClick={() => setActiveTab('tests')} className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'}`}>
              <Terminal className="w-4.5 h-4.5 text-emerald-600" /> <span>E2E & Security Audit</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="w-8 h-8 text-stone-300 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'diagnostics' && diagnostics && (
                <motion.div key="diagnostics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 max-w-4xl">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">System Diagnostics</h2>
                      <p className="text-sm text-stone-500 mt-1">Real-time health, memory utilization, and connection tracking.</p>
                    </div>
                    <button onClick={downloadSupportBundle} className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-xs flex items-center gap-2">
                      <Download className="w-4 h-4" /> Export Support Bundle
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex items-center gap-4">
                      <div className="p-3 bg-stone-100 rounded-lg"><Monitor className="w-6 h-6 text-stone-700" /></div>
                      <div>
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Application Build</div>
                        <div className="text-base font-bold text-stone-900 mt-0.5">v{diagnostics.appVersion} (Build {diagnostics.buildNumber})</div>
                        <div className="text-xs text-stone-500 mt-1">{diagnostics.desktopRuntime}</div>
                      </div>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex items-center gap-4">
                      <div className="p-3 bg-stone-100 rounded-lg"><Database className="w-6 h-6 text-stone-700" /></div>
                      <div>
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Database Engine</div>
                        <div className="text-base font-bold text-stone-900 mt-0.5">{diagnostics.databaseStatus}</div>
                        <div className="text-xs text-stone-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500"/> Not using durable SQLite yet</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">Environment Details</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div className="flex justify-between"><span className="text-stone-500">Operating System</span><span className="font-mono text-stone-800">{diagnostics.osDetails}</span></div>
                      <div className="flex justify-between"><span className="text-stone-500">Tally Integration</span><span className="font-bold text-emerald-600">{diagnostics.tallyStatus}</span></div>
                      <div className="flex justify-between"><span className="text-stone-500">Heap Used</span><span className="font-mono text-stone-800">{diagnostics.memoryUsage.heapUsed} MB</span></div>
                      <div className="flex justify-between"><span className="text-stone-500">Heap Total</span><span className="font-mono text-stone-800">{diagnostics.memoryUsage.heapTotal} MB</span></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'license' && license && (
                <motion.div key="license" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 max-w-4xl">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight">License Information</h2>
                    <p className="text-sm text-stone-500 mt-1">Manage your EXFIN commercial edition and entitlements.</p>
                  </div>
                  <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-8 text-white shadow-lg flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">{license.productName}</h3>
                        <div className="text-stone-400 mt-1">{license.edition} EDITION</div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                        {license.status}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {license.features.map(f => (
                        <span key={f} className="text-xs font-bold bg-white/10 px-2 py-1 rounded tracking-wider">{f}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tests' && (
                <motion.div key="tests" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-6 max-w-4xl">
                   <div className="flex justify-between items-center bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#111111]">Final Production Quality Gates</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Verifies read-only constraints, diagnostic data privacy, and simulated end-to-end critical pathways before release.
                        </p>
                      </div>
                    </div>
                    <button onClick={executeTests} disabled={testsRunning} className={`px-4 py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${testsRunning ? 'bg-stone-100 text-stone-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                      {testsRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} {testsRunning ? 'Running...' : 'Execute Audit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {testResults.map((res, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex flex-col gap-2 ${res.passed ? 'bg-[#F0FDF4] border-[#BBF7D0]' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {res.passed ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                            <h3 className={`font-semibold text-sm ${res.passed ? 'text-emerald-900' : 'text-red-900'}`}>{res.testName}</h3>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${res.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{res.durationMs}ms</span>
                        </div>
                        <p className={`text-xs ml-7 ${res.passed ? 'text-emerald-700' : 'text-red-700'}`}>{res.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
