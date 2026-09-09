/**
 * Phase 32W: Universal Tally Automation & Scheduled Intelligence Engine Types
 */

export type JobType = 
  | 'Data Refresh' 
  | 'Schema Scan' 
  | 'Capability Scan' 
  | 'Semantic Validation' 
  | 'Report Generation' 
  | 'Dashboard Refresh' 
  | 'Business Rule Analysis' 
  | 'Reconciliation' 
  | 'Exception Detection' 
  | 'Data Quality Scan' 
  | 'Compatibility Check' 
  | 'Alert Evaluation' 
  | 'Snapshot Creation';

export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'DISABLED';

export type JobPriority = 'Low' | 'Normal' | 'High' | 'Critical';

export type RetryType = 'No Retry' | 'Fixed Delay' | 'Exponential Backoff';

export interface AutomationJob {
  jobId: string;
  companyId: string;
  workspaceId: string;
  name: string;
  description: string;
  type: JobType;
  status: JobStatus;
  schedule: string; // e.g. cron expression or identifier
  timezone: string;
  priority: JobPriority;
  parameters: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRun: string | null;
  nextRun: string | null;
  version: string;
  retryPolicy: {
    type: RetryType;
    maxRetries: number;
    delayMs: number;
  };
  timeoutMs: number;
  pipelineSteps?: JobType[];
}

export interface JobHistoryRecord {
  executionId: string;
  jobId: string;
  correlationId: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  status: JobStatus;
  error: { code: string; message: string; step: string; retryable: boolean } | null;
  output: Record<string, any>;
  attempt: number;
  mappingVersion: string;
  schemaVersion: string;
}

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertRule {
  alertId: string;
  name: string;
  condition: string;
  severity: AlertSeverity;
  channels: ('IN_APP' | 'EMAIL' | 'DESKTOP' | 'WEBHOOK')[];
  cooldownMs: number;
  enabled: boolean;
  scope: string;
  version: string;
}

export type NotificationState = 'NEW' | 'READ' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface AppNotification {
  notificationId: string;
  alertId: string;
  companyId: string;
  severity: AlertSeverity;
  state: NotificationState;
  title: string;
  message: string;
  evidence: Record<string, any>;
  timestamp: string;
}

export interface CompanyHealthCard {
  companyId: string;
  connectionStatus: 'Connected' | 'Disconnected' | 'Unavailable' | 'Auth Failure';
  lastSuccessfulConnection: string;
  dataFreshnessStatus: 'FRESH' | 'STALE' | 'UNKNOWN';
  lastRefresh: string;
  schemaStatus: 'VALID' | 'CHANGED' | 'BROKEN';
  mappingStatus: 'VALID' | 'CONFLICT' | 'BROKEN';
  activeExceptions: number;
  criticalExceptions: number;
}

export interface SystemMonitorStats {
  activeJobs: number;
  failedJobs24h: number;
  successRate: number;
  pendingAlerts: number;
  companies: CompanyHealthCard[];
}
