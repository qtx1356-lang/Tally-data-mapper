export type AutomationStatus = 'Draft' | 'Active' | 'Paused' | 'Disabled' | 'Failed' | 'Archived';

export type TriggerType =
  | 'Scheduled'
  | 'DataRefreshCompleted'
  | 'Threshold'
  | 'ChangeDetected'
  | 'ReportGenerated'
  | 'Manual'
  | 'ApplicationEvent';

export type ScheduleFrequency = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export type StaleDataPolicy = 'SendAnyway' | 'Warn' | 'Skip' | 'RequireApproval';

export type DeliveryChannel = 'Email' | 'DesktopNotification' | 'InAppNotification' | 'FileExport' | 'Webhook';

export type AlertSeverity = 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertLifecycleStatus = 'Triggered' | 'Acknowledged' | 'Investigating' | 'Resolved' | 'Closed';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'Cancelled';

export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export type RuleOperator =
  | 'Equals'
  | 'NotEquals'
  | 'GreaterThan'
  | 'GreaterThanOrEqual'
  | 'LessThan'
  | 'LessThanOrEqual'
  | 'In'
  | 'NotIn'
  | 'Contains'
  | 'Between';

export type RuleCombinator = 'And' | 'Or' | 'Not';

export type HolidayHandlingPolicy = 'Run' | 'Skip' | 'NextBusinessDay';

export interface ScheduleConfig {
  frequency: ScheduleFrequency;
  cronExpression: string;
  timezone: string;
  runTime: string; // "18:00:00"
  runDays: string[]; // ["Monday", "Tuesday", ...]
  dayOfMonth: number;
  holidayPolicy: HolidayHandlingPolicy;
  respectQuietHours: boolean;
  quietHoursStart: string; // "22:00:00"
  quietHoursEnd: string; // "07:00:00"
  criticalOverrideQuietHours: boolean;
}

export interface RuleCondition {
  conditionId: string;
  dataset: string;
  metric: string;
  operator: RuleOperator;
  thresholdValue: number | string;
  secondaryThresholdValue?: number | string;
  unit: string;
  period: string;
  comparisonPeriod?: string;
  isPercentageChange?: boolean;
  percentageThreshold?: number;
}

export interface RuleGroup {
  combinator: RuleCombinator;
  conditions: RuleCondition[];
  subGroups: RuleGroup[];
}

export interface RecipientConfig {
  recipientId: string;
  name: string;
  email: string;
  role: string;
  channel: DeliveryChannel;
  isGroupOrRole: boolean;
}

export interface ActionConfig {
  actionType: string; // 'GenerateAndEmailReport' | 'TriggerAlert' | 'ExportFile'
  reportId: string;
  reportName: string;
  exportFormat: 'PDF' | 'XLSX' | 'CSV';
  includeAiExecutiveSummary: boolean;
  requireWatermark: boolean;
  watermarkText: string;
  classification: DataClassification;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  recipients: RecipientConfig[];
}

export interface ApprovalConfig {
  requiresApproval: boolean;
  segregationOfDuties: boolean;
  requiredApproverRole: string;
  designatedApprovers: string[];
  expirationHours: number;
  isSequentialMultiLevel: boolean;
  multiLevelRoles: string[];
}

export interface AutomationDefinition {
  automationId: string;
  name: string;
  description: string;
  companyId: string;
  companyName: string;
  trigger: TriggerType;
  schedule: ScheduleConfig;
  conditionGroup: RuleGroup;
  action: ActionConfig;
  approval: ApprovalConfig;
  stalePolicy: StaleDataPolicy;
  status: AutomationStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  maxTriggersPerDay: number;
  deduplicationKeyTemplate: string;
}

export interface AutomationSnapshotMetadata {
  companyId: string;
  period: string;
  datasetVersion: string;
  reportVersion: string;
  mappingVersion: string;
  calculationVersion: string;
  generatedAt: string;
}

export interface AutomationExecutionRecord {
  executionId: string;
  automationId: string;
  automationName: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  triggerType: TriggerType;
  triggerReason: string;
  status: string; // 'Success' | 'Failed' | 'Blocked' | 'Skipped' | 'PendingApproval' | 'Success (Simulation)'
  recordsEvaluated: number;
  conditionMatched: boolean;
  conditionSummary: string;
  notificationsSent: number;
  errorCategory?: string;
  errorMessage?: string;
  canRetry: boolean;
  snapshot: AutomationSnapshotMetadata;
  deliveryLog: string[];
  lineageTrace: string;
}

export interface ApprovalRequestRecord {
  approvalId: string;
  automationId: string;
  automationName: string;
  companyId: string;
  requestedBy: string;
  requestedAt: string;
  approverRole: string;
  assignedApprover?: string;
  status: ApprovalStatus;
  decision?: string;
  decisionAt?: string;
  comments: string;
  reportSummary: string;
  recipientsSummary: string;
  potentialImpact: string;
  expiresAt: string;
}

export interface AlertRecord {
  alertId: string;
  ruleId: string;
  ruleName: string;
  companyId: string;
  severity: AlertSeverity;
  lifecycleStatus: AlertLifecycleStatus;
  title: string;
  message: string;
  metricName: string;
  actualValue: number;
  thresholdValue: number;
  unit: string;
  period: string;
  deduplicationKey: string;
  escalationLevel: number;
  assignedTo: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  mutedUntil?: string;
  resolutionComment?: string;
  isMuted?: boolean;
}

export interface InAppNotificationRecord {
  notificationId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface KpiTargetModel {
  kpiId: string;
  name: string;
  metric: string;
  dataset: string;
  period: string;
  targetValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  currentValue: number;
  previousValue: number;
  status: 'On Target' | 'Warning' | 'Critical' | 'Unavailable';
  variancePercentage: number;
}

export interface BusinessMonitoringDashboardData {
  activeAutomationsCount: number;
  successfulRunsCount: number;
  failedRunsCount: number;
  pendingApprovalsCount: number;
  activeAlertsCount: number;
  scheduledReportsCount: number;
  lastExecutionTime: string;
  isTallyConnected: boolean;
  lastTallySync: string;
  syncErrorsCount: number;
  parityErrorsCount: number;
  kpis: KpiTargetModel[];
  recentAlerts: AlertRecord[];
  recentExecutions: AutomationExecutionRecord[];
}
