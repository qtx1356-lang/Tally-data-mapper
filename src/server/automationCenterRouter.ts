import { Router } from "express";
import {
  AutomationDefinition,
  AutomationExecutionRecord,
  AlertRecord,
  ApprovalRequestRecord,
  InAppNotificationRecord,
  KpiTargetModel,
  BusinessMonitoringDashboardData,
  RuleGroup,
  AutomationStatus,
  TriggerType,
  DataClassification,
  AlertSeverity,
  AlertLifecycleStatus,
  ApprovalStatus
} from "../types/phase20Automation";

export const automationCenterRouter = Router();

// ----------------------------------------------------------------------------
// In-Memory Storage & Company Context
// ----------------------------------------------------------------------------
const companyId = "COMP_EXFIN_01";
const companyName = "EXFIN GLOBAL ENTERPRISES PVT LTD";

let automationsStore: AutomationDefinition[] = [
  {
    automationId: "AUTO_SALES_EVENING_01",
    name: "Daily Sales Digest & Revenue Summary",
    description: "Dispatches verified end-of-day sales totals, top customers, and GST liabilities to the finance leadership.",
    companyId: companyId,
    companyName: companyName,
    trigger: "Scheduled",
    schedule: {
      frequency: "Daily",
      cronExpression: "0 18 * * 1-5",
      timezone: "Asia/Kolkata",
      runTime: "18:00:00",
      runDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      dayOfMonth: 1,
      holidayPolicy: "NextBusinessDay",
      respectQuietHours: true,
      quietHoursStart: "22:00:00",
      quietHoursEnd: "07:00:00",
      criticalOverrideQuietHours: true
    },
    conditionGroup: {
      combinator: "And",
      conditions: [],
      subGroups: []
    },
    action: {
      actionType: "GenerateAndEmailReport",
      reportId: "RPT_DAILY_SALES_SUMMARY",
      reportName: "Daily Sales Summary & Top Debtors",
      exportFormat: "PDF",
      includeAiExecutiveSummary: true,
      requireWatermark: true,
      watermarkText: "EXFIN CONFIDENTIAL - INTERNAL USE ONLY",
      classification: "Confidential",
      emailSubjectTemplate: "[EXFIN Digest] {{report}} - {{company}} ({{period}})",
      emailBodyTemplate: "Attached is the automated {{report}} for {{company}} for {{period}}. Key metric {{metric}}: {{value}} (Change: {{change}}).",
      recipients: [
        {
          recipientId: "rec-1",
          name: "Arun Sharma",
          email: "arun.sharma@exfin.internal",
          role: "FinanceDirector",
          channel: "Email",
          isGroupOrRole: false
        },
        {
          recipientId: "rec-2",
          name: "Finance Ops Group",
          email: "finance-ops@exfin.internal",
          role: "FinanceOps",
          channel: "Email",
          isGroupOrRole: true
        }
      ]
    },
    approval: {
      requiresApproval: false,
      segregationOfDuties: true,
      requiredApproverRole: "FinancialController",
      designatedApprovers: [],
      expirationHours: 24,
      isSequentialMultiLevel: false,
      multiLevelRoles: []
    },
    stalePolicy: "Warn",
    status: "Active",
    owner: "sysadmin@exfin.internal",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    version: 1,
    maxTriggersPerDay: 10,
    deduplicationKeyTemplate: "{{automationId}}_{{period}}"
  },
  {
    automationId: "AUTO_RECEIVABLES_ALERT_02",
    name: "Overdue Receivables > 60 Days Anomaly Alert",
    description: "Monitors outstanding debtor balances exceeding ₹5,00,000 in the >60 days bucket and alerts the credit controller.",
    companyId: companyId,
    companyName: companyName,
    trigger: "Threshold",
    schedule: {
      frequency: "Hourly",
      cronExpression: "0 * * * *",
      timezone: "Asia/Kolkata",
      runTime: "00:00:00",
      runDays: [],
      dayOfMonth: 1,
      holidayPolicy: "Run",
      respectQuietHours: false,
      quietHoursStart: "22:00:00",
      quietHoursEnd: "07:00:00",
      criticalOverrideQuietHours: true
    },
    conditionGroup: {
      combinator: "And",
      conditions: [
        {
          conditionId: "cond-rec-1",
          dataset: "OutstandingReceivables",
          metric: "OverdueAmount60Days",
          operator: "GreaterThan",
          thresholdValue: 500000.0,
          unit: "INR",
          period: "CurrentMonth"
        }
      ],
      subGroups: []
    },
    action: {
      actionType: "TriggerAlert",
      reportId: "RPT_RECEIVABLES_AGEING",
      reportName: "Receivables Ageing Breakdown",
      exportFormat: "PDF",
      includeAiExecutiveSummary: false,
      requireWatermark: true,
      watermarkText: "RESTRICTED - CREDIT CONTROL",
      classification: "Restricted",
      emailSubjectTemplate: "[CRITICAL ALERT] High Overdue Receivables in {{company}}",
      emailBodyTemplate: "Attention: Outstanding overdue receivables >60 days has reached {{value}}, crossing the configured threshold of ₹5,00,000.",
      recipients: [
        {
          recipientId: "rec-credit",
          name: "Credit Control Desk",
          email: "credit.control@exfin.internal",
          role: "CreditManager",
          channel: "Email",
          isGroupOrRole: false
        }
      ]
    },
    approval: {
      requiresApproval: true,
      segregationOfDuties: true,
      requiredApproverRole: "FinancialController",
      designatedApprovers: ["controller@exfin.internal"],
      expirationHours: 24,
      isSequentialMultiLevel: false,
      multiLevelRoles: []
    },
    stalePolicy: "RequireApproval",
    status: "Active",
    owner: "credit.lead@exfin.internal",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    version: 2,
    maxTriggersPerDay: 5,
    deduplicationKeyTemplate: "{{automationId}}_{{period}}"
  }
];

let alertsStore: AlertRecord[] = [
  {
    alertId: "ALT_REC_60D_991",
    ruleId: "AUTO_RECEIVABLES_ALERT_02",
    ruleName: "Overdue Receivables > 60 Days",
    companyId: companyId,
    severity: "High",
    lifecycleStatus: "Triggered",
    title: "High Overdue Receivables Alert",
    message: "Zenith Electronics and Quantum Infotech have outstanding balances crossing ₹6,42,000 (Threshold: ₹5,00,000).",
    metricName: "OverdueAmount60Days",
    actualValue: 642000.0,
    thresholdValue: 500000.0,
    unit: "INR",
    period: "August 2026",
    deduplicationKey: "AUTO_RECEIVABLES_ALERT_02_2026-08",
    escalationLevel: 1,
    assignedTo: "Finance Team",
    triggeredAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    isMuted: false
  }
];

let approvalsStore: ApprovalRequestRecord[] = [
  {
    approvalId: "APP_REQ_7701",
    automationId: "AUTO_RECEIVABLES_ALERT_02",
    automationName: "Overdue Receivables > 60 Days Anomaly Alert",
    companyId: companyId,
    requestedBy: "system.scheduler@exfin.internal",
    requestedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    approverRole: "FinancialController",
    status: "Pending",
    comments: "Automatic dispatch trigger requested for restricted customer exposure report.",
    reportSummary: "Restricted Customer Debtors Ageing Schedule (PDF)",
    recipientsSummary: "Credit Control Desk (1 recipient)",
    potentialImpact: "Dispatches restricted debtor exposure records to external audit controller.",
    expiresAt: new Date(Date.now() + 22 * 3600000).toISOString()
  }
];

let notificationsStore: InAppNotificationRecord[] = [
  {
    notificationId: "NOTIF_SYNC_OK_101",
    title: "Scheduled Tally Sync Completed",
    message: "Local analytical data engine successfully ingested 2,410 vouchers from TallyPrime at 17:45.",
    severity: "Info",
    source: "DataEngineSync",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    isRead: false
  },
  {
    notificationId: "NOTIF_RPT_GEN_102",
    title: "Daily Sales Summary Generated",
    message: "Scheduled evening sales digest generated successfully and queued for dispatch.",
    severity: "Low",
    source: "AutomationEngine",
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    isRead: true,
    readAt: new Date(Date.now() - 110 * 60000).toISOString()
  }
];

let kpisStore: KpiTargetModel[] = [
  {
    kpiId: "KPI_MONTHLY_SALES",
    name: "Monthly Sales Volume",
    metric: "TotalSales",
    dataset: "SalesRegister",
    period: "August 2026",
    targetValue: 3000000.0,
    warningThreshold: 2500000.0,
    criticalThreshold: 2000000.0,
    currentValue: 3245000.0,
    previousValue: 2780000.0,
    status: "On Target",
    variancePercentage: 16.7
  },
  {
    kpiId: "KPI_GROSS_MARGIN",
    name: "Gross Margin %",
    metric: "GrossMarginPercentage",
    dataset: "PnLSummary",
    period: "August 2026",
    targetValue: 22.0,
    warningThreshold: 18.0,
    criticalThreshold: 15.0,
    currentValue: 19.8,
    previousValue: 21.4,
    status: "Warning",
    variancePercentage: -7.5
  },
  {
    kpiId: "KPI_OVERDUE_DEBTORS",
    name: "Overdue Receivables (>60d)",
    metric: "OverdueAmount60Days",
    dataset: "OutstandingReceivables",
    period: "August 2026",
    targetValue: 350000.0,
    warningThreshold: 500000.0,
    criticalThreshold: 700000.0,
    currentValue: 642000.0,
    previousValue: 590000.0,
    status: "Critical",
    variancePercentage: 8.8
  }
];

let executionHistoryStore: AutomationExecutionRecord[] = [
  {
    executionId: "EXEC_PREV_9912",
    automationId: "AUTO_SALES_EVENING_01",
    automationName: "Daily Sales Digest & Revenue Summary",
    startedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 3600000 + 420).toISOString(),
    durationMs: 42.1,
    triggerType: "Scheduled",
    triggerReason: "Scheduled Daily Cron at 18:00 IST",
    status: "Success",
    recordsEvaluated: 248,
    conditionMatched: true,
    conditionSummary: "Dataset healthy; analytical cache up-to-date.",
    notificationsSent: 2,
    canRetry: false,
    snapshot: {
      companyId: companyId,
      period: "August 2026",
      datasetVersion: "v2.4.0-parquet",
      reportVersion: "v1.2.0",
      mappingVersion: "v3.1.0",
      calculationVersion: "v1.0.0-deterministic",
      generatedAt: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    deliveryLog: [
      "Dataset freshness verified: LIVE (Age: 4m)",
      "Rendered PDF report 'Daily Sales Summary & Top Debtors' with watermark",
      "Dispatched email to 2 recipients via secure SMTP relay",
      "Audit event recorded with execution ID EXEC_PREV_9912"
    ],
    lineageTrace: "Tally [READ-ONLY] -> Parquet Analytical Store -> Deterministic Math Engine -> PDF Exporter -> Email Provider"
  }
];

// ----------------------------------------------------------------------------
// Endpoints
// ----------------------------------------------------------------------------

// 1. Dashboard Overview
automationCenterRouter.get("/dashboard", (req, res) => {
  const activeCount = automationsStore.filter((a) => a.status === "Active").length;
  const pendingApprovals = approvalsStore.filter((a) => a.status === "Pending").length;
  const activeAlerts = alertsStore.filter(
    (a) => a.lifecycleStatus === "Triggered" || a.lifecycleStatus === "Investigating"
  ).length;

  const data: BusinessMonitoringDashboardData = {
    activeAutomationsCount: activeCount,
    successfulRunsCount: executionHistoryStore.filter((e) => e.status === "Success").length + 48,
    failedRunsCount: executionHistoryStore.filter((e) => e.status === "Failed").length,
    pendingApprovalsCount: pendingApprovals,
    activeAlertsCount: activeAlerts,
    scheduledReportsCount: automationsStore.filter(
      (a) => a.trigger === "Scheduled" && a.action.actionType === "GenerateAndEmailReport"
    ).length,
    lastExecutionTime: executionHistoryStore[0]?.startedAt || new Date().toISOString(),
    isTallyConnected: true,
    lastTallySync: new Date(Date.now() - 8 * 60000).toISOString(),
    syncErrorsCount: 0,
    parityErrorsCount: 0,
    kpis: kpisStore,
    recentAlerts: alertsStore.slice(0, 5),
    recentExecutions: executionHistoryStore.slice(0, 5)
  };

  res.json(data);
});

// 2. Automations List
automationCenterRouter.get("/list", (req, res) => {
  res.json(automationsStore);
});

// 3. Get Single Automation
automationCenterRouter.get("/:id", (req, res) => {
  const item = automationsStore.find((a) => a.automationId === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Automation not found" });
  }
  res.json(item);
});

// 4. Save Automation (Create or Update)
automationCenterRouter.post("/save", (req, res) => {
  const body = req.body as AutomationDefinition;
  if (!body.name) {
    return res.status(400).json({ error: "Automation name is required." });
  }

  const existingIndex = automationsStore.findIndex((a) => a.automationId === body.automationId);
  if (existingIndex >= 0) {
    const updated: AutomationDefinition = {
      ...body,
      updatedAt: new Date().toISOString(),
      version: (automationsStore[existingIndex].version || 1) + 1
    };
    automationsStore[existingIndex] = updated;
    return res.json(updated);
  } else {
    const created: AutomationDefinition = {
      ...body,
      automationId: body.automationId || `AUTO_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    automationsStore.unshift(created);
    return res.json(created);
  }
});

// 5. Delete Automation
automationCenterRouter.delete("/:id", (req, res) => {
  automationsStore = automationsStore.filter((a) => a.automationId !== req.params.id);
  res.json({ success: true });
});

// 6. Execute Dry Run (Simulation)
automationCenterRouter.post("/:id/dry-run", (req, res) => {
  const auto = automationsStore.find((a) => a.automationId === req.params.id);
  if (!auto) {
    return res.status(404).json({ error: "Automation not found" });
  }

  const dryRunRecord: AutomationExecutionRecord = {
    executionId: `DRY_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    automationId: auto.automationId,
    automationName: auto.name,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 26.4,
    triggerType: "Manual",
    triggerReason: "Simulated Dry Run Execution",
    status: "Success (Simulation)",
    recordsEvaluated: 184,
    conditionMatched: true,
    conditionSummary: "Evaluated conditions against current analytical dataset. Match confirmed.",
    notificationsSent: 0, // Dry run does not dispatch
    canRetry: false,
    snapshot: {
      companyId: auto.companyId,
      period: "Current Fiscal Period",
      datasetVersion: "v2.4.0-parquet",
      reportVersion: "v1.2.0",
      mappingVersion: "v3.1.0",
      calculationVersion: "v1.0.0-deterministic",
      generatedAt: new Date().toISOString()
    },
    deliveryLog: [
      "[DRY RUN] Ingested read-only dataset from Tally analytical cache: Valid & Current",
      `[DRY RUN] Checked RBAC authorizations for owner '${auto.owner}': Authorized`,
      `[DRY RUN] Evaluated rule conditions: Passed`,
      `[DRY RUN] Prepared ${auto.action.exportFormat} report with classification '${auto.action.classification}'`,
      `[DRY RUN] Would deliver to ${auto.action.recipients.length} recipients (Simulated - No email transmitted)`
    ],
    lineageTrace: `Tally [READ-ONLY] -> Parquet Analytical Store -> Rule Engine -> ${auto.action.exportFormat} Generator -> Delivery Relay`
  };

  res.json(dryRunRecord);
});

// 7. Live Execute Automation
automationCenterRouter.post("/:id/execute", (req, res) => {
  const auto = automationsStore.find((a) => a.automationId === req.params.id);
  if (!auto) {
    return res.status(404).json({ error: "Automation not found" });
  }

  const record: AutomationExecutionRecord = {
    executionId: `EXEC_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    automationId: auto.automationId,
    automationName: auto.name,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 44.8,
    triggerType: "Manual",
    triggerReason: "Manual execution triggered from Automation Center",
    status: "Success",
    recordsEvaluated: 248,
    conditionMatched: true,
    conditionSummary: "Evaluated against local analytical columnar store.",
    notificationsSent: auto.action.recipients.length,
    canRetry: false,
    snapshot: {
      companyId: auto.companyId,
      period: "August 2026",
      datasetVersion: "v2.4.0-parquet",
      reportVersion: "v1.2.0",
      mappingVersion: "v3.1.0",
      calculationVersion: "v1.0.0-deterministic",
      generatedAt: new Date().toISOString()
    },
    deliveryLog: [
      `Ingested read-only dataset from Tally analytical cache for '${auto.companyName}'`,
      `Rendered ${auto.action.exportFormat} payload with classification '${auto.action.classification}'`,
      `Dispatched report to ${auto.action.recipients.length} recipients with watermark: '${auto.action.watermarkText}'`,
      `Recorded audit trail entry in system log`
    ],
    lineageTrace: `Tally [READ-ONLY] -> Parquet Analytical Store -> Rule Engine -> Report Exporter -> Email Provider`
  };

  executionHistoryStore.unshift(record);
  res.json(record);
});

// 8. Execution History
automationCenterRouter.get("/history/list", (req, res) => {
  res.json(executionHistoryStore);
});

// 9. Alerts List
automationCenterRouter.get("/alerts/list", (req, res) => {
  res.json(alertsStore);
});

// 10. Acknowledge Alert
automationCenterRouter.post("/alerts/:id/ack", (req, res) => {
  const alert = alertsStore.find((a) => a.alertId === req.params.id);
  if (alert) {
    alert.lifecycleStatus = "Acknowledged";
    alert.acknowledgedAt = new Date().toISOString();
  }
  res.json({ success: true, alert });
});

// 11. Resolve Alert
automationCenterRouter.post("/alerts/:id/resolve", (req, res) => {
  const alert = alertsStore.find((a) => a.alertId === req.params.id);
  if (alert) {
    alert.lifecycleStatus = "Resolved";
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionComment = req.body.comment || "Resolved by user in Automation Center";
  }
  res.json({ success: true, alert });
});

// 12. Snooze Alert
automationCenterRouter.post("/alerts/:id/snooze", (req, res) => {
  const alert = alertsStore.find((a) => a.alertId === req.params.id);
  const hours = req.body.hours || 4;
  if (alert) {
    alert.mutedUntil = new Date(Date.now() + hours * 3600000).toISOString();
    alert.isMuted = true;
  }
  res.json({ success: true, alert });
});

// 13. Approvals List
automationCenterRouter.get("/approvals/list", (req, res) => {
  res.json(approvalsStore);
});

// 14. Approve / Reject Request
automationCenterRouter.post("/approvals/:id/decide", (req, res) => {
  const { decision, approverUser, comments } = req.body;
  const item = approvalsStore.find((a) => a.approvalId === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Approval request not found" });
  }

  // Segregation of duties check
  if (item.requestedBy && approverUser && item.requestedBy.toLowerCase() === approverUser.toLowerCase()) {
    return res.status(400).json({
      error: "Segregation of duties violation: The request creator cannot approve their own request."
    });
  }

  item.status = decision === "Approve" ? "Approved" : "Rejected";
  item.decision = decision;
  item.decisionAt = new Date().toISOString();
  item.comments = comments || "";

  res.json({ success: true, item });
});

// 15. In-App Notifications List
automationCenterRouter.get("/notifications/list", (req, res) => {
  res.json(notificationsStore);
});

// 16. Mark Notification as Read
automationCenterRouter.post("/notifications/:id/read", (req, res) => {
  const notif = notificationsStore.find((n) => n.notificationId === req.params.id);
  if (notif) {
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
  }
  res.json({ success: true, notif });
});

// 17. Copilot Draft Automation Creation
automationCenterRouter.post("/copilot-draft", (req, res) => {
  const { prompt, user } = req.body;
  const lower = (prompt || "").toLowerCase();

  let name = "Scheduled Sales Summary Automation";
  let reportId = "RPT_DAILY_SALES";
  let reportName = "Daily Sales Digest";
  let trigger: TriggerType = "Scheduled";

  if (lower.includes("alert") || lower.includes("fall") || lower.includes("drop") || lower.includes("receivable") || lower.includes("overdue")) {
    name = "Receivables & Outlier Alert Rule";
    reportId = "RPT_RECEIVABLES_AGEING";
    reportName = "Receivables Ageing Analysis";
    trigger = "Threshold";
  }

  const draft: AutomationDefinition = {
    automationId: `DRAFT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    name: name,
    description: `Draft created from Copilot request: "${prompt}"`,
    companyId: companyId,
    companyName: companyName,
    trigger: trigger,
    schedule: {
      frequency: "Daily",
      cronExpression: "0 18 * * 1-5",
      timezone: "Asia/Kolkata",
      runTime: "18:00:00",
      runDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      dayOfMonth: 1,
      holidayPolicy: "NextBusinessDay",
      respectQuietHours: true,
      quietHoursStart: "22:00:00",
      quietHoursEnd: "07:00:00",
      criticalOverrideQuietHours: true
    },
    conditionGroup: {
      combinator: "And",
      conditions: trigger === "Threshold" ? [
        {
          conditionId: `cond-${Date.now()}`,
          dataset: "OutstandingReceivables",
          metric: "OverdueAmount60Days",
          operator: "GreaterThan",
          thresholdValue: 500000,
          unit: "INR",
          period: "CurrentMonth"
        }
      ] : [],
      subGroups: []
    },
    action: {
      actionType: "GenerateAndEmailReport",
      reportId: reportId,
      reportName: reportName,
      exportFormat: "PDF",
      includeAiExecutiveSummary: true,
      requireWatermark: true,
      watermarkText: "EXFIN CONFIDENTIAL",
      classification: "Confidential",
      emailSubjectTemplate: "[EXFIN Alert] {{report}} - {{company}} ({{period}})",
      emailBodyTemplate: "Attached is the automated {{report}} for {{company}} for {{period}}.",
      recipients: [
        {
          recipientId: `rec-${Date.now()}`,
          name: "Finance Manager",
          email: user || "finance@exfin.internal",
          role: "FinanceManager",
          channel: "Email",
          isGroupOrRole: false
        }
      ]
    },
    approval: {
      requiresApproval: false,
      segregationOfDuties: true,
      requiredApproverRole: "FinancialController",
      designatedApprovers: [],
      expirationHours: 24,
      isSequentialMultiLevel: false,
      multiLevelRoles: []
    },
    stalePolicy: "Warn",
    status: "Draft", // Strict requirement: NEVER auto-activated
    owner: user || "copilot.user@exfin.internal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    maxTriggersPerDay: 10,
    deduplicationKeyTemplate: "{{automationId}}_{{period}}"
  };

  automationsStore.unshift(draft);
  res.json(draft);
});

// 18. Test Rule Preview
automationCenterRouter.post("/test-rule", (req, res) => {
  const group = req.body.conditionGroup as RuleGroup;
  if (!group || !group.conditions || group.conditions.length === 0) {
    return res.json({
      wouldTrigger: true,
      message: "Always Triggers (No conditions specified).",
      evaluatedMetric: "N/A",
      currentValue: "N/A"
    });
  }

  // Evaluate against sample state
  const cond = group.conditions[0];
  let currentValue = 642000.0;
  if (cond.metric === "TotalSalesAmount") currentValue = 3245000.0;
  if (cond.metric === "GrossMarginPercentage") currentValue = 19.8;

  const threshold = typeof cond.thresholdValue === "number" ? cond.thresholdValue : parseFloat(cond.thresholdValue as string) || 0;
  let wouldTrigger = false;

  if (cond.operator === "GreaterThan") wouldTrigger = currentValue > threshold;
  else if (cond.operator === "LessThan") wouldTrigger = currentValue < threshold;
  else if (cond.operator === "Equals") wouldTrigger = Math.abs(currentValue - threshold) < 0.01;
  else wouldTrigger = true;

  res.json({
    wouldTrigger,
    message: wouldTrigger
      ? `Condition MATCHED: Metric '${cond.metric}' is ₹${currentValue.toLocaleString('en-IN')}, which is ${cond.operator} threshold ₹${threshold.toLocaleString('en-IN')}.`
      : `Condition DID NOT MATCH: Metric '${cond.metric}' is ₹${currentValue.toLocaleString('en-IN')}, not meeting ${cond.operator} threshold ₹${threshold.toLocaleString('en-IN')}.`,
    evaluatedMetric: cond.metric,
    currentValue: currentValue,
    thresholdValue: threshold
  });
});
