/**
 * Phase 32H - Operational Safety Layer Types
 * Lineage, Snapshots, Backup & Restore, Storage Management, Audit Engine, Security Hardening, Disaster Recovery
 */

// ============================================================================
// 1. LINEAGE TYPES
// ============================================================================

export type LineageNodeType = 
  | 'COMPANY'
  | 'SOURCE_SYSTEM'
  | 'SOURCE_DATASET'
  | 'SOURCE_RECORD'
  | 'EXTRACTION_JOB'
  | 'NORMALIZATION_RULE'
  | 'TRANSFORMATION_RULE'
  | 'WAREHOUSE_RECORD'
  | 'SNAPSHOT'
  | 'QUERY'
  | 'REPORT';

export interface LineageNode {
  nodeId: string; // Stable identifier, e.g. "LIN-REC-WRH-001"
  type: LineageNodeType;
  label: string; // Display text
  companyId: string;
  datasetId?: string;
  metadata: Record<string, any>;
  timestamp?: string;
}

export interface LineageEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: 'EXTRACTED_FROM' | 'NORMALIZED_BY' | 'TRANSFORMED_BY' | 'STORED_IN' | 'CAPTURED_BY' | 'QUERIED_BY' | 'GENERATED_REPORT';
  metadata?: Record<string, any>;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  rootNodeId: string;
  targetNodeId?: string;
}

export interface RecordLineage {
  lineageId: string;
  warehouseRecordId: string;
  companyId: string;
  datasetId: string;
  sourceSystem: string;
  sourceDataset: string;
  sourceRecordId: string;
  schemaVersion: number;
  mappingVersion: number;
  transformationVersion: number;
  syncJobId: string;
  snapshotId?: string;
  extractedAt: string;
  normalizedAt: string;
  transformedAt: string;
}

export interface FieldLineage {
  fieldLineageId: string;
  datasetId: string;
  sourceField: string;
  canonicalField: string;
  transformationRuleId?: string;
  warehouseField: string;
  dataType: string;
  isCalculated: boolean;
  notes?: string;
}

export interface ReportLineage {
  reportLineageId: string;
  reportId: string;
  reportName: string;
  queryId?: string;
  queryDefinitionSummary: string;
  datasetIds: string[];
  snapshotId?: string;
  companyId: string;
  sourceSystems: string[];
  lastGeneratedAt: string;
}

export interface LineageSearchFilter {
  sourceId?: string;
  recordId?: string;
  datasetId?: string;
  companyId?: string;
  snapshotId?: string;
  syncJobId?: string;
  queryText?: string;
}

export interface ILineageService {
  getRecordLineage(warehouseRecordId: string): Promise<RecordLineage | undefined>;
  getFieldLineage(datasetId: string, warehouseField?: string): Promise<FieldLineage[]>;
  getReportLineage(reportId: string): Promise<ReportLineage | undefined>;
  buildLineageGraph(rootId: string, depth?: number): Promise<LineageGraph>;
  searchLineage(filter: LineageSearchFilter): Promise<LineageNode[]>;
  recordTrace(record: RecordLineage): Promise<void>;
}

// ============================================================================
// 2. SNAPSHOT TYPES
// ============================================================================

export type SnapshotStatus =
  | 'Building'
  | 'Complete'
  | 'Partial'
  | 'Invalid'
  | 'Archived'
  | 'Restoring'
  | 'Failed';

export interface SnapshotMetadata {
  snapshotId: string;
  companyId: string;
  createdAt: string;
  status: SnapshotStatus;
  datasetIds: string[];
  totalRecords: number;
  recordsPerDataset: Record<string, number>;
  schemaVersion: number;
  syncJobId?: string;
  sizeBytes: number;
  checksum: string;
  isProtected?: boolean;
  protectionReason?: string;
  archivedAt?: string;
}

export interface SnapshotRetentionPolicy {
  enabled: boolean;
  keepLatestNSnapshots: number; // e.g. 10
  keepDays: number; // e.g. 30
  protectedSnapshotsExempt: boolean;
}

export interface SnapshotRestoreOptions {
  snapshotId: string;
  companyId: string;
  createCheckpointFirst: boolean;
  validateSchema: boolean;
  validateIntegrity: boolean;
  targetDatasets?: string[];
}

export interface SnapshotComparison {
  snapshotAId: string;
  snapshotBId: string;
  recordCountDeltaTotal: number;
  recordCountDeltaByDataset: Record<string, number>;
  schemaVersionDelta: boolean;
  modifiedAtA: string;
  modifiedAtB: string;
}

export interface ISnapshotManager {
  createSnapshot(companyId: string, datasetIds?: string[], syncJobId?: string): Promise<SnapshotMetadata>;
  getSnapshot(snapshotId: string): Promise<SnapshotMetadata | undefined>;
  listSnapshots(companyId?: string, status?: SnapshotStatus): Promise<SnapshotMetadata[]>;
  compareSnapshots(snapshotAId: string, snapshotBId: string): Promise<SnapshotComparison>;
  archiveSnapshot(snapshotId: string): Promise<SnapshotMetadata>;
  restoreSnapshot(options: SnapshotRestoreOptions): Promise<{ success: boolean; recordsRestored: number; checkpointId?: string; logs: string[] }>;
  deleteSnapshot(snapshotId: string, force?: boolean): Promise<{ success: boolean; message: string }>;
  applyRetentionPolicy(policy: SnapshotRetentionPolicy, companyId?: string): Promise<{ deletedSnapshots: string[] }>;
}

// ============================================================================
// 3. BACKUP & RESTORE TYPES
// ============================================================================

export interface BackupManifest {
  backupId: string;
  backupVersion: string; // e.g. "1.0.0"
  applicationVersion: string; // e.g. "EXFIN-32H.1"
  createdAt: string;
  createdBy: string;
  companyIds: string[];
  schemaVersion: number;
  datasets: Array<{
    datasetId: string;
    recordCount: number;
    checksum: string;
  }>;
  snapshotIds: string[];
  recordCounts: {
    warehouseRecords: number;
    schemas: number;
    catalogItems: number;
    snapshots: number;
    qualityFindings: number;
    transformationRules: number;
    savedQueries: number;
    auditRecords: number;
  };
  totalSizeBytes: number;
  checksum: string; // SHA-256 of payload
  status: 'Complete' | 'Partial' | 'Corrupt' | 'Validating';
  isEncrypted: boolean;
}

export interface BackupContent {
  manifest: BackupManifest;
  warehouseData: Record<string, any[]>; // datasetId -> records
  schemaRegistry: any[];
  dataCatalog: any[];
  snapshots: SnapshotMetadata[];
  syncMetadata: any[];
  lineageRecords: RecordLineage[];
  qualityFindings: any[];
  transformationRules: any[];
  savedQueries: any[];
  reportDefinitions: any[];
  auditRecords: any[];
}

export interface BackupValidationResult {
  isValid: boolean;
  backupId: string;
  checksumMatch: boolean;
  schemaCompatible: boolean;
  missingComponents: string[];
  errors: string[];
  warnings: string[];
  details: {
    manifestValid: boolean;
    dataIntegrityValid: boolean;
    supportedVersion: boolean;
  };
}

export interface BackupRestoreOptions {
  backupId: string;
  targetCompanyId?: string; // Scope restore to company or all
  targetDatasets?: string[]; // Scope to specific datasets
  createCheckpoint: boolean;
  runIntegrityCheckAfter: boolean;
  runDataQualityCheckAfter: boolean;
  user: string;
}

export interface RestoreLog {
  restoreId: string;
  backupId: string;
  user: string;
  companyId: string;
  startedAt: string;
  completedAt?: string;
  datasetsRestored: string[];
  recordsRestored: number;
  checkpointId?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progressPercent: number;
  errors: string[];
}

export interface BackupProgress {
  backupId: string;
  phase: 'INIT' | 'COLLECTING' | 'CHECKSUM' | 'WRITING' | 'COMPLETE' | 'FAILED';
  recordsProcessed: number;
  totalRecords: number;
  bytesProcessed: number;
  totalBytes: number;
  progressPercent: number;
  elapsedMs: number;
  etaMs?: number;
}

export interface IBackupService {
  createBackup(companyIds?: string[], user?: string): Promise<BackupManifest>;
  listBackups(companyId?: string): Promise<BackupManifest[]>;
  getBackupManifest(backupId: string): Promise<BackupManifest | undefined>;
  validateBackup(backupId: string): Promise<BackupValidationResult>;
  getRestorePreview(backupId: string, companyId?: string): Promise<{
    backup: BackupManifest;
    targetCompanies: string[];
    datasetsToRestore: string[];
    recordCountTotal: number;
    compatibility: 'Compatible' | 'Warning' | 'Incompatible';
    warnings: string[];
    errors: string[];
  }>;
  restoreBackup(options: BackupRestoreOptions): Promise<RestoreLog>;
  cancelBackupOrRestore(operationId: string): Promise<boolean>;
}

// ============================================================================
// 4. STORAGE MANAGER TYPES
// ============================================================================

export type StorageHealthStatus = 'Healthy' | 'Warning' | 'Critical';

export interface StorageBreakdown {
  warehouseSizeBytes: number;
  snapshotsSizeBytes: number;
  indexesSizeBytes: number;
  cacheSizeBytes: number;
  logsSizeBytes: number;
  backupsSizeBytes: number;
  totalSizeBytes: number;
  availableDiskBytes: number;
  diskUsagePercent: number;
}

export interface StorageThresholds {
  warningDiskUsagePercent: number; // e.g. 80%
  criticalDiskUsagePercent: number; // e.g. 95%
  minAvailableSpaceBytes: number; // e.g. 100 MB
}

export interface IStorageManager {
  getStorageBreakdown(): Promise<StorageBreakdown>;
  getStorageHealth(): Promise<{ status: StorageHealthStatus; issues: string[]; thresholds: StorageThresholds }>;
  cleanCache(expiredOnly?: boolean): Promise<{ bytesFreed: number; itemsRemoved: number }>;
  cleanTempFiles(): Promise<{ bytesFreed: number; filesRemoved: number }>;
  optimizeIndexes(): Promise<{ indexesOptimized: number; timeMs: number }>;
  vacuumStorage(): Promise<{ bytesReclaimed: number; durationMs: number }>;
  isOperationAllowedForStorage(estimatedSizeBytes?: number): Promise<{ allowed: boolean; reason?: string }>;
}

// ============================================================================
// 5. AUDIT & SECURITY TYPES
// ============================================================================

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'COMPANY_SELECTION'
  | 'SYNC'
  | 'QUERY'
  | 'EXPORT'
  | 'BACKUP'
  | 'RESTORE'
  | 'SNAPSHOT_CREATION'
  | 'SNAPSHOT_ARCHIVE'
  | 'RULE_CHANGE'
  | 'TRANSFORMATION_ACTIVATION'
  | 'PERMISSION_CHANGE'
  | 'SECURITY_EVENT'
  | 'CONFIGURATION_CHANGE'
  | 'REPORT_CREATE'
  | 'REPORT_MODIFY'
  | 'REPORT_EXECUTE'
  | 'REPORT_EXPORT';

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditEvent {
  auditId: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  companyId: string;
  datasetId?: string;
  recordId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'CANCELLED';
  severity: AuditSeverity;
  correlationId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export interface SecurityEvent {
  eventId: string;
  timestamp: string;
  eventType:
    | 'REPEATED_FAILED_AUTH'
    | 'CROSS_COMPANY_ACCESS_ATTEMPT'
    | 'INVALID_QUERY_ACCESS'
    | 'INVALID_BACKUP'
    | 'PATH_TRAVERSAL_ATTEMPT'
    | 'CORRUPT_PAYLOAD_DETECTED';
  user: string;
  companyId: string;
  severity: 'HIGH' | 'CRITICAL';
  description: string;
  blocked: boolean;
  correlationId: string;
}

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'ANALYST' | 'AUDITOR' | 'VIEWER';

export type UserPermission =
  | 'READ_WAREHOUSE'
  | 'EXECUTE_QUERY'
  | 'EXPORT_DATA'
  | 'MANAGE_SYNC'
  | 'MANAGE_RULES'
  | 'CREATE_SNAPSHOT'
  | 'RESTORE_SNAPSHOT'
  | 'CREATE_BACKUP'
  | 'RESTORE_BACKUP'
  | 'VIEW_AUDIT'
  | 'MANAGE_SECURITY'
  | 'SYSTEM_ADMIN';

export interface UserContext {
  userId: string;
  username: string;
  role: UserRole;
  allowedCompanies: string[]; // ['*'] for all
  allowedDatasets: string[]; // ['*'] for all
  permissions: UserPermission[];
}

export interface IAuditService {
  recordEvent(event: Omit<AuditEvent, 'auditId' | 'timestamp'>): Promise<AuditEvent>;
  searchEvents(filter: {
    startDate?: string;
    endDate?: string;
    user?: string;
    action?: AuditAction;
    companyId?: string;
    severity?: AuditSeverity;
    result?: string;
    correlationId?: string;
  }): Promise<AuditEvent[]>;
  recordSecurityEvent(event: Omit<SecurityEvent, 'eventId' | 'timestamp'>): Promise<SecurityEvent>;
  listSecurityEvents(companyId?: string): Promise<SecurityEvent[]>;
}

// ============================================================================
// 6. SYSTEM INTEGRITY & DISASTER RECOVERY
// ============================================================================

export interface IntegrityReport {
  timestamp: string;
  overallStatus: 'PASSED' | 'WARNING' | 'CORRUPTED';
  checks: Array<{
    component: 'WAREHOUSE' | 'SNAPSHOT' | 'BACKUP' | 'SCHEMA_REGISTRY' | 'LINEAGE' | 'INDEX';
    status: 'HEALTHY' | 'DEGRADED' | 'CORRUPT';
    message: string;
    affectedRecords?: number;
  }>;
  totalErrors: number;
  totalWarnings: number;
}

export interface RecoveryState {
  isRecoveryMode: boolean;
  reason?: string;
  enteredAt?: string;
  recommendedAction?: string;
}

export interface DisasterRecoveryCheckResult {
  step: number;
  stepName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  details: string;
}

export interface OperationLock {
  lockId: string;
  operationType: 'RESTORE' | 'BACKUP' | 'SYNC' | 'MIGRATION' | 'MAINTENANCE';
  acquiredBy: string;
  acquiredAt: string;
  companyId: string;
}
