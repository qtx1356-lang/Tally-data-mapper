import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  FileText,
  Bell,
  CheckCircle2,
  XCircle,
  History,
  Settings,
  Plus,
  Play,
  Pause,
  Trash2,
  Shield,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Lock,
  Send,
  Sliders,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Layers,
  Database,
  ExternalLink,
  Info,
  Calendar,
  UserCheck
} from 'lucide-react';
import {
  AutomationDefinition,
  AutomationExecutionRecord,
  AlertRecord,
  ApprovalRequestRecord,
  InAppNotificationRecord,
  BusinessMonitoringDashboardData,
  TriggerType,
  ScheduleFrequency,
  DataClassification,
  AlertSeverity,
  RuleOperator
} from '../types/phase20Automation';

export function AutomationCenterView() {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Schedules' | 'Rules' | 'Alerts' | 'Reports' | 'Notifications' | 'Approvals' | 'History' | 'Settings'
  >('Overview');

  const [dashboardData, setDashboardData] = useState<BusinessMonitoringDashboardData | null>(null);
  const [automations, setAutomations] = useState<AutomationDefinition[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequestRecord[]>([]);
  const [notifications, setNotifications] = useState<InAppNotificationRecord[]>([]);
  const [executions, setExecutions] = useState<AutomationExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDraft, setWizardDraft] = useState<Partial<AutomationDefinition>>({
    name: '',
    description: '',
    companyId: 'COMP_EXFIN_01',
    companyName: 'EXFIN GLOBAL ENTERPRISES PVT LTD',
    trigger: 'Scheduled',
    schedule: {
      frequency: 'Daily',
      cronExpression: '0 18 * * 1-5',
      timezone: 'Asia/Kolkata',
      runTime: '18:00:00',
      runDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      dayOfMonth: 1,
      holidayPolicy: 'NextBusinessDay',
      respectQuietHours: true,
      quietHoursStart: '22:00:00',
      quietHoursEnd: '07:00:00',
      criticalOverrideQuietHours: true
    },
    conditionGroup: {
      combinator: 'And',
      conditions: [
        {
          conditionId: 'cond-1',
          dataset: 'SalesVoucherSummary',
          metric: 'TotalSalesAmount',
          operator: 'GreaterThan',
          thresholdValue: 100000,
          unit: 'INR',
          period: 'CurrentMonth'
        }
      ],
      subGroups: []
    },
    action: {
      actionType: 'GenerateAndEmailReport',
      reportId: 'RPT_DAILY_SALES',
      reportName: 'Daily Sales Performance Summary',
      exportFormat: 'PDF',
      includeAiExecutiveSummary: true,
      requireWatermark: true,
      watermarkText: 'CONFIDENTIAL - EXFIN AUTOMATION',
      classification: 'Confidential',
      emailSubjectTemplate: '[EXFIN Digest] {{report}} - {{company}} ({{period}})',
      emailBodyTemplate: 'Attached is the automated {{report}} for {{company}} for {{period}}.',
      recipients: [
        {
          recipientId: 'rec-1',
          name: 'Finance Desk',
          email: 'finance@exfin.internal',
          role: 'FinanceManager',
          channel: 'Email',
          isGroupOrRole: false
        }
      ]
    },
    approval: {
      requiresApproval: false,
      segregationOfDuties: true,
      requiredApproverRole: 'FinancialController',
      designatedApprovers: [],
      expirationHours: 24,
      isSequentialMultiLevel: false,
      multiLevelRoles: []
    },
    stalePolicy: 'Warn',
    status: 'Active',
    owner: 'admin@exfin.internal',
    version: 1,
    maxTriggersPerDay: 10,
    deduplicationKeyTemplate: '{{automationId}}_{{period}}'
  });

  // Dry Run Modal
  const [dryRunRecord, setDryRunRecord] = useState<AutomationExecutionRecord | null>(null);
  const [selectedExecutionTrace, setSelectedExecutionTrace] = useState<AutomationExecutionRecord | null>(null);
  const [approvalModalItem, setApprovalModalItem] = useState<ApprovalRequestRecord | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [ruleTestResult, setRuleTestResult] = useState<any>(null);
  const [testRuleLoading, setTestRuleLoading] = useState(false);
  const [copilotDraftPrompt, setCopilotDraftPrompt] = useState('');
  const [copilotDraftLoading, setCopilotDraftLoading] = useState(false);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, autoRes, alertRes, appRes, notifRes, execRes] = await Promise.all([
        fetch('/api/automation/dashboard'),
        fetch('/api/automation/list'),
        fetch('/api/automation/alerts/list'),
        fetch('/api/automation/approvals/list'),
        fetch('/api/automation/notifications/list'),
        fetch('/api/automation/history/list')
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (autoRes.ok) setAutomations(await autoRes.json());
      if (alertRes.ok) setAlerts(await alertRes.json());
      if (appRes.ok) setApprovals(await appRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (execRes.ok) setExecutions(await execRes.json());
    } catch (err) {
      console.error('Failed to load automation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunDryRun = async (automationId: string) => {
    try {
      const res = await fetch(`/api/automation/${automationId}/dry-run`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDryRunRecord(data);
      }
    } catch (err) {
      console.error('Dry run failed', err);
    }
  };

  const handleExecuteNow = async (automationId: string) => {
    try {
      const res = await fetch(`/api/automation/${automationId}/execute`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Execute failed', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await fetch(`/api/automation/alerts/${alertId}/ack`, { method: 'POST' });
    fetchData();
  };

  const handleResolveAlert = async (alertId: string) => {
    await fetch(`/api/automation/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: 'Resolved from Enterprise Automation Center' })
    });
    fetchData();
  };

  const handleSnoozeAlert = async (alertId: string, hours: number) => {
    await fetch(`/api/automation/alerts/${alertId}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours })
    });
    fetchData();
  };

  const handleApproveReject = async (approvalId: string, decision: 'Approve' | 'Reject') => {
    try {
      const res = await fetch(`/api/automation/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          approverUser: 'financial.controller@exfin.internal',
          comments: approvalComment || `${decision}d from Automation Center`
        })
      });
      if (res.ok) {
        setApprovalModalItem(null);
        setApprovalComment('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Approval failed');
      }
    } catch (err) {
      console.error('Approval failed', err);
    }
  };

  const handleTestRuleCondition = async () => {
    setTestRuleLoading(true);
    try {
      const res = await fetch('/api/automation/test-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionGroup: wizardDraft.conditionGroup })
      });
      if (res.ok) {
        setRuleTestResult(await res.json());
      }
    } catch (err) {
      console.error('Rule test failed', err);
    } finally {
      setTestRuleLoading(false);
    }
  };

  const handleSaveWizard = async (activateImmediately: boolean) => {
    const payload: AutomationDefinition = {
      ...(wizardDraft as AutomationDefinition),
      status: activateImmediately ? 'Active' : 'Draft',
      automationId: wizardDraft.automationId || `AUTO_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    try {
      const res = await fetch('/api/automation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowWizard(false);
        setWizardStep(1);
        fetchData();
      }
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleCopilotDraftCreate = async () => {
    if (!copilotDraftPrompt.trim()) return;
    setCopilotDraftLoading(true);
    try {
      const res = await fetch('/api/automation/copilot-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: copilotDraftPrompt, user: 'copilot.user@exfin.internal' })
      });
      if (res.ok) {
        const draft = await res.json();
        setWizardDraft(draft);
        setShowWizard(true);
        setWizardStep(8); // jump to review
        setCopilotDraftPrompt('');
        fetchData();
      }
    } catch (err) {
      console.error('Copilot draft creation failed', err);
    } finally {
      setCopilotDraftLoading(false);
    }
  };

  const filteredAutomations = automations.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.action.reportName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0B1120] text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0F172A] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md font-black text-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">EXFIN Automation Center</h1>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-800/60">
                Phase 20 Enterprise
              </span>
              <span className="rounded bg-sky-950/80 px-2 py-0.5 text-[10px] font-mono font-medium text-sky-400 border border-sky-800/60 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Tally Read-Only Enforced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic Rule Engine, Scheduled Dispatches, Multi-Level Approvals & Live Business Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setWizardStep(1);
              setShowWizard(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Automation</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 bg-[#0B132B] border-b border-slate-800 text-xs shrink-0 overflow-x-auto">
        {(
          [
            { id: 'Overview', label: 'Overview & KPIs', icon: TrendingUp },
            { id: 'Schedules', label: 'Schedules', icon: Clock },
            { id: 'Rules', label: 'Rule Engine', icon: Sliders },
            { id: 'Alerts', label: 'Alerts & Anomalies', icon: AlertTriangle, count: alerts.length },
            { id: 'Reports', label: 'Scheduled Reports', icon: FileText },
            { id: 'Notifications', label: 'In-App Center', icon: Bell, count: notifications.filter((n) => !n.isRead).length },
            { id: 'Approvals', label: 'Approval Workflows', icon: UserCheck, count: approvals.filter((a) => a.status === 'Pending').length },
            { id: 'History', label: 'Execution History', icon: History },
            { id: 'Settings', label: 'Calendar & Policies', icon: Settings }
          ] as { id: typeof activeTab; label: string; icon: any; count?: number }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
                isActive
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ==================================================================== */}
        {/* 1. OVERVIEW & KPI MONITORING */}
        {/* ==================================================================== */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Quick Copilot Automation Generator */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Natural-Language Automation & Alert Creator</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='e.g., "Send monthly sales PDF to finance directors on the 1st of every month at 9 AM"'
                  value={copilotDraftPrompt}
                  onChange={(e) => setCopilotDraftPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCopilotDraftCreate()}
                  className="flex-1 bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleCopilotDraftCreate}
                  disabled={copilotDraftLoading || !copilotDraftPrompt.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Workflow</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Copilot will draft a structured workflow with triggers, conditions, and recipients for your review. (No workflow is ever auto-activated without explicit confirmation).
              </p>
            </div>

            {/* Top 6 KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Workflows</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">{dashboardData?.activeAutomationsCount ?? 2}</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Scheduled</span>
                </div>
              </div>

              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Successful Runs</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">{dashboardData?.successfulRunsCount ?? 48}</div>
                <div className="text-[11px] text-slate-400 mt-1">Last run 24h ago</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Pending Approvals</span>
                  <UserCheck className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">{dashboardData?.pendingApprovalsCount ?? 1}</div>
                <div className="text-[11px] text-purple-400 mt-1">Requires Controller</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Alerts</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">{dashboardData?.activeAlertsCount ?? 1}</div>
                <div className="text-[11px] text-rose-400 mt-1">1 High Severity</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Scheduled Reports</span>
                  <FileText className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-slate-100">{dashboardData?.scheduledReportsCount ?? 2}</div>
                <div className="text-[11px] text-sky-400 mt-1">PDF & XLSX Watermarked</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Tally Health</span>
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-sm font-bold text-emerald-400">Sync: 8m ago</div>
                <div className="text-[11px] text-slate-400 mt-1">0 Parity Mismatches</div>
              </div>
            </div>

            {/* KPI Health Watchlist */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Live Business KPI Monitoring</h2>
                  <p className="text-xs text-slate-400">Deterministic metric tracking against user-defined target thresholds</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">Company: EXFIN GLOBAL ENTERPRISES PVT LTD</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData?.kpis.map((kpi) => (
                  <div key={kpi.kpiId} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{kpi.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          kpi.status === 'On Target'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : kpi.status === 'Warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {kpi.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-xl font-black text-slate-100">
                        {kpi.metric.includes('Percentage') ? `${kpi.currentValue}%` : `₹${kpi.currentValue.toLocaleString('en-IN')}`}
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          kpi.variancePercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {kpi.variancePercentage >= 0 ? `+${kpi.variancePercentage}%` : `${kpi.variancePercentage}%`} vs Prev
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span className="text-slate-200 font-mono">
                          {kpi.metric.includes('Percentage') ? `${kpi.targetValue}%` : `₹${kpi.targetValue.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Period:</span>
                        <span className="text-slate-300">{kpi.period}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Automations List */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Configured Enterprise Workflows</h2>
                  <p className="text-xs text-slate-400">Scheduled and condition-based automated jobs</p>
                </div>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Workflow Name</th>
                      <th className="py-2.5 px-3">Trigger Type</th>
                      <th className="py-2.5 px-3">Schedule / Condition</th>
                      <th className="py-2.5 px-3">Action & Format</th>
                      <th className="py-2.5 px-3">Approval</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAutomations.map((auto) => (
                      <tr key={auto.automationId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{auto.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{auto.description}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                            {auto.trigger}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-300">
                          {auto.trigger === 'Scheduled' ? (
                            <div>
                              <div className="font-mono text-slate-200">{auto.schedule.cronExpression}</div>
                              <div className="text-[10px] text-slate-400">{auto.schedule.timezone}</div>
                            </div>
                          ) : (
                            <div className="text-rose-300 font-mono">
                              Threshold: &gt; ₹5,00,000
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <div className="font-medium text-slate-200">{auto.action.reportName}</div>
                          <div className="text-[10px] text-slate-400">
                            {auto.action.exportFormat} • {auto.action.classification}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {auto.approval.requiresApproval ? (
                            <span className="text-[10px] font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                              Controller Req.
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              auto.status === 'Active'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : auto.status === 'Draft'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {auto.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRunDryRun(auto.automationId)}
                              title="Safe Dry Run Simulation"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleExecuteNow(auto.automationId)}
                              title="Execute Workflow Now"
                              className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. ALERTS & ANOMALIES */}
        {/* ==================================================================== */}
        {activeTab === 'Alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Active Financial & Operational Alerts</h2>
                <p className="text-xs text-slate-400">
                  Automated threshold exceptions, overdue receivables, and GST variance alerts
                </p>
              </div>
              <span className="text-xs text-slate-400">Deduplication & 3-Level Escalation Active</span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          alert.severity === 'Critical' || alert.severity === 'High'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {alert.severity} Severity
                      </span>
                      <span className="text-xs font-bold text-slate-100">{alert.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">Level {alert.escalationLevel} Escalation</span>
                      <span className="text-[10px] font-mono text-slate-500">[{alert.deduplicationKey}]</span>
                    </div>

                    <p className="text-xs text-slate-300">{alert.message}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span>
                        Actual: <strong className="text-slate-200">₹{alert.actualValue.toLocaleString('en-IN')}</strong>
                      </span>
                      <span>
                        Threshold: <strong className="text-slate-200">₹{alert.thresholdValue.toLocaleString('en-IN')}</strong>
                      </span>
                      <span>Period: {alert.period}</span>
                      <span>Assigned: {alert.assignedTo}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.lifecycleStatus === 'Triggered' && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.alertId)}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    <button
                      onClick={() => handleResolveAlert(alert.alertId)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Resolve
                    </button>

                    <button
                      onClick={() => handleSnoozeAlert(alert.alertId, 4)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Snooze 4h
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. APPROVAL WORKFLOWS */}
        {/* ==================================================================== */}
        {activeTab === 'Approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Pending Execution & Distribution Approvals</h2>
                <p className="text-xs text-slate-400">
                  Enforces segregation of duties — request creator cannot approve their own workflow
                </p>
              </div>
              <span className="text-xs text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                Segregation of Duties Enforced
              </span>
            </div>

            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req.approvalId} className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-100">{req.automationName}</div>
                      <div className="text-xs text-slate-400">
                        Requested by <strong className="text-slate-200">{req.requestedBy}</strong> at{' '}
                        {new Date(req.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                      Status: {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Report / Payload:</span>
                      <span className="text-slate-200 font-medium">{req.reportSummary}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Recipients:</span>
                      <span className="text-slate-200 font-medium">{req.recipientsSummary}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Potential Impact:</span>
                      <span className="text-rose-300 font-medium">{req.potentialImpact}</span>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setApprovalModalItem(req);
                          setApprovalComment('');
                        }}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Review & Decide
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. EXECUTION HISTORY & TRACEABILITY */}
        {/* ==================================================================== */}
        {activeTab === 'History' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Automation Execution Audit Logs</h2>
              <p className="text-xs text-slate-400">Complete end-to-end lineage and delivery audit trail</p>
            </div>

            <div className="bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Execution ID</th>
                    <th className="py-2.5 px-3">Workflow Name</th>
                    <th className="py-2.5 px-3">Triggered</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Records Evaluated</th>
                    <th className="py-2.5 px-3">Notifications</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Lineage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {executions.map((exec) => (
                    <tr key={exec.executionId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-slate-400">{exec.executionId}</td>
                      <td className="py-3 px-3 font-medium text-slate-200">{exec.automationName}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(exec.startedAt).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{exec.durationMs}ms</td>
                      <td className="py-3 px-3 text-slate-300">{exec.recordsEvaluated}</td>
                      <td className="py-3 px-3 text-slate-300">{exec.notificationsSent}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {exec.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedExecutionTrace(exec)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors"
                        >
                          View Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 5. IN-APP NOTIFICATIONS */}
        {/* ==================================================================== */}
        {activeTab === 'Notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">In-App Notification Center</h2>
                <p className="text-xs text-slate-400">System alerts, synchronization events, and report completions</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.notificationId}
                  className={`bg-[#1E293B] border ${
                    notif.isRead ? 'border-slate-800 opacity-70' : 'border-amber-500/40'
                  } rounded-xl p-4 flex items-start justify-between gap-3`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">{notif.message}</p>
                    <span className="text-[10px] text-slate-500">Source: {notif.source}</span>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/automation/notifications/${notif.notificationId}/read`, { method: 'POST' });
                        fetchData();
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 6. RULES, SCHEDULES, REPORTS & SETTINGS (Additional Sub-Views) */}
        {/* ==================================================================== */}
        {(activeTab === 'Rules' || activeTab === 'Schedules' || activeTab === 'Reports' || activeTab === 'Settings') && (
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100">{activeTab} Configuration & Governance</h2>
                <p className="text-xs text-slate-400">
                  Deterministic accounting rule operators, quiet hours protection, and watermark governance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <h3 className="font-semibold text-slate-200">Quiet Hours & Rate Limiting</h3>
                <p className="text-slate-400 leading-relaxed">
                  Quiet hours are enforced from <strong className="text-slate-200">22:00 to 07:00 IST</strong>. Critical
                  severity alerts (e.g., GST reconciliation differences, massive debtor defaults) may bypass quiet hours.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Max 10 notifications/hour global ceiling active</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <h3 className="font-semibold text-slate-200">Data Classification & Watermarks</h3>
                <p className="text-slate-400 leading-relaxed">
                  All automated PDF/XLSX dispatches apply deterministic watermarking (
                  <code className="text-amber-400">EXFIN CONFIDENTIAL - INTERNAL USE ONLY</code>) and require RBAC
                  classification tags.
                </p>
                <div className="flex items-center gap-2 text-purple-400 font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Credentials and tokens redacted from all logs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 9-STEP AUTOMATION CREATION WIZARD MODAL */}
      {/* ==================================================================== */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B1120]">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Create Enterprise Automation Workflow</h3>
                  <p className="text-[11px] text-slate-400">Step {wizardStep} of 9</p>
                </div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Step 1: Trigger */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 1: Select Workflow Trigger</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { id: 'Scheduled', label: 'Scheduled Time (Cron)', desc: 'Run on a recurring clock (e.g. daily 6 PM, weekly, monthly)' },
                        { id: 'Threshold', label: 'Metric Threshold', desc: 'Trigger when an analytical metric exceeds or drops below a value' },
                        { id: 'DataRefreshCompleted', label: 'Tally Ingestion Event', desc: 'Trigger automatically after a successful Tally synchronization' },
                        { id: 'Manual', label: 'Manual On-Demand', desc: 'Execution triggered manually by authorized users' }
                      ] as const
                    ).map((trig) => (
                      <button
                        key={trig.id}
                        onClick={() => setWizardDraft({ ...wizardDraft, trigger: trig.id })}
                        className={`p-4 rounded-xl text-left border transition-all ${
                          wizardDraft.trigger === trig.id
                            ? 'border-amber-500 bg-amber-950/30 text-slate-100 shadow-sm'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-slate-200 mb-1">{trig.label}</div>
                        <div className="text-[11px] text-slate-400">{trig.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Details & Name */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 2: Name & Company Context</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Automation Workflow Name</label>
                      <input
                        type="text"
                        value={wizardDraft.name || ''}
                        onChange={(e) => setWizardDraft({ ...wizardDraft, name: e.target.value })}
                        placeholder="e.g. Weekly Debtors Ageing Digest"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={wizardDraft.description || ''}
                        onChange={(e) => setWizardDraft({ ...wizardDraft, description: e.target.value })}
                        placeholder="Brief summary of business purpose..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Condition / Rule Builder */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-200">Step 3: Analytical Condition Rules</h4>
                    <button
                      onClick={handleTestRuleCondition}
                      disabled={testRuleLoading}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-medium transition-colors"
                    >
                      {testRuleLoading ? 'Testing...' : 'Test Current Rule'}
                    </button>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Dataset</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200">
                          <option>SalesVoucherSummary</option>
                          <option>OutstandingReceivables</option>
                          <option>PnLSummary</option>
                          <option>GSTLiabilitySummary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Operator</label>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200">
                          <option>GreaterThan</option>
                          <option>LessThan</option>
                          <option>Equals</option>
                          <option>Between</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Threshold (₹)</label>
                        <input
                          type="number"
                          defaultValue={500000}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                        />
                      </div>
                    </div>

                    {ruleTestResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          ruleTestResult.wouldTrigger
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <strong>Rule Preview Result:</strong> {ruleTestResult.message}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Action & Report */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 4: Action, Report Format & Watermark</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Report</label>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200">
                        <option>Daily Sales Summary & Top Debtors</option>
                        <option>Receivables Ageing Breakdown</option>
                        <option>Monthly P&L and Margin Overview</option>
                        <option>GSTR-1 Tax Reconciliation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Export Format</label>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200">
                        <option>PDF</option>
                        <option>XLSX</option>
                        <option>CSV</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Watermark Text</label>
                    <input
                      type="text"
                      defaultValue="EXFIN CONFIDENTIAL - INTERNAL USE ONLY"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Recipients */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 5: Delivery Recipients & Roles</h4>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Arun Sharma (Finance Director)</span>
                      <span className="font-mono text-slate-400">arun.sharma@exfin.internal</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Credit Control Desk (Role Group)</span>
                      <span className="font-mono text-slate-400">credit.control@exfin.internal</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Approval Policy */}
              {wizardStep === 6 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 6: Approval Policy & Segregation of Duties</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-700 text-amber-500" />
                      <span className="text-slate-300">Enforce Segregation of Duties (Creator cannot approve)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded bg-slate-900 border-slate-700 text-amber-500" />
                      <span className="text-slate-300">Require Financial Controller approval before external dispatch</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 7: Schedule */}
              {wizardStep === 7 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 7: Cron Schedule & Timezone</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Cron Expression</label>
                      <input
                        type="text"
                        defaultValue="0 18 * * 1-5"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Timezone</label>
                      <input
                        type="text"
                        defaultValue="Asia/Kolkata"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Review & Dry-Run */}
              {wizardStep === 8 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Step 8: Review & Dry Run Simulation</h4>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div>
                      <strong>Workflow Name:</strong> {wizardDraft.name || 'Custom Sales Automation'}
                    </div>
                    <div>
                      <strong>Trigger:</strong> {wizardDraft.trigger}
                    </div>
                    <div>
                      <strong>Report:</strong> {wizardDraft.action?.reportName} ({wizardDraft.action?.exportFormat})
                    </div>
                    <div>
                      <strong>Recipients:</strong> {wizardDraft.action?.recipients?.length || 1} recipients
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0B1120]">
              <button
                onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                disabled={wizardStep === 1}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {wizardStep < 8 ? (
                  <button
                    onClick={() => setWizardStep((prev) => prev + 1)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Next
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSaveWizard(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => handleSaveWizard(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Activate Workflow
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DRY RUN RESULT MODAL */}
      {/* ==================================================================== */}
      {dryRunRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B1120]">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Safe Dry-Run Simulation Results</h3>
              </div>
              <button onClick={() => setDryRunRecord(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 text-amber-300">
                <strong>Simulation Notice:</strong> No emails or external notifications were transmitted.
              </div>

              <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                {dryRunRecord.deliveryLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-200">Lineage Trace:</span>
                <p className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono">
                  {dryRunRecord.lineageTrace}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* APPROVAL DECISION MODAL */}
      {/* ==================================================================== */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-purple-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Workflow Approval Review</h3>
              <button onClick={() => setApprovalModalItem(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-slate-300">
                <strong>Workflow:</strong> {approvalModalItem.automationName}
              </div>
              <div className="text-slate-300">
                <strong>Requested By:</strong> {approvalModalItem.requestedBy}
              </div>
              <div className="text-rose-300">
                <strong>Impact:</strong> {approvalModalItem.potentialImpact}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Decision Comments</label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Specify reasons for approval or rejection..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleApproveReject(approvalModalItem.approvalId, 'Reject')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleApproveReject(approvalModalItem.approvalId, 'Approve')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
              >
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LINEAGE TRACE MODAL */}
      {/* ==================================================================== */}
      {selectedExecutionTrace && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Execution Audit Lineage</h3>
              <button onClick={() => setSelectedExecutionTrace(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Execution ID:</span>
                <span className="font-mono text-amber-400">{selectedExecutionTrace.executionId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Dataset & Engine Lineage:</span>
                <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300">
                  {selectedExecutionTrace.lineageTrace}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Delivery Log:</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-400 space-y-1">
                  {selectedExecutionTrace.deliveryLog.map((item, idx) => (
                    <div key={idx}>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
