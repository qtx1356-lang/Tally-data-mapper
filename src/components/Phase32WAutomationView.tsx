import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  List,
  Bell,
  Search,
  RefreshCw,
  Settings,
  X,
  History,
  ShieldCheck,
  Zap,
  Server,
  AlertCircle
} from 'lucide-react';

import { 
  AutomationJob, 
  JobHistoryRecord, 
  SystemMonitorStats, 
  AppNotification,
  AlertRule
} from '../types/phase32WAutomation';
import { runPhase32WTests, TestResult } from '../tests/phase32WAutomationTests';

export default function Phase32WAutomationView() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'jobs' | 'history' | 'alerts' | 'notifications' | 'tests'>('monitor');
  const [companyId] = useState<string>('comp_exfin_corp_id');
  const [loading, setLoading] = useState<boolean>(true);
  
  const [stats, setStats] = useState<SystemMonitorStats | null>(null);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [history, setHistory] = useState<JobHistoryRecord[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Test Runner State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState<boolean>(false);

  // Modals
  const [showEmergencyStop, setShowEmergencyStop] = useState(false);

  useEffect(() => {
    fetchAutomationData();
  }, [companyId]);

  const fetchAutomationData = async () => {
    setLoading(true);
    try {
      const [monRes, jobsRes, histRes, alertRes, notifRes] = await Promise.all([
        fetch('/api/v1/automation/monitor'),
        fetch('/api/v1/automation/jobs'),
        fetch('/api/v1/automation/history'),
        fetch('/api/v1/automation/alerts'),
        fetch('/api/v1/automation/notifications')
      ]);

      setStats(await monRes.json());
      setJobs(await jobsRes.json());
      setHistory(await histRes.json());
      setAlertRules(await alertRes.json());
      setNotifications(await notifRes.json());
    } catch (err) {
      console.error('Failed to fetch automation data', err);
    } finally {
      setLoading(false);
    }
  };

  const executeTests = () => {
    setTestsRunning(true);
    setTimeout(() => {
      const results = runPhase32WTests();
      setTestResults(results);
      setTestsRunning(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'PAUSED': return 'bg-orange-100 text-orange-700';
      case 'RUNNING': return 'bg-indigo-100 text-indigo-700 animate-pulse';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'DISABLED': return 'bg-stone-100 text-stone-600';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] font-sans">
      {/* HEADER */}
      <header className="flex-none bg-white border-b border-[#EAE6DF] px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111111] leading-tight">Phase 32W: Universal Automation & Alerting</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-stone-500 tracking-wide">EXFIN Corp</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Engine Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEmergencyStop(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-md transition-colors border border-red-200"
          >
            <StopCircle className="w-4 h-4" />
            <span>Emergency Stop</span>
          </button>
          <button 
            onClick={fetchAutomationData}
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
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Automation Modules</div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'monitor' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4.5 h-4.5" />
                <span>System Monitor</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'jobs' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <List className="w-4.5 h-4.5" />
                <span>Job Management</span>
              </div>
              <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {jobs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4.5 h-4.5" />
                <span>Execution History</span>
              </div>
            </button>
            
            <div className="mt-4 mb-2 border-t border-[#EAE6DF]"></div>
            
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'alerts' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <AlertCircle className="w-4.5 h-4.5" />
              <span>Alert Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'notifications' ? 'bg-[#EEF2FF] text-indigo-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4.5 h-4.5" />
                <span>Notification Center</span>
              </div>
              {notifications.filter(n => n.state === 'NEW').length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {notifications.filter(n => n.state === 'NEW').length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-3 mt-4 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'text-stone-600 hover:bg-[#FAF9F6] hover:text-[#111111]'
              }`}
            >
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
              <span>Diagnostics & Tests</span>
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
              
              {/* 1. SYSTEM MONITOR */}
              {activeTab === 'monitor' && stats && (
                <motion.div
                  key="monitor"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">System Monitor</h2>
                      <p className="text-sm text-stone-500 mt-1">Real-time overview of connection health, data freshness, and automation execution.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Jobs</span>
                      <span className="text-3xl font-bold text-stone-800">{stats.activeJobs}</span>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Success Rate (24h)</span>
                      <span className="text-3xl font-bold text-emerald-600">{stats.successRate}%</span>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Failed Jobs (24h)</span>
                      <span className={`text-3xl font-bold ${stats.failedJobs24h > 0 ? 'text-orange-600' : 'text-stone-800'}`}>{stats.failedJobs24h}</span>
                    </div>
                    <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pending Alerts</span>
                      <span className={`text-3xl font-bold ${stats.pendingAlerts > 0 ? 'text-indigo-600' : 'text-stone-800'}`}>{stats.pendingAlerts}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 mt-4">Company Health Cards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.companies.map(comp => (
                      <div key={comp.companyId} className="bg-white border border-[#EAE6DF] rounded-xl shadow-xs overflow-hidden">
                        <div className="px-5 py-3 border-b flex justify-between items-center bg-stone-50">
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-stone-500" />
                            <h4 className="font-bold text-sm text-stone-800">{comp.companyId}</h4>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            comp.connectionStatus === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {comp.connectionStatus}
                          </span>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Data Freshness</span>
                            <span className={`font-semibold ${comp.dataFreshnessStatus === 'FRESH' ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {comp.dataFreshnessStatus}
                            </span>
                            <span className="text-[10px] text-stone-500">Last: {new Date(comp.lastRefresh).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Mapping Status</span>
                            <span className={`font-semibold ${comp.mappingStatus === 'VALID' ? 'text-stone-800' : 'text-red-600'}`}>
                              {comp.mappingStatus}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Exceptions</span>
                            <span className="font-semibold text-stone-800">{comp.activeExceptions}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Critical Exceptions</span>
                            <span className={`font-semibold ${comp.criticalExceptions > 0 ? 'text-red-600' : 'text-stone-800'}`}>
                              {comp.criticalExceptions}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 2. JOB MANAGEMENT */}
              {activeTab === 'jobs' && (
                <motion.div
                  key="jobs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Automation Jobs</h2>
                      <p className="text-sm text-stone-500 mt-1">Configure scheduled data pipelines and analysis scans safely.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {jobs.map(job => (
                      <div key={job.jobId} className="bg-white border border-[#EAE6DF] rounded-xl p-5 shadow-xs flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-stone-900 text-lg">{job.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-sm text-stone-600">{job.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 text-stone-400 hover:text-indigo-600 bg-stone-50 hover:bg-indigo-50 rounded-md transition-colors" title="Test Run (Dry)">
                              <PlayCircle className="w-4.5 h-4.5" />
                            </button>
                            <button className="p-1.5 text-stone-400 hover:text-orange-600 bg-stone-50 hover:bg-orange-50 rounded-md transition-colors" title="Pause Job">
                              <PauseCircle className="w-4.5 h-4.5" />
                            </button>
                            <button className="p-1.5 text-stone-400 hover:text-indigo-600 bg-stone-50 hover:bg-indigo-50 rounded-md transition-colors" title="Settings">
                              <Settings className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 bg-[#FAF9F6] p-3 rounded-lg border border-[#EAE6DF] text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Type</span>
                            <span className="font-semibold text-stone-700">{job.type}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Schedule</span>
                            <span className="font-mono text-indigo-700 font-semibold">{job.schedule}</span>
                            <span className="text-[9px] text-stone-500">{job.timezone}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Next Run</span>
                            <span className="font-semibold text-stone-700">
                              {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Retry Policy</span>
                            <span className="font-semibold text-stone-700">{job.retryPolicy.type} (Max {job.retryPolicy.maxRetries})</span>
                          </div>
                        </div>

                        {job.pipelineSteps && (
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Execution Pipeline</span>
                            <div className="flex flex-wrap items-center gap-2">
                              {job.pipelineSteps.map((step, i) => (
                                <React.Fragment key={i}>
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded font-semibold whitespace-nowrap">
                                    {step}
                                  </span>
                                  {i < job.pipelineSteps!.length - 1 && (
                                    <span className="text-stone-300 font-bold">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 3. EXECUTION HISTORY */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Execution History</h2>
                      <p className="text-sm text-stone-500 mt-1">Audit log of all executed automation jobs, duration, and error states.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-xs overflow-hidden flex flex-col">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 border-b border-[#EAE6DF] text-stone-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Job ID</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Status</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Start Time</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Duration</th>
                          <th className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">Error Context</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {history.map(record => (
                          <tr key={record.executionId} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-stone-600">
                              {record.jobId}
                              <div className="text-[10px] text-stone-400 mt-1">Corr: {record.correlationId}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wider ${getStatusColor(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-stone-800 text-xs">
                              {new Date(record.startTime).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-stone-800 text-xs">
                              {record.durationMs ? `${(record.durationMs / 1000).toFixed(1)}s` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {record.error ? (
                                <span className="text-red-600 font-medium line-clamp-1">{record.error.message}</span>
                              ) : (
                                <span className="text-stone-400 italic">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* 4. NOTIFICATION CENTER */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Notification Center</h2>
                      <p className="text-sm text-stone-500 mt-1">Review alerts routed from the intelligence engine.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {notifications.map(notif => (
                      <div key={notif.notificationId} className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-xs flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {notif.state === 'NEW' && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                            <h3 className="font-bold text-stone-900 text-sm">{notif.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getSeverityColor(notif.severity)}`}>
                              {notif.severity}
                            </span>
                          </div>
                          <span className="text-xs text-stone-400">{new Date(notif.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-stone-600 ml-5">{notif.message}</p>
                        
                        <div className="ml-5 mt-2 flex gap-2">
                          <button className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded transition-colors border border-indigo-100">
                            Acknowledge
                          </button>
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
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[#111111]">Phase 32W Safety & Concurrency Diagnostics</h2>
                        <p className="text-xs text-stone-500 mt-1 max-w-xl">
                          Run automated tests to verify read-only isolation, idempotency duplication prevention, and safe correlation tracking across pipeline steps.
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
                              <X className="w-5 h-5 text-red-600" />
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

      {/* Emergency Stop Modal */}
      {showEmergencyStop && (
        <div className="fixed inset-0 bg-[#111111]/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white border border-red-200 rounded-xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-stone-100 pb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Emergency Stop</h3>
            </div>
            <p className="text-sm text-stone-700">
              Are you sure you want to stop all active automation jobs? This will safely halt operations without corrupting database states, but scheduled intelligence runs will be skipped.
            </p>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowEmergencyStop(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowEmergencyStop(false)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
              >
                Halt Operations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
