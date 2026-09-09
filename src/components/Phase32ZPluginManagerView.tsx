import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Blocks,
  Puzzle,
  DownloadCloud,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  Search,
  Lock,
  Play,
  Square,
  Trash2,
  AlertTriangle,
  HardDrive,
  Package,
  Activity,
  Box,
  Link as LinkIcon,
  Database
} from 'lucide-react';

import {
  InstalledPlugin,
  ConnectorModel,
  PluginCapability
} from '../types/phase32ZPlugins';
import { runPhase32ZTests, TestResult } from '../tests/phase32ZPluginTests';

export default function Phase32ZPluginManagerView() {
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'connectors' | 'permissions' | 'tests'>('installed');
  const [loading, setLoading] = useState<boolean>(true);

  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [connectors, setConnectors] = useState<ConnectorModel[]>([]);

  // Test Runner State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState<boolean>(false);

  useEffect(() => {
    fetchPluginData();
  }, []);

  const fetchPluginData = async () => {
    setLoading(true);
    try {
      const [pluginsRes, connRes] = await Promise.all([
        fetch('/api/phase32z/plugins/installed'),
        fetch('/api/phase32z/connectors')
      ]);

      setInstalledPlugins(await pluginsRes.json());
      setConnectors(await connRes.json());
    } catch (err) {
      console.error('Failed to fetch plugin data', err);
    } finally {
      setLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      const results = runPhase32ZTests();
      setTestResults(results);
      setTestsRunning(false);
    }, 800);
  };

  const getPluginStateColor = (state: string) => {
    switch (state) {
      case 'ENABLED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DISABLED': return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'QUARANTINED': return 'bg-red-100 text-red-700 border-red-200';
      case 'FAILED': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getConnectorStateColor = (state: string) => {
    switch (state) {
      case 'CONNECTED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DISCONNECTED': return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'ERROR': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const togglePluginState = async (id: string, currentState: string) => {
    if (currentState === 'QUARANTINED') return; // Cannot toggle quarantined
    
    const endpoint = currentState === 'ENABLED' ? 'disable' : 'enable';
    
    // Optimistic update
    setInstalledPlugins(prev => prev.map(p => {
      if (p.pluginId === id) {
        return { ...p, state: currentState === 'ENABLED' ? 'DISABLED' : 'ENABLED' };
      }
      return p;
    }));

    try {
      await fetch(`/api/phase32z/plugins/${id}/${endpoint}`, { method: 'POST' });
    } catch (e) {
      // Revert on error
      fetchPluginData();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      {/* HEADER */}
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 32Z: Extension Sandbox</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">Plugin & Connector Manager</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Isolation Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-2 mr-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">Strict Read-Only Mode Enforced</span>
          </div>
          <button 
            onClick={fetchPluginData}
            className="p-2 text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-md transition-colors"
            title="Refresh State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-[#EAE6DF] flex flex-col p-4 overflow-y-auto">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Ecosystem</div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('installed')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'installed' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4.5 h-4.5" />
                <span>Installed Plugins</span>
              </div>
              <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {installedPlugins.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'marketplace' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <DownloadCloud className="w-4.5 h-4.5" />
                <span>Marketplace</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('connectors')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'connectors' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LinkIcon className="w-4.5 h-4.5" />
                <span>Connectors</span>
              </div>
              <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {connectors.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'permissions' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <Lock className="w-4.5 h-4.5" />
              <span>Permission Audit</span>
            </button>
            
            <div className="mt-4 mb-2 border-t border-[#EAE6DF]"></div>
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <ShieldAlert className="w-4.5 h-4.5 text-emerald-600" />
              <span>Sandbox Diagnostics</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="w-8 h-8 text-stone-300 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* 1. INSTALLED PLUGINS */}
              {activeTab === 'installed' && (
                <motion.div
                  key="installed"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Installed Plugins</h2>
                      <p className="text-sm text-stone-500 mt-1">Manage local extensions. All plugins run in highly restricted read-only sandboxes.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {installedPlugins.map(plugin => (
                      <div key={plugin.pluginId} className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col gap-4 ${
                        plugin.state === 'QUARANTINED' ? 'border-red-300 bg-red-50' : 'border-[#EAE6DF]'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <span className={`p-3 rounded-lg flex items-center justify-center ${
                              plugin.state === 'QUARANTINED' ? 'bg-red-100 text-red-600' : 'bg-stone-50 border border-stone-200 text-stone-600'
                            }`}>
                              <Puzzle className="w-6 h-6" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-stone-900 text-lg">{plugin.displayName}</h3>
                                <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded">v{plugin.version}</span>
                                {plugin.signatureStatus === 'VERIFIED' && (
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-100">
                                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-500 mt-1 font-mono">{plugin.pluginId} • By {plugin.publisher}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border ${getPluginStateColor(plugin.state)}`}>
                            {plugin.state}
                          </span>
                        </div>

                        <p className="text-sm text-stone-700">{plugin.description}</p>
                        
                        {plugin.lastError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{plugin.lastError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 items-start bg-stone-50 p-4 rounded-lg border border-stone-100 mt-2">
                          <div className="flex flex-col gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1.5 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Capabilities Requested
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {plugin.capabilities.map((cap, i) => (
                                  <span key={i} className="text-[10px] font-semibold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1.5 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Sandbox Resource Bounds
                              </span>
                              <div className="flex flex-col gap-1 text-xs text-stone-600 font-mono bg-white p-2 border border-stone-200 rounded">
                                <div className="flex justify-between">
                                  <span>CPU Time:</span>
                                  <span>{plugin.resourceUsage.cpuPercent.toFixed(1)}% / Max 5%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Memory Allocation:</span>
                                  <span>{plugin.resourceUsage.memoryMb.toFixed(1)}MB / Max 128MB</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-1 pt-3 border-t border-stone-100">
                          {plugin.state !== 'QUARANTINED' && (
                            <button 
                              onClick={() => togglePluginState(plugin.pluginId, plugin.state)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 border ${
                                plugin.state === 'ENABLED' 
                                  ? 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {plugin.state === 'ENABLED' ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                              {plugin.state === 'ENABLED' ? 'Disable' : 'Enable'}
                            </button>
                          )}
                          <button className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                            <Settings className="w-4 h-4" /> Config
                          </button>
                          <button className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded transition-colors flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4" /> Uninstall
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 2. MARKETPLACE */}
              {activeTab === 'marketplace' && (
                <motion.div
                  key="marketplace"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center h-full text-stone-500"
                >
                  <Box className="w-16 h-16 text-stone-300 mb-4" />
                  <h3 className="text-lg font-bold text-stone-900 mb-1">Integration Marketplace</h3>
                  <p className="text-sm max-w-md text-center">
                    The marketplace is currently in strict lockdown. Enterprise policies require plugins to be installed manually by administrators via signed `.epk` packages.
                  </p>
                  <button className="mt-6 px-4 py-2 bg-[#111111] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors">
                    <DownloadCloud className="w-4 h-4" /> Import Signed Package
                  </button>
                </motion.div>
              )}

              {/* 3. CONNECTORS */}
              {activeTab === 'connectors' && (
                <motion.div
                  key="connectors"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Connector SDK Implementations</h2>
                      <p className="text-sm text-stone-500 mt-1">Data sources mapped into the universal semantic engine.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {connectors.map(conn => (
                      <div key={conn.connectorId} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <span className="p-3 bg-stone-50 border border-stone-200 text-stone-600 rounded-lg">
                              <Database className="w-6 h-6" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-stone-900 text-lg">{conn.name}</h3>
                                <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded">v{conn.version}</span>
                              </div>
                              <div className="text-xs text-stone-500 mt-1">Provider: {conn.provider}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border ${getConnectorStateColor(conn.status)}`}>
                            {conn.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-start bg-stone-50 p-4 rounded-lg border border-stone-100 mt-2">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1.5">Connector SDK Capabilities</span>
                            <div className="flex flex-wrap gap-1.5">
                              {conn.capabilities.map((cap, i) => (
                                <span key={i} className="text-[10px] font-semibold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-stone-600">
                            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                              <span className="font-semibold text-stone-900">Bound Companies</span>
                              <span>{conn.companies.length > 0 ? conn.companies.join(', ') : 'None'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <span className="font-semibold text-stone-900">Last Semantic Sync</span>
                              <span>{new Date(conn.lastSync).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TESTS TAB */}
              {activeTab === 'tests' && (
                <motion.div
                  key="tests"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-center bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#111111]">Plugin Sandbox Security Diagnostics</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Run automated test suites verifying that the plugin SDK strictly isolates extensions, rejects write-capable Tally permissions, and validates cryptographic package signatures before load.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={executeTests}
                      disabled={testsRunning}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                        testsRunning
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {testsRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Execute Sandbox Tests</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border flex flex-col gap-2 ${
                          result.passed
                            ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.passed ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <h3 className={`font-semibold text-sm ${result.passed ? 'text-emerald-900' : 'text-red-900'}`}>
                              {result.testName}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {result.durationMs}ms
                          </span>
                        </div>
                        <p className={`text-xs ml-7 ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                          {result.message}
                        </p>
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
