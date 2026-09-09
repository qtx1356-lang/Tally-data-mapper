/**
 * Phase 32O: Enterprise Automation Engine Types
 */

export type AutomationType = 
  | 'Data Sync'
  | 'Report'
  | 'Export'
  | 'Alert'
  | 'Data Quality'
  | 'System Health'
  | 'License'
  | 'Custom Rule';

export type ScheduleType = 
  | 'One-Time'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Custom Interval';

export type JobState = 
  | 'Scheduled'
  | 'Queued'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Skipped'
  | 'Partial';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertState = 'Triggered' | 'Acknowledged' | 'Resolved' | 'Suppressed';

export interface AutomationDefinition {
  automationId: string;
  name: string;
  description: string;
  workspaceId: string;
  companyScope: string[]; // Company IDs
  type: AutomationType;
  trigger: 'Schedule' | 'Event' | 'Manual';
  schedule: {
    type: ScheduleType;
    intervalMinutes?: number;
    time?: string; // "HH:MM"
    daysOfWeek?: number[]; // [0-6]
    dayOfMonth?: number;
    timezone: string;
  };
  action: {
    channel: 'Email' | 'In-App' | 'Webhook' | 'Export';
    recipients?: string[];
    exportFormat?: 'CSV' | 'Excel' | 'PDF';
    exportDestination?: string;
  };
  conditions?: {
    rules: string[]; // Rule IDs
    logicalOp: 'AND' | 'OR';
  };
  parameters?: Record<string, any>;
  enabled: boolean;
  owner: string; // UserId
  createdAt: string;
  updatedAt: string;
  version: number;
  requiresAppRunning: boolean;
  status: 'Healthy' | 'Warning' | 'Failed' | 'Needs Review';
}

export interface AutomationExecution {
  executionId: string;
  automationId: string;
  startedAt: string;
  finishedAt?: string;
  status: JobState;
  duration?: number; // ms
  recordsProcessed?: number;
  error?: string;
  resultReference?: string;
  correlationId: string;
}

export interface RuleDefinition {
  ruleId: string;
  name: string;
  description: string;
  dataset: string;
  condition: {
    field: string;
    operator: 'Equals' | 'Not Equals' | 'Greater Than' | 'Less Than' | 'Between' | 'Contains' | 'Count' | 'Sum' | 'Average' | 'Percentage' | 'Exists' | 'Missing';
    value: any;
    secondaryValue?: any;
  };
  severity: AlertSeverity;
  action: string; // "Notify", "Email", "Sync"
  enabled: boolean;
  workspaceId: string;
  companyScope: string[];
  evaluationGrain: 'Company' | 'Ledger' | 'Party' | 'Voucher' | 'Stock Item' | 'Employee';
}

export interface AlertRecord {
  alertId: string;
  ruleId: string;
  companyId: string;
  detectedAt: string;
  severity: AlertSeverity;
  status: AlertState;
  evidence: {
    ruleName: string;
    dataset: string;
    field: string;
    observedValue: any;
    expectedCondition: string;
    timestamp: string;
    dataFreshness: string;
  };
  resultReference?: string;
  suppressedBy?: string;
  suppressedWhy?: string;
  suppressedUntil?: string;
}

export interface NotificationDelivery {
  id: string;
  category: 'Invitation' | 'MappingReview' | 'LicenseExpiry' | 'SyncFailure' | 'ReportPublication' | 'SecurityEvent' | 'AlertTriggered';
  recipient: string;
  channel: 'Email' | 'In-App' | 'System';
  status: 'Pending' | 'Sent' | 'Failed' | 'Retrying' | 'Cancelled';
  timestamp: string;
  subject: string;
  body: string;
  failureReason?: string;
}
