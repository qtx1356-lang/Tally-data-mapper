import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Server,
  Key,
  Webhook,
  Code2,
  Terminal,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Settings,
  Plus,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Globe,
  Database,
  BarChart4
} from 'lucide-react';

import {
  ApiCredential,
  WebhookSubscription,
  ApiGatewayMetrics
} from '../types/phase32YApiGateway';
import { runPhase32YTests, TestResult } from '../tests/phase32YApiGatewayTests';

export default function Phase32YApiGatewayView() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'keys' | 'webhooks' | 'explorer' | 'tests'>('metrics');
  const [loading, setLoading] = useState<boolean>(true);

  const [metrics, setMetrics] = useState<ApiGatewayMetrics | null>(null);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);

  // Explorer state
  const [explorerEndpoint, setExplorerEndpoint] = useState<string>('/api/v1/query');
  const [explorerPayload, setExplorerPayload] = useState<string>('{\n  "dataset": "ledgers",\n  "fields": ["id", "semantic_value"]\n}');
  const [explorerResponse, setExplorerResponse] = useState<string>('');
  const [explorerLoading, setExplorerLoading] = useState<boolean>(false);

  // Test Runner State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState<boolean>(false);

  useEffect(() => {
    fetchGatewayData();
  }, []);

  const fetchGatewayData = async () => {
    setLoading(true);
    try {
      const [metRes, credRes, webRes] = await Promise.all([
        fetch('/api/phase32y/management/metrics'),
        fetch('/api/phase32y/management/keys'),
        fetch('/api/phase32y/management/webhooks')
      ]);

      setMetrics(await metRes.json());
      setCredentials(await credRes.json());
      setWebhooks(await webRes.json());
    } catch (err) {
      console.error('Failed to fetch gateway data', err);
    } finally {
      setLoading(false);
    }
  };

  const executeExplorerQuery = async () => {
    setExplorerLoading(true);
    try {
      let url = `/api/phase32y${explorerEndpoint}`;
      let options: RequestInit = {
        method: explorerEndpoint === '/api/v1/query' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      if (options.method === 'POST') {
        options.body = explorerPayload;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setExplorerResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setExplorerResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setExplorerLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      const results = runPhase32YTests();
      setTestResults(results);
      setTestsRunning(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REVOKED': return 'bg-red-100 text-red-700 border-red-200';
      case 'EXPIRED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'DISABLED': return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'FAILING': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      {/* HEADER */}
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 32Y: API / Integration Gateway</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">External Gateway</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Gateway Secure</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchGatewayData}
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
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Gateway Manager</div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'metrics' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4.5 h-4.5" />
                <span>Gateway Metrics</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'keys' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4.5 h-4.5" />
                <span>API Credentials</span>
              </div>
              <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {credentials.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'webhooks' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Webhook className="w-4.5 h-4.5" />
                <span>Webhooks</span>
              </div>
              <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {webhooks.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'explorer' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <Terminal className="w-4.5 h-4.5" />
              <span>API Explorer</span>
            </button>
            
            <div className="mt-4 mb-2 border-t border-[#EAE6DF]"></div>
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <Shield className="w-4.5 h-4.5 text-emerald-600" />
              <span>Security & Diagnostics</span>
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
              
              {/* 1. METRICS */}
              {activeTab === 'metrics' && metrics && (
                <motion.div
                  key="metrics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">API Gateway Metrics</h2>
                      <p className="text-sm text-stone-500 mt-1">Live overview of external API request volume, latency, and rate limits.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Requests (24h)</span>
                      <span className="text-3xl font-bold text-stone-800">{metrics.totalRequests24h.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Error Rate</span>
                      <span className={`text-3xl font-bold ${metrics.errorRate > 0.05 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {(metrics.errorRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Avg Latency</span>
                      <span className="text-3xl font-bold text-stone-800">{metrics.avgLatencyMs}ms</span>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rate Limit Events</span>
                      <span className={`text-3xl font-bold ${metrics.rateLimitEvents > 100 ? 'text-orange-600' : 'text-stone-800'}`}>
                        {metrics.rateLimitEvents}
                      </span>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start gap-4 mt-2">
                    <Shield className="w-6 h-6 text-indigo-700 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900">Strict Read-Only Enforcement Active</h3>
                      <p className="text-xs text-indigo-700 mt-1 max-w-3xl leading-relaxed">
                        The API Gateway enforces strict read-only constraints. All requests pass through the semantic mapping layer and no raw SQL, TDL, or write commands are permitted. Responses are automatically sanitized for field-level security based on the credential scopes.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. API CREDENTIALS */}
              {activeTab === 'keys' && (
                <motion.div
                  key="keys"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">API Credentials</h2>
                      <p className="text-sm text-stone-500 mt-1">Manage API keys, strict scopes, and company isolation constraints.</p>
                    </div>
                    <button className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4" /> Generate New Key
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {credentials.map(cred => (
                      <div key={cred.credentialId} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-stone-50 border border-stone-200 text-stone-600 rounded-lg">
                              <Key className="w-5 h-5" />
                            </span>
                            <div>
                              <h3 className="font-bold text-stone-900 text-sm">{cred.name}</h3>
                              <div className="text-xs text-stone-500 mt-0.5">Owner: {cred.owner}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border ${getStatusColor(cred.status)}`}>
                            {cred.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-start bg-stone-50 p-4 rounded-lg border border-stone-100">
                          <div className="flex flex-col gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Key Pattern</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-stone-800">{cred.maskedKey}</span>
                                <button className="text-stone-400 hover:text-stone-600"><Copy className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Company Isolation</span>
                              <div className="flex flex-wrap gap-1">
                                {cred.allowedCompanies.map((c, i) => (
                                  <span key={i} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                    {c === '*' ? 'All Companies' : c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Authorized Scopes</span>
                              <div className="flex flex-wrap gap-1">
                                {cred.scopes.map((scope, i) => (
                                  <span key={i} className="text-[10px] font-bold bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                                    {scope}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-stone-500 pt-1 border-t border-stone-200">
                              <span>Created: {new Date(cred.createdAt).toLocaleDateString()}</span>
                              <span>Last Used: {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleString() : 'Never'}</span>
                            </div>
                          </div>
                        </div>

                        {cred.status === 'ACTIVE' && (
                          <div className="flex justify-end gap-3 mt-1">
                            <button className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                              <Settings className="w-4 h-4" /> Configure
                            </button>
                            <button className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded transition-colors flex items-center gap-1.5">
                              <XCircle className="w-4 h-4" /> Revoke Key
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 3. WEBHOOKS */}
              {activeTab === 'webhooks' && (
                <motion.div
                  key="webhooks"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Webhook Integrations</h2>
                      <p className="text-sm text-stone-500 mt-1">Configure event-driven payloads to external systems securely.</p>
                    </div>
                    <button className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-sm font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4" /> New Webhook
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {webhooks.map(wh => (
                      <div key={wh.webhookId} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg">
                              <Webhook className="w-5 h-5" />
                            </span>
                            <div>
                              <h3 className="font-mono text-stone-900 text-sm font-semibold">{wh.url}</h3>
                              <div className="text-xs text-stone-500 mt-0.5">ID: {wh.webhookId}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border ${getStatusColor(wh.status)}`}>
                            {wh.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-start bg-stone-50 p-4 rounded-lg border border-stone-100">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Subscribed Events</span>
                            <div className="flex flex-wrap gap-1">
                              {wh.events.map((evt, i) => (
                                <span key={i} className="text-[10px] font-bold bg-white border border-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                                  {evt}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-stone-500">
                              <span>Signing Secret:</span>
                              <span className="font-mono bg-stone-200 px-1 rounded">{wh.secretMasked}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-stone-500">
                              <span>Last Fired:</span>
                              <span>{wh.lastFiredAt ? new Date(wh.lastFiredAt).toLocaleString() : 'Never'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-stone-500">
                              <span>Failure Count:</span>
                              <span className={wh.failureCount > 0 ? 'text-red-600 font-bold' : ''}>{wh.failureCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 4. API EXPLORER */}
              {activeTab === 'explorer' && (
                <motion.div
                  key="explorer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">API Explorer</h2>
                      <p className="text-sm text-stone-500 mt-1">Test queries safely within internal bounds.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 h-[calc(100vh-280px)]">
                    {/* Request Pane */}
                    <div className="w-1/2 flex flex-col border border-[#EAE6DF] rounded-xl bg-white shadow-xs overflow-hidden">
                      <div className="px-4 py-3 bg-stone-50 border-b border-[#EAE6DF] flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600 uppercase">Request</span>
                        <select 
                          value={explorerEndpoint}
                          onChange={(e) => setExplorerEndpoint(e.target.value)}
                          className="text-xs font-mono bg-white border border-stone-200 rounded px-2 py-1 outline-none"
                        >
                          <option value="/v1/health">GET /v1/health</option>
                          <option value="/v1/companies">GET /v1/companies</option>
                          <option value="/v1/query">POST /v1/query (Semantic)</option>
                        </select>
                      </div>
                      <div className="flex-1 p-0 relative bg-[#1E1E1E]">
                        <textarea
                          value={explorerPayload}
                          onChange={(e) => setExplorerPayload(e.target.value)}
                          disabled={explorerEndpoint !== '/v1/query'}
                          className="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-sm resize-none outline-none disabled:opacity-50"
                          spellCheck="false"
                        />
                      </div>
                      <div className="px-4 py-3 bg-white border-t border-[#EAE6DF] flex justify-end">
                        <button 
                          onClick={executeExplorerQuery}
                          disabled={explorerLoading}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2"
                        >
                          {explorerLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
                          Execute Request
                        </button>
                      </div>
                    </div>

                    {/* Response Pane */}
                    <div className="w-1/2 flex flex-col border border-[#EAE6DF] rounded-xl bg-white shadow-xs overflow-hidden">
                      <div className="px-4 py-3 bg-stone-50 border-b border-[#EAE6DF] flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600 uppercase">Response</span>
                      </div>
                      <div className="flex-1 p-0 bg-[#1E1E1E] overflow-auto">
                        <pre className="p-4 text-stone-300 font-mono text-sm">
                          {explorerResponse || '// Response will appear here...'}
                        </pre>
                      </div>
                    </div>
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
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#111111]">API Gateway Security Diagnostics</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Run automated test suites to verify read-only constraints, semantic query validation, API key scope enforcement, and Tally protection logic.
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
                          <span>Execute Tests</span>
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
