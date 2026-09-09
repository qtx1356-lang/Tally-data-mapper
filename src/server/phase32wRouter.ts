import { Router } from 'express';
import { 
  AutomationJob, 
  JobHistoryRecord, 
  SystemMonitorStats, 
  AppNotification,
  AlertRule
} from '../types/phase32WAutomation';

export const phase32wRouter = Router();

const mockJobs: AutomationJob[] = [
  {
    jobId: 'job_001',
    companyId: 'comp_exfin_corp_id',
    workspaceId: 'ws_main',
    name: 'Nightly Sync & Analysis',
    description: 'Pulls the latest data from Tally, updates schema, and runs intelligence rules.',
    type: 'Data Refresh',
    status: 'ACTIVE',
    schedule: '0 2 * * *',
    timezone: 'Asia/Kolkata',
    priority: 'High',
    parameters: { fullSync: false },
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    lastRun: new Date(Date.now() - 3600000 * 4).toISOString(),
    nextRun: new Date(Date.now() + 3600000 * 20).toISOString(),
    version: '1.2.0',
    retryPolicy: { type: 'Exponential Backoff', maxRetries: 3, delayMs: 5000 },
    timeoutMs: 3600000,
    pipelineSteps: ['Data Refresh', 'Schema Scan', 'Semantic Validation', 'Business Rule Analysis', 'Exception Detection', 'Alert Evaluation']
  },
  {
    jobId: 'job_002',
    companyId: 'comp_exfin_corp_id',
    workspaceId: 'ws_main',
    name: 'Hourly Exception Scan',
    description: 'Runs critical business rules on available data hourly.',
    type: 'Business Rule Analysis',
    status: 'PAUSED',
    schedule: '0 * * * *',
    timezone: 'Asia/Kolkata',
    priority: 'Normal',
    parameters: { ruleCategories: ['Accounting', 'Inventory'] },
    createdBy: 'analyst',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: null,
    version: '1.0.0',
    retryPolicy: { type: 'No Retry', maxRetries: 0, delayMs: 0 },
    timeoutMs: 600000
  }
];

const mockHistory: JobHistoryRecord[] = [
  {
    executionId: 'exec_991',
    jobId: 'job_001',
    correlationId: 'corr_817293',
    startTime: new Date(Date.now() - 3600000 * 4 - 300000).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    durationMs: 300000,
    status: 'COMPLETED',
    error: null,
    output: { recordsSynced: 1450, exceptionsFound: 2 },
    attempt: 1,
    mappingVersion: '2.1.0',
    schemaVersion: '1.5.0'
  },
  {
    executionId: 'exec_990',
    jobId: 'job_002',
    correlationId: 'corr_817292',
    startTime: new Date(Date.now() - 3600000 - 15000).toISOString(),
    endTime: new Date(Date.now() - 3600000).toISOString(),
    durationMs: 15000,
    status: 'FAILED',
    error: { code: 'ERR_TALLY_OFFLINE', message: 'Tally connection refused.', step: 'Data Extraction', retryable: true },
    output: {},
    attempt: 1,
    mappingVersion: '2.1.0',
    schemaVersion: '1.5.0'
  }
];

const mockAlertRules: AlertRule[] = [
  {
    alertId: 'ar_001',
    name: 'Critical Exception Notification',
    condition: 'severity == "CRITICAL"',
    severity: 'CRITICAL',
    channels: ['IN_APP', 'EMAIL'],
    cooldownMs: 3600000,
    enabled: true,
    scope: 'GLOBAL',
    version: '1.0'
  }
];

const mockNotifications: AppNotification[] = [
  {
    notificationId: 'notif_001',
    alertId: 'ar_001',
    companyId: 'comp_exfin_corp_id',
    severity: 'CRITICAL',
    state: 'NEW',
    title: 'Unbalanced Voucher Detected',
    message: 'Rule r_unbal_vch triggered for voucher JRN-1042.',
    evidence: { voucherNumber: 'JRN-1042', diff: 100 },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const mockStats: SystemMonitorStats = {
  activeJobs: 1,
  failedJobs24h: 3,
  successRate: 98.5,
  pendingAlerts: 1,
  companies: [
    {
      companyId: 'comp_exfin_corp_id',
      connectionStatus: 'Connected',
      lastSuccessfulConnection: new Date(Date.now() - 60000).toISOString(),
      dataFreshnessStatus: 'FRESH',
      lastRefresh: new Date(Date.now() - 3600000 * 4).toISOString(),
      schemaStatus: 'VALID',
      mappingStatus: 'VALID',
      activeExceptions: 5,
      criticalExceptions: 1
    }
  ]
};

// Routes
phase32wRouter.get('/api/v1/automation/jobs', (req, res) => {
  res.json(mockJobs);
});

phase32wRouter.get('/api/v1/automation/history', (req, res) => {
  res.json(mockHistory);
});

phase32wRouter.get('/api/v1/automation/alerts', (req, res) => {
  res.json(mockAlertRules);
});

phase32wRouter.get('/api/v1/automation/notifications', (req, res) => {
  res.json(mockNotifications);
});

phase32wRouter.get('/api/v1/automation/monitor', (req, res) => {
  res.json(mockStats);
});
