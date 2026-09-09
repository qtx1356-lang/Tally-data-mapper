import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  MessageSquare,
  Paperclip,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  XCircle,
  Download,
  KeyRound,
  Eye,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Info,
  Building2,
  UserCheck,
  UserX,
  ExternalLink,
  Shield,
  Fingerprint
} from 'lucide-react';
import {
  TaskModel,
  TaskPriority,
  TaskStatus,
  TaskType,
  ExceptionModel,
  ExceptionSeverity,
  ExceptionStatus,
  ResolutionType,
  ApprovalModel,
  ApprovalStatus,
  PeriodControlModel,
  PeriodStatus,
  ChecklistInstance,
  ReconciliationSignOffModel,
  AuditPackModel,
  WatermarkType,
  PolicyModel,
  ControlLibraryItem,
  ControlCenterKPIs,
  ControlAuditEntry
} from '../types/phase26ControlCenter';

type ControlTab =
  | 'Dashboard'
  | 'Tasks'
  | 'Approvals'
  | 'Exceptions'
  | 'Checklists'
  | 'Reconciliations'
  | 'Period Close'
  | 'Audit Packs'
  | 'Policies'
  | 'Control Library & History';

export const ControlCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ControlTab>('Dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Core Data States
  const [kpis, setKpis] = useState<ControlCenterKPIs>({
    closeCompletionPct: 80,
    exceptionResolutionPct: 75,
    reconciliationCompletionPct: 90,
    approvalCompletionPct: 85,
    openTasksCount: 3,
    overdueTasksCount: 0,
    pendingApprovalsCount: 1,
    criticalExceptionsCount: 1,
    controlPassRatePct: 88
  });

  const [tasks, setTasks] = useState<TaskModel[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('All');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('All');
  const [newTaskModalOpen, setNewTaskModalOpen] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDesc, setNewTaskDesc] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
  const [newTaskType, setNewTaskType] = useState<TaskType>('Review');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('Vikram Joshi (Senior Controller)');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('2026-03-31');

  // Exceptions
  const [exceptions, setExceptions] = useState<ExceptionModel[]>([]);
  const [selectedException, setSelectedException] = useState<ExceptionModel | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState<boolean>(false);
  const [resolutionType, setResolutionType] = useState<ResolutionType>('Valid Transaction');
  const [resolutionComment, setResolutionComment] = useState<string>('');
  const [acceptedRiskReason, setAcceptedRiskReason] = useState<string>('');
  const [acceptedRiskApprover, setAcceptedRiskApprover] = useState<string>('Arjun Mehta (VP Finance)');
  const [acceptedRiskExpiry, setAcceptedRiskExpiry] = useState<string>('2026-04-30');

  // Approvals
  const [approvals, setApprovals] = useState<ApprovalModel[]>([]);
  const [decisionModalOpen, setDecisionModalOpen] = useState<boolean>(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalModel | null>(null);
  const [decisionType, setDecisionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [decisionComment, setDecisionComment] = useState<string>('');

  // Checklists & Period Close
  const [periods, setPeriods] = useState<PeriodControlModel[]>([]);
  const [checklist, setChecklist] = useState<ChecklistInstance | null>(null);
  const [reopenModalOpen, setReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenApprover, setReopenApprover] = useState<string>('Arjun Mehta (VP Finance)');

  // Reconciliations
  const [reconciliations, setReconciliations] = useState<ReconciliationSignOffModel[]>([]);
  const [signOffModalOpen, setSignOffModalOpen] = useState<boolean>(false);
  const [selectedRecon, setSelectedRecon] = useState<ReconciliationSignOffModel | null>(null);
  const [signOffDecision, setSignOffDecision] = useState<'Approved' | 'Rejected' | 'Approved With Exception'>('Approved');
  const [signOffComment, setSignOffComment] = useState<string>('');

  // Audit Packs
  const [auditPacks, setAuditPacks] = useState<AuditPackModel[]>([]);
  const [selectedAuditPack, setSelectedAuditPack] = useState<AuditPackModel | null>(null);
  const [auditPackWatermark, setAuditPackWatermark] = useState<WatermarkType>('CONFIDENTIAL');

  // Policies & Controls
  const [policies, setPolicies] = useState<PolicyModel[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [controls, setControls] = useState<ControlLibraryItem[]>([]);
  const [audits, setAudits] = useState<ControlAuditEntry[]>([]);

  // Initial Fetch
  useEffect(() => {
    fetchDashboardData();
    fetchTasks();
    fetchExceptions();
    fetchApprovals();
    fetchPeriodsAndChecklists();
    fetchReconciliations();
    fetchAuditPacks();
    fetchPoliciesAndControls();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/control-center/dashboard');
      const data = await res.json();
      if (data.success) {
        setKpis(data.data.kpis);
      }
    } catch (e) {
      console.error('Failed to load dashboard KPIs', e);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/control-center/tasks?status=${taskFilterStatus}&priority=${taskFilterPriority}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const fetchExceptions = async () => {
    try {
      const res = await fetch('/api/control-center/exceptions');
      const data = await res.json();
      if (data.success) {
        setExceptions(data.data);
      }
    } catch (e) {
      console.error('Failed to load exceptions', e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/control-center/approvals');
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (e) {
      console.error('Failed to load approvals', e);
    }
  };

  const fetchPeriodsAndChecklists = async () => {
    try {
      const [resPeriods, resChecklist] = await Promise.all([
        fetch('/api/control-center/periods'),
        fetch('/api/control-center/checklists/current')
      ]);
      const dataP = await resPeriods.json();
      const dataC = await resChecklist.json();
      if (dataP.success) setPeriods(dataP.data);
      if (dataC.success) setChecklist(dataC.data);
    } catch (e) {
      console.error('Failed to load periods & checklists', e);
    }
  };

  const fetchReconciliations = async () => {
    try {
      const res = await fetch('/api/control-center/reconciliations');
      const data = await res.json();
      if (data.success) setReconciliations(data.data);
    } catch (e) {
      console.error('Failed to load reconciliations', e);
    }
  };

  const fetchAuditPacks = async () => {
    try {
      const res = await fetch('/api/control-center/audit-packs');
      const data = await res.json();
      if (data.success) {
        setAuditPacks(data.data);
        if (data.data.length > 0) setSelectedAuditPack(data.data[0]);
      }
    } catch (e) {
      console.error('Failed to load audit packs', e);
    }
  };

  const fetchPoliciesAndControls = async () => {
    try {
      const [resPol, resCtl, resAud] = await Promise.all([
        fetch('/api/control-center/policies'),
        fetch('/api/control-center/controls'),
        fetch('/api/control-center/audits')
      ]);
      const dataPol = await resPol.json();
      const dataCtl = await resCtl.json();
      const dataAud = await resAud.json();
      if (dataPol.success) setPolicies(dataPol.data);
      if (dataCtl.success) setControls(dataCtl.data);
      if (dataAud.success) setAudits(dataAud.data);
    } catch (e) {
      console.error('Failed to load policies/controls', e);
    }
  };

  // Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/control-center/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority,
          type: newTaskType,
          assignedTo: newTaskAssignee,
          dueDate: newTaskDueDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setTasks([data.data, ...tasks]);
        setNewTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        showNotification('success', 'Operational control task successfully assigned.');
        fetchDashboardData();
      } else {
        showNotification('error', data.error || 'Failed to create task');
      }
    } catch (err) {
      showNotification('error', 'Error creating task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/control-center/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map((t) => (t.taskId === taskId ? data.data : t)));
        if (selectedTask?.taskId === taskId) setSelectedTask(data.data);
        showNotification('success', `Task status updated to ${newStatus}.`);
        fetchDashboardData();
      }
    } catch (err) {
      showNotification('error', 'Failed to update task status');
    }
  };

  // Exception Actions
  const handleResolveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;

    try {
      const res = await fetch(`/api/control-center/exceptions/${selectedException.exceptionId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionType,
          resolutionComment,
          acceptedRiskReason,
          acceptedRiskApprover,
          acceptedRiskExpiryDate: acceptedRiskExpiry
        })
      });
      const data = await res.json();
      if (data.success) {
        setExceptions(exceptions.map((ex) => (ex.exceptionId === selectedException.exceptionId ? data.data : ex)));
        setResolutionModalOpen(false);
        setSelectedException(null);
        showNotification('success', `Exception marked as ${data.data.status}.`);
        fetchDashboardData();
      }
    } catch (err) {
      showNotification('error', 'Failed to resolve exception');
    }
  };

  // Approval Actions
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    try {
      const res = await fetch(`/api/control-center/approvals/${selectedApproval.approvalId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          comment: decisionComment
        })
      });
      const data = await res.json();
      if (data.success) {
        setApprovals(approvals.map((a) => (a.approvalId === selectedApproval.approvalId ? data.data : a)));
        setDecisionModalOpen(false);
        setSelectedApproval(null);
        showNotification('success', `Decision recorded: ${decisionType}.`);
        fetchDashboardData();
      } else {
        showNotification('error', data.error || 'Approval decision rejected by rule.');
      }
    } catch (err) {
      showNotification('error', 'Failed to submit approval decision');
    }
  };

  // Checklist Item Toggle
  const handleToggleChecklistItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/control-center/checklists/items/${itemId}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setChecklist(data.data);
        showNotification('info', 'Checklist item updated with user audit stamp.');
      }
    } catch (err) {
      showNotification('error', 'Failed to toggle checklist item');
    }
  };

  // Close Period Action
  const handleClosePeriod = async (periodId: string, override: boolean = false) => {
    try {
      const res = await fetch(`/api/control-center/periods/${periodId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrideBlockers: override })
      });
      const data = await res.json();
      if (data.success) {
        setPeriods(periods.map((p) => (p.periodId === periodId ? data.data : p)));
        showNotification('success', 'Period officially locked and closed in EXFIN Control Layer.');
      } else {
        showNotification('error', data.error);
      }
    } catch (err) {
      showNotification('error', 'Failed to close period');
    }
  };

  // Reopen Period Action
  const handleReopenPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    const active = periods.find((p) => p.status === 'Closed');
    if (!active) return;

    try {
      const res = await fetch(`/api/control-center/periods/${active.periodId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reopenReason,
          approver: reopenApprover
        })
      });
      const data = await res.json();
      if (data.success) {
        setPeriods(periods.map((p) => (p.periodId === active.periodId ? data.data : p)));
        setReopenModalOpen(false);
        showNotification('success', `Period reopened under audit mandate. Reason: ${reopenReason}`);
      }
    } catch (err) {
      showNotification('error', 'Failed to reopen period');
    }
  };

  // Reconciliation Sign-Off
  const handleSignOffRecon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecon) return;

    try {
      const res = await fetch(`/api/control-center/reconciliations/${selectedRecon.signOffId}/signoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: signOffDecision,
          comment: signOffComment
        })
      });
      const data = await res.json();
      if (data.success) {
        setReconciliations(reconciliations.map((r) => (r.signOffId === selectedRecon.signOffId ? data.data : r)));
        setSignOffModalOpen(false);
        setSelectedRecon(null);
        showNotification('success', `Reconciliation signed off with SHA-256 integrity seal.`);
      }
    } catch (err) {
      showNotification('error', 'Failed to sign off reconciliation');
    }
  };

  // Generate Audit Pack
  const handleGenerateAuditPack = async () => {
    try {
      const res = await fetch('/api/control-center/audit-packs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: 'March 2026',
          watermark: auditPackWatermark
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuditPacks([data.data, ...auditPacks]);
        setSelectedAuditPack(data.data);
        showNotification('success', 'Comprehensive Audit Pack generated with cryptographic manifest.');
      }
    } catch (err) {
      showNotification('error', 'Failed to generate audit pack');
    }
  };

  // Simulate Policy
  const handleSimulatePolicy = async (pol: PolicyModel) => {
    try {
      const res = await fetch('/api/control-center/policies/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: pol.condition,
          action: pol.action
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
        showNotification('info', `Policy simulation evaluated: ${data.data.wouldTriggerCount} triggers detected.`);
      }
    } catch (err) {
      showNotification('error', 'Simulation failed');
    }
  };

  // Run Control Check
  const handleRunControl = async (controlId: string) => {
    try {
      const res = await fetch(`/api/control-center/controls/${controlId}/run`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setControls(controls.map((c) => (c.controlId === controlId ? data.data : c)));
        showNotification('success', 'Automated control execution finished.');
      }
    } catch (err) {
      showNotification('error', 'Failed to run control');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">EXFIN Control Center</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  PHASE 26 ENTERPRISE WORKFLOW
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  READ-ONLY TALLY GUARD ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Approvals, Exception Queues, Period Closing, Month-End Checklists, Reconciliation Sign-offs & Cryptographic Audit Packs
              </p>
            </div>
          </div>

          {/* Company & Period Badges */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 font-medium">Acme Enterprise Ltd (HO)</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1.5 flex items-center space-x-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-medium">March 2026 (Closing)</span>
            </div>
            <button
              onClick={() => {
                fetchDashboardData();
                fetchTasks();
                fetchExceptions();
                fetchApprovals();
                showNotification('info', 'Control Center state refreshed from local engine.');
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
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* 10 Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-4 border-b border-slate-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: ShieldCheck },
            { id: 'Tasks', label: `Tasks (${tasks.filter((t) => t.status !== 'Completed').length})`, icon: CheckSquare },
            { id: 'Approvals', label: `Approvals (${approvals.filter((a) => a.status === 'Pending').length})`, icon: UserCheck },
            { id: 'Exceptions', label: `Exceptions (${exceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Accepted Risk').length})`, icon: AlertTriangle },
            { id: 'Checklists', label: 'Month-End Checklists', icon: FileCheck2 },
            { id: 'Reconciliations', label: 'Reconciliations Sign-off', icon: Fingerprint },
            { id: 'Period Close', label: 'Period Close Control', icon: Lock },
            { id: 'Audit Packs', label: 'Audit Packs', icon: FileSpreadsheet },
            { id: 'Policies', label: 'Control Policies', icon: Sliders },
            { id: 'Control Library & History', label: 'Control Library & History', icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ControlTab)}
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

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================== */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================================== */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Period Close Progress</span>
                  <Lock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{kpis.closeCompletionPct}%</span>
                  <span className="text-xs text-amber-400 font-medium">March 2026 (Closing)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${kpis.closeCompletionPct}%` }} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Tasks</span>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{kpis.openTasksCount}</span>
                  <span className="text-xs text-rose-400 font-medium">{kpis.overdueTasksCount} Overdue</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Assigned to Controllers & Tax Leads</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Exceptions</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-rose-400">{kpis.criticalExceptionsCount}</span>
                  <span className="text-xs text-slate-400">Resolution Rate: {kpis.exceptionResolutionPct}%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">1 Blocking March Month-End Close</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
                  <UserCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-amber-400">{kpis.pendingApprovalsCount}</span>
                  <span className="text-xs text-emerald-400 font-medium">Control Pass Rate: {kpis.controlPassRatePct}%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Multi-Level Matrix Routing Active</p>
              </div>
            </div>

            {/* Quick Actions & Recent Operational Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Attention Box */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Active Control Exceptions Requiring Attention</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('Exceptions')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {exceptions.map((exc) => (
                    <div
                      key={exc.exceptionId}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              exc.severity === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : exc.severity === 'High'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {exc.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">{exc.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{exc.description}</p>
                        <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                          <span>Source: {exc.source}</span>
                          <span>Assigned: {exc.assignedTo}</span>
                          <span className="text-slate-400">Status: {exc.status}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedException(exc);
                          setResolutionModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded border border-slate-700 whitespace-nowrap"
                      >
                        Action / Resolve
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Audit Log Stream */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span>Control Audit Stream</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Immutable</span>
                </div>

                <div className="space-y-3">
                  {audits.map((aud) => (
                    <div key={aud.auditId} className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-400">{aud.event}</span>
                        <span className="text-[10px] text-slate-500">{new Date(aud.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{aud.details}</p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>By {aud.actor} ({aud.role})</span>
                        <span className="font-mono text-emerald-400">{aud.newState}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: TASKS ENGINE */}
        {/* ========================================== */}
        {activeTab === 'Tasks' && (
          <div className="space-y-6">
            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={taskFilterStatus}
                  onChange={(e) => {
                    setTaskFilterStatus(e.target.value);
                    setTimeout(fetchTasks, 100);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={taskFilterPriority}
                  onChange={(e) => {
                    setTaskFilterPriority(e.target.value);
                    setTimeout(fetchTasks, 100);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                onClick={() => setNewTaskModalOpen(true)}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Control Task</span>
              </button>
            </div>

            {/* Task Grid & Detail Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Cards Column */}
              <div className="lg:col-span-2 space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => setSelectedTask(task)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedTask?.taskId === task.taskId
                        ? 'bg-slate-800/90 border-blue-500'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              task.priority === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : task.priority === 'High'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                              task.status === 'Blocked'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : task.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : task.status === 'Pending Review'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-blue-950 text-blue-400 border border-blue-800'
                            }`}
                          >
                            {task.status}
                          </span>
                          <span className="text-xs font-semibold text-white">{task.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-3">
                        <span>Assigned: <strong className="text-slate-300">{task.assignedTo}</strong></span>
                        <span>Due: <strong className="text-slate-300">{task.dueDate}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>{task.checklist.filter((c) => c.isCompleted).length}/{task.checklist.length} Checklist</span>
                        {task.comments.length > 0 && <span>• {task.comments.length} Comments</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Detail Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                {selectedTask ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono">{selectedTask.taskId}</span>
                        <h4 className="text-sm font-bold text-white">{selectedTask.title}</h4>
                      </div>
                      <select
                        value={selectedTask.status}
                        onChange={(e) => handleUpdateTaskStatus(selectedTask.taskId, e.target.value as TaskStatus)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-blue-400 font-medium"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400">Description:</span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        {selectedTask.description}
                      </p>
                    </div>

                    {/* Task Checklist */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Mandatory Review Checklist:</span>
                      <div className="mt-2 space-y-2">
                        {selectedTask.checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-slate-950/50 rounded border border-slate-800 text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => {
                                  // Update item in task
                                  item.isCompleted = !item.isCompleted;
                                  setTasks([...tasks]);
                                }}
                                className="rounded bg-slate-900 border-slate-700 text-blue-500"
                              />
                              <span className={item.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}>
                                {item.item}
                              </span>
                            </div>
                            {item.evidence && (
                              <span className="text-[10px] bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                {item.evidence}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dependencies */}
                    {selectedTask.dependencies.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400">Blocking Dependencies:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedTask.dependencies.map((dep) => (
                            <span key={dep} className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[11px]">
                              Requires {dep} completion
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Select any task to inspect details, checklist items, and history.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: APPROVALS ENGINE */}
        {/* ========================================== */}
        {activeTab === 'Approvals' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span>Multi-Level Approval Matrix & Decisions Inbox</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enforces Segregation of Duties, Sequential Escalations, and Prevents Self-Approval.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {approvals.map((appr) => (
                  <div key={appr.approvalId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                            {appr.objectType}
                          </span>
                          <h4 className="text-sm font-bold text-white">{appr.objectTitle}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Requested by: <strong className="text-slate-300">{appr.requester}</strong> • Created: {new Date(appr.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            appr.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : appr.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {appr.status}
                        </span>

                        {appr.status === 'Pending' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecisionType('Approved');
                                setDecisionModalOpen(true);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded shadow transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecisionType('Rejected');
                                setDecisionModalOpen(true);
                              }}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded shadow transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-Level Stepper Visualizer */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 mb-2 block">Approval Matrix Progression:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {appr.steps.map((step) => (
                          <div
                            key={step.level}
                            className={`p-3 rounded-lg border text-xs space-y-1 ${
                              step.status === 'Approved'
                                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                                : step.status === 'Pending'
                                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">Level {step.level}: {step.role}</span>
                              <span className="text-[10px] uppercase font-semibold">{step.status}</span>
                            </div>
                            {step.approver && <div className="text-[11px] text-slate-300">By: {step.approver}</div>}
                            {step.comment && <div className="text-[11px] italic text-slate-400">"{step.comment}"</div>}
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
        {/* TAB 4: EXCEPTIONS MANAGEMENT */}
        {/* ========================================== */}
        {activeTab === 'Exceptions' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Control Exceptions Register & Resolution Engine</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Flagged automatically by deterministic threshold, duplicate check, and variance policies.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {exceptions.map((exc) => (
                  <div key={exc.exceptionId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              exc.severity === 'Critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {exc.severity}
                          </span>
                          <span className="text-sm font-bold text-white">{exc.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {exc.ruleName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{exc.description}</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            exc.status === 'Resolved'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : exc.status === 'Accepted Risk'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {exc.status}
                        </span>

                        {exc.status !== 'Resolved' && exc.status !== 'Accepted Risk' && (
                          <button
                            onClick={() => {
                              setSelectedException(exc);
                              setResolutionModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow transition"
                          >
                            Resolve / Accept Risk
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Detected Value</span>
                        <div className="font-semibold text-rose-400">{typeof exc.detectedValue === 'number' ? `₹${exc.detectedValue.toLocaleString()}` : exc.detectedValue}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Threshold Base</span>
                        <div className="font-semibold text-slate-300">{typeof exc.thresholdValue === 'number' ? `₹${exc.thresholdValue.toLocaleString()}` : exc.thresholdValue}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Source Entity</span>
                        <div className="font-semibold text-slate-300">{exc.source}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Fingerprint Hash</span>
                        <div className="font-mono text-[10px] text-slate-400 truncate">{exc.deduplicationHash.slice(0, 16)}...</div>
                      </div>
                    </div>

                    {exc.resolutionType && (
                      <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                        <div>
                          <strong>Resolution ({exc.resolutionType}):</strong> {exc.resolutionComment || exc.acceptedRiskReason}
                        </div>
                        {exc.acceptedRiskApprover && (
                          <span className="text-[11px] text-purple-400">Approved by: {exc.acceptedRiskApprover}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: CHECKLISTS */}
        {/* ========================================== */}
        {activeTab === 'Checklists' && (
          <div className="space-y-6">
            {checklist && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <FileCheck2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">{checklist.name}</h3>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded border border-blue-500/30">
                        v{checklist.version}.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Period: March 2026 • Completion: <strong className="text-emerald-400">{checklist.completionPct}%</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${checklist.completionPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {checklist.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-4 transition ${
                        item.isCompleted
                          ? 'bg-slate-950/60 border-slate-800'
                          : item.isBlocking
                          ? 'bg-slate-950 border-amber-500/30'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className={`mt-0.5 p-1 rounded transition ${
                            item.isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                              {item.title}
                            </span>
                            {item.isBlocking && (
                              <span className="px-1.5 py-0.2 bg-rose-950 text-rose-400 border border-rose-800 text-[10px] rounded font-medium">
                                Close Blocker
                              </span>
                            )}
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-slate-400">{item.description}</p>
                          {item.evidenceRef && (
                            <div className="flex items-center space-x-1 text-[11px] text-blue-400 pt-1">
                              <Paperclip className="w-3 h-3" />
                              <span>Evidence Linked: {item.evidenceRef}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.isCompleted && item.completedBy && (
                        <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                          <div>Completed by: <strong className="text-slate-300">{item.completedBy}</strong></div>
                          <div className="text-[10px] text-slate-500">{new Date(item.completedAt!).toLocaleTimeString()}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: RECONCILIATIONS SIGN-OFF */}
        {/* ========================================== */}
        {activeTab === 'Reconciliations' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographic Reconciliation Sign-Off Registry</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Locks verified 3-way match states with SHA-256 evidence integrity hashes before period close.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {reconciliations.map((rec) => (
                  <div key={rec.signOffId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Period: {rec.period} • Matched Records: <strong className="text-slate-200">{rec.matchedCount}</strong> • Net Discrepancy: <strong className={rec.varianceAmount === 0 ? 'text-emerald-400' : 'text-amber-400'}>₹{rec.varianceAmount.toLocaleString()}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded ${
                            rec.status === 'Signed Off'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {rec.status}
                        </span>

                        {rec.status !== 'Signed Off' && (
                          <button
                            onClick={() => {
                              setSelectedRecon(rec);
                              setSignOffModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow transition flex items-center space-x-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Sign Off & Seal</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px]">SHA-256 Integrity Hash:</span>
                        <span className="font-mono text-emerald-400 text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs">
                          {rec.integrityHash}
                        </span>
                      </div>
                      {rec.comment && (
                        <div className="text-slate-300 italic pt-1 border-t border-slate-800/60">
                          "{rec.comment}"
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Dataset Snapshot: {rec.datasetSnapshotId} (v{rec.reportVersion}.0)</span>
                        {rec.signedOffAt && <span>Signed: {new Date(rec.signedOffAt).toLocaleString()} by {rec.reviewer}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 7: PERIOD CLOSE CONTROL */}
        {/* ========================================== */}
        {activeTab === 'Period Close' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span>Period Control & Financial Closing Wizard</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    EXFIN-side operational lock protecting historical reports, signed-offs, and compliance logs.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {periods.map((per) => (
                  <div key={per.periodId} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded ${
                              per.status === 'Closed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : per.status === 'Closing'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {per.status.toUpperCase()}
                          </span>
                          <h4 className="text-base font-bold text-white">{per.periodName}</h4>
                          <span className="text-xs text-slate-400 font-mono">({per.fiscalYear})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Dates: {per.startDate} to {per.endDate}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {per.status === 'Closing' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleClosePeriod(per.periodId, false)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-2"
                            >
                              <Lock className="w-4 h-4" />
                              <span>Execute Final Period Close</span>
                            </button>
                            {per.closeBlockersCount > 0 && (
                              <button
                                onClick={() => handleClosePeriod(per.periodId, true)}
                                className="px-3 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition"
                                title="Requires Controller Override"
                              >
                                Override Blockers ({per.closeBlockersCount})
                              </button>
                            )}
                          </div>
                        )}

                        {per.status === 'Closed' && (
                          <button
                            onClick={() => setReopenModalOpen(true)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Request Period Reopen</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pre-Close Validation Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/70 p-3 rounded-lg border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Checklist Progress</span>
                        <div className="font-semibold text-emerald-400">{per.checklistCompletionPct}% Completed</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Reconciliations</span>
                        <div className="font-semibold text-blue-400">{per.reconciliationCompletionPct}% Signed Off</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Unresolved Blockers</span>
                        <div className="font-semibold text-rose-400">{per.closeBlockersCount} Blocking Items</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase">Audit Warnings</span>
                        <div className="font-semibold text-amber-400">{per.warningsCount} Acknowledged</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: AUDIT PACKS GENERATOR */}
        {/* ========================================== */}
        {activeTab === 'Audit Packs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Audit Evidence Package Generator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generates verified ZIP packages with Trial Balances, Ledger Reports, Sign-Offs & SHA-256 Checksums.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={auditPackWatermark}
                  onChange={(e) => setAuditPackWatermark(e.target.value as WatermarkType)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="DRAFT">DRAFT Watermark</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL Watermark</option>
                  <option value="FINAL">FINAL Watermark</option>
                </select>

                <button
                  onClick={handleGenerateAuditPack}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-2 shadow transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate New Audit Pack</span>
                </button>
              </div>
            </div>

            {selectedAuditPack && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                        {selectedAuditPack.watermark}
                      </span>
                      <h4 className="text-base font-bold text-white">{selectedAuditPack.title}</h4>
                      <span className="text-xs text-slate-400 font-mono">v{selectedAuditPack.version}.0</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Generated at: {new Date(selectedAuditPack.generatedAt).toLocaleString()} by {selectedAuditPack.generatedBy}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => showNotification('success', 'Downloading sealed ZIP package with SHA-256 index...')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ZIP</span>
                    </button>
                  </div>
                </div>

                {/* Manifest Explorer */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 mb-2 block">Packaged Evidence Manifest:</span>
                  <div className="space-y-2">
                    {selectedAuditPack.manifest.map((file) => (
                      <div
                        key={file.filename}
                        className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="font-semibold text-slate-200">{file.filename}</span>
                            <div className="text-[11px] text-slate-500 font-mono">{file.type} • {(file.sizeBytes / 1024).toFixed(0)} KB</div>
                          </div>
                        </div>

                        <span className="font-mono text-[11px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-800">
                          {file.checksum}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 9: CONTROL POLICIES */}
        {/* ========================================== */}
        {activeTab === 'Policies' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Control Policy Engine & Historical Simulation</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Construct WHEN-THEN operational rules and simulate impact against historical snapshot datasets.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {policies.map((pol) => (
                  <div key={pol.policyId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                            {pol.scope}
                          </span>
                          <h4 className="text-sm font-bold text-white">{pol.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">v{pol.version}.0</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSimulatePolicy(pol)}
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Simulate on Historical Data</span>
                      </button>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400">WHEN</span>{' '}
                        <strong className="text-amber-400 font-mono">{pol.condition.field} {pol.condition.operator} {pol.condition.value}</strong>
                        <span className="text-slate-400 ml-2">THEN</span>{' '}
                        <strong className="text-emerald-400">{pol.action}</strong>
                      </div>
                      {pol.approverRole && <span className="text-[11px] text-slate-400">Approver: {pol.approverRole}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {simulationResult && (
                <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-blue-300">
                    <span>Simulation Outcome Summary</span>
                    <span>{simulationResult.wouldTriggerCount} Triggers Detected</span>
                  </div>
                  <p className="text-slate-300">
                    Tested across 184 historical transactions in Snapshot SNP-2026-0328-994. No modifications made.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 10: CONTROL LIBRARY & HISTORY */}
        {/* ========================================== */}
        {activeTab === 'Control Library & History' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Control Library & Execution Engine</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Standardized compliance and accounting checks executed on daily, monthly, and event-based cadences.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {controls.map((ctl) => (
                  <div key={ctl.controlId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-semibold">
                          {ctl.category}
                        </span>
                        <span className="text-sm font-bold text-white">{ctl.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({ctl.frequency})</span>
                      </div>
                      <p className="text-xs text-slate-400">{ctl.description}</p>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Owner: {ctl.owner} • Reviewer: {ctl.reviewer} • Approver: {ctl.approver}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded ${
                          ctl.lastResult === 'Pass'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : ctl.lastResult === 'Warning'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {ctl.lastResult}
                      </span>

                      <button
                        onClick={() => handleRunControl(ctl.controlId)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
                        title="Execute Control Check Now"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: CREATE TASK */}
      {/* ========================================== */}
      {newTaskModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Operational Control Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Investigate high variance on Q4 payroll ledger"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Detailed instructions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RESOLVE EXCEPTION */}
      {/* ========================================== */}
      {resolutionModalOpen && selectedException && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Resolve Exception: {selectedException.title}</h3>
            <form onSubmit={handleResolveException} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Resolution Category</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="Valid Transaction">Valid Transaction (False Positive)</option>
                  <option value="Corrected Externally">Corrected Externally in Source Ledger</option>
                  <option value="Accepted Risk">Accepted Risk (Requires Approver)</option>
                  <option value="Duplicate Confirmed">Duplicate Confirmed</option>
                  <option value="Data Issue">Data Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {resolutionType === 'Accepted Risk' ? (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Accepted Risk Reason *</label>
                    <textarea
                      required
                      rows={2}
                      value={acceptedRiskReason}
                      onChange={(e) => setAcceptedRiskReason(e.target.value)}
                      placeholder="State explicit operational justification for accepting this variance..."
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Designated Approver</label>
                      <input
                        type="text"
                        value={acceptedRiskApprover}
                        onChange={(e) => setAcceptedRiskApprover(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Risk Expiry / Review Date</label>
                      <input
                        type="date"
                        value={acceptedRiskExpiry}
                        onChange={(e) => setAcceptedRiskExpiry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-slate-400 mb-1">Resolution Explanation Note</label>
                  <textarea
                    rows={3}
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    placeholder="Provide audit note on verification performed..."
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolutionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: APPROVAL DECISION */}
      {/* ========================================== */}
      {decisionModalOpen && selectedApproval && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Record Approval Decision</h3>
            <p className="text-xs text-slate-400">Object: {selectedApproval.objectTitle}</p>

            <form onSubmit={handleSubmitDecision} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Decision</label>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 text-emerald-400">
                    <input
                      type="radio"
                      name="dec"
                      value="Approved"
                      checked={decisionType === 'Approved'}
                      onChange={() => setDecisionType('Approved')}
                    />
                    <span>Approve</span>
                  </label>
                  <label className="flex items-center space-x-2 text-rose-400">
                    <input
                      type="radio"
                      name="dec"
                      value="Rejected"
                      checked={decisionType === 'Rejected'}
                      onChange={() => setDecisionType('Rejected')}
                    />
                    <span>Reject</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Comment {decisionType === 'Rejected' && <span className="text-rose-400">* (Mandatory on rejection)</span>}
                </label>
                <textarea
                  required={decisionType === 'Rejected'}
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Audit explanation note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded font-bold ${
                    decisionType === 'Approved' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  Confirm {decisionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: REOPEN PERIOD */}
      {/* ========================================== */}
      {reopenModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Unlock className="w-5 h-5 text-amber-400" />
              <span>Mandatory Period Reopen Authorization</span>
            </h3>
            <p className="text-xs text-slate-400">
              Reopening a closed period creates an immutable audit record and triggers reapproval requirements for all associated signed-off controls.
            </p>

            <form onSubmit={handleReopenPeriod} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Audit Reopen Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="State reason (e.g., Late statutory adjustment voucher requirement)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorizing Officer *</label>
                <input
                  type="text"
                  required
                  value={reopenApprover}
                  onChange={(e) => setReopenApprover(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded font-bold">
                  Authorize Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RECONCILIATION SIGN-OFF */}
      {/* ========================================== */}
      {signOffModalOpen && selectedRecon && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>Cryptographic Sign-Off & Seal</span>
            </h3>
            <p className="text-xs text-slate-400">Reconciliation: {selectedRecon.title}</p>

            <form onSubmit={handleSignOffRecon} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Sign-Off Decision</label>
                <select
                  value={signOffDecision}
                  onChange={(e) => setSignOffDecision(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="Approved">Approved (Zero Discrepancy)</option>
                  <option value="Approved With Exception">Approved With Exception (Timing Difference)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reviewer Sign-off Note</label>
                <textarea
                  rows={3}
                  value={signOffComment}
                  onChange={(e) => setSignOffComment(e.target.value)}
                  placeholder="Record reconciliation findings..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSignOffModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">
                  Generate SHA-256 Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
