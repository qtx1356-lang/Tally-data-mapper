export type JobStatus =
  | 'Enabled'
  | 'Disabled'
  | 'Running'
  | 'Completed'
  | 'CompletedWithWarnings'
  | 'Failed'
  | 'WaitingForRetry'
  | 'Cancelled'
  | 'CompanyMismatch'
  | 'ConfigurationError'
  | 'Interrupted';

export type ScheduleType =
  | 'Once'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'SpecificDate'
  | 'Interval';

export type MonthlyScheduleType = 'Day1' | 'Day15' | 'LastDay' | 'CustomDay';

export type BackoffStrategy = 'Fixed' | 'Linear' | 'Exponential';

export type ErrorClassification =
  | 'Transient'
  | 'Permanent'
  | 'Configuration'
  | 'Authentication'
  | 'CompanyMismatch'
  | 'Data'
  | 'Filesystem'
  | 'Unknown';

export type AttachmentPolicy = 'NoAttachment' | 'AttachIfSmall' | 'AlwaysAttach';

export type MissedJobPolicy = 'RunOnStartup' | 'Skip';

export interface JobSchedule {
  id?: string;
  type: ScheduleType;
  time: string; // "19:00"
  daysOfWeek?: number[]; // [1, 3, 5] (Mon, Wed, Fri)
  monthlyType?: MonthlyScheduleType;
  monthlyDay?: number;
  specificDate?: string; // "2026-09-07T19:00:00"
  intervalMinutes?: number; // 60
  timeZone: string; // "India Standard Time"
}

export interface RetryPolicy {
  id?: string;
  maxAttempts: number; // default 3
  initialDelaySeconds: number; // default 60
  backoffStrategy: BackoffStrategy;
}

export interface NotificationConfiguration {
  id?: string;
  enableInApp: boolean;
  enableEmail: boolean;
  emailRecipients: string[];
  notifyOnSuccess: boolean;
  notifyOnWarning: boolean;
  notifyOnFailure: boolean;
  attachmentPolicy: AttachmentPolicy;
  maxAttachmentMb: number;
}

export interface AutomationJob {
  id: string;
  name: string;
  description: string;
  mappingId: string;
  mappingName?: string;
  exportProfileId: string;
  exportProfileName?: string;
  companyId: string;
  companyName: string;
  scheduleId?: string;
  schedule: JobSchedule;
  isEnabled: boolean;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  retryPolicyId?: string;
  retryPolicy: RetryPolicy;
  notificationConfigurationId?: string;
  notificationConfiguration: NotificationConfiguration;
  missedJobPolicy: MissedJobPolicy;
  mappingVersion: number;
  exportProfileVersion: number;
  taskSchedulerInstalled?: boolean;
}

export interface JobExecution {
  id: string;
  jobId: string;
  jobName: string;
  companyId: string;
  companyName: string;
  mappingId: string;
  mappingName: string;
  exportProfileId: string;
  exportProfileName: string;
  startedAt: string;
  completedAt: string | null;
  status: JobStatus;
  recordsRead: number;
  recordsWritten: number;
  warnings: number;
  errors: number;
  durationMs: number;
  destinationPath: string;
  errorMessage: string | null;
  errorCategory: ErrorClassification | null;
  attempts: number;
  mappingVersion: number;
  exportProfileVersion: number;
  logs: string[];
}

export interface SystemAutomationStatus {
  schedulerRunning: boolean;
  taskSchedulerInstalled: boolean;
  activeJobsCount: number;
  runningJobsCount: number;
  failedJobsCount: number;
  lastJobStatus: string | null;
  lastJobTime: string | null;
  nextJobName: string | null;
  nextJobTime: string | null;
}
