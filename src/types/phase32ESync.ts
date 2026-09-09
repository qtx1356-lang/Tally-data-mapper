/**
 * Phase 32E: Reliable Synchronization & Change Detection Engine Types
 * Provides contract for Full Sync, Incremental Sync, Fallback Reconciliation,
 * Watermarks, Checkpoints, Fingerprinting, and Safe Historical Soft-Removal.
 */

export type SyncMode =
  | 'Full'
  | 'Incremental'
  | 'Reconciliation'
  | 'Dataset'
  | 'Company';

export type SyncStatus =
  | 'Queued'
  | 'Running'
  | 'Paused'
  | 'Cancelling'
  | 'Completed'
  | 'Partial'
  | 'Failed'
  | 'Cancelled';

export type ChangeType =
  | 'Added'
  | 'Modified'
  | 'Unchanged'
  | 'Removed'
  | 'Unknown';

export type SyncErrorSeverity = 'Info' | 'Warning' | 'Error' | 'Critical';

export type DatasetFreshnessStatus = 'Fresh' | 'Aging' | 'Stale' | 'Unknown';

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ChangeLog {
  changeId: string;
  jobId: string;
  companyId: string;
  datasetId: string;
  recordId: string;
  sourceId: string;
  changeType: ChangeType;
  detectedAt: string;
  oldFingerprint?: string;
  newFingerprint?: string;
  snapshotId?: string;
  sourceReference?: string;
  fieldChanges?: FieldChange[];
}

export interface SyncWatermark {
  companyId: string;
  datasetId: string;
  boundaryType: 'Date' | 'VoucherNumber' | 'SourceRevision' | 'Timestamp' | 'SourceSnapshot';
  boundaryValue: string;
  schemaVersion: number;
  updatedAt: string;
}

export interface SyncCheckpoint {
  jobId: string;
  datasetId: string;
  batchNumber: number;
  lastProcessedSourceKey: string;
  rowsProcessed: number;
  createdAt: string;
}

export interface SyncError {
  errorId: string;
  jobId: string;
  datasetId?: string;
  companyId: string;
  source: string;
  code: string;
  message: string;
  severity: SyncErrorSeverity;
  retryable: boolean;
  timestamp: string;
}

export interface SyncJob {
  jobId: string;
  companyId: string;
  datasetId?: string; // If single dataset sync
  datasets: string[];
  mode: SyncMode;
  startedAt: string;
  completedAt?: string;
  status: SyncStatus;
  rowsRead: number;
  rowsProcessed: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsUnchanged: number;
  rowsDeleted: number; // Soft removals
  rowsSkipped: number;
  rowsFailed: number;
  errorCount: number;
  currentDataset?: string;
  currentBatch?: number;
  totalBatches?: number;
  estimatedRemainingSeconds?: number;
  schemaVersion: number;
  mappingVersion: string;
  initiatedBy: string;
  snapshotId?: string;
  isReconciliationFallback: boolean;
  pauseRequested?: boolean;
  cancelRequested?: boolean;
  retryCount?: number;
  maxRetries?: number;
  lastCheckpoint?: SyncCheckpoint;
  errors?: SyncError[];
}

export interface DatasetFreshnessInfo {
  datasetId: string;
  datasetName: string;
  companyId: string;
  lastSuccessfulSync?: string;
  lastAttempt?: string;
  freshness: DatasetFreshnessStatus;
  status: string;
  recordCount: number;
  latestSnapshotId?: string;
  schemaVersion: number;
  durationMs?: number;
}

export interface SyncJobOptions {
  companyId: string;
  mode?: SyncMode;
  datasetId?: string;
  datasets?: string[];
  financialYear?: string;
  dateRange?: { from: string; to: string };
  batchSize?: number;
  maxRetries?: number;
  forceReconciliation?: boolean;
  initiatedBy?: string;
}

export interface GraphSyncStatus {
  status: 'Current' | 'Updating' | 'Partial' | 'Stale';
  lastSyncedAt: string;
  version: string;
  nodesCount: number;
  edgesCount: number;
}

export interface ISyncEngine {
  startSync(options: SyncJobOptions): Promise<SyncJob>;
  pauseSync(jobId: string): Promise<boolean>;
  resumeSync(jobId: string): Promise<boolean>;
  cancelSync(jobId: string): Promise<boolean>;
  retrySync(jobId: string): Promise<SyncJob>;
  getJob(jobId: string): SyncJob | null;
  listJobs(companyId?: string): SyncJob[];
  getWatermark(companyId: string, datasetId: string): SyncWatermark | null;
  getFreshness(companyId: string): DatasetFreshnessInfo[];
  getChangeLogs(companyId: string, options?: { jobId?: string; datasetId?: string; changeType?: ChangeType }): ChangeLog[];
  getGraphStatus(companyId: string): GraphSyncStatus;
}
