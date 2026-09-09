/**
 * Phase 17: High-Performance Local Data Engine, Incremental Sync,
 * Offline Analytics & Million-Row Processing Types.
 * 
 * Enforces:
 * - Strict Read-Only against Tally source
 * - Local analytical cache layer (DuckDB columnar architecture)
 * - Tenant company isolation at data-access layer
 * - Deterministic record identity & duplicate protection
 */

export type DatasetType =
  | 'Voucher'
  | 'Ledger'
  | 'Inventory'
  | 'Party'
  | 'GST'
  | 'Outstanding'
  | 'Custom';

export type DatasetStatus =
  | 'Live'
  | 'Fresh'
  | 'Stale'
  | 'Partial'
  | 'Failed'
  | 'Unavailable';

export type SyncStrategy =
  | 'FullRefresh'
  | 'Incremental'
  | 'PeriodRefresh'
  | 'ManualRefresh';

export type IngestionJobState =
  | 'Queued'
  | 'Running'
  | 'Paused'
  | 'Completed'
  | 'Partial'
  | 'Failed'
  | 'Cancelled';

export type IngestionPipelinePhase =
  | 'Fetch'
  | 'Parse'
  | 'Validate'
  | 'Normalize'
  | 'Transform'
  | 'Insert'
  | 'Index'
  | 'Verify'
  | 'Finalized';

export type QueryRoutingPreference =
  | 'AlwaysUseLive'
  | 'PreferLocal'
  | 'OfflineOnly';

export interface DataLineageMetadata {
  source: string;
  object: string;
  field: string;
  schemaVersion: string;
  mappingVersion: string;
  calculationVersion: string;
  lastSyncedAt: string;
}

export interface LocalDataset {
  datasetId: string;
  companyId: string;
  companyName: string;
  objectType: DatasetType;
  source: string;
  schemaVersion: string;
  mappingVersion: string;
  calculationVersion: string;
  createdAt: string;
  updatedAt: string;
  rowCount: number;
  status: DatasetStatus;
  refreshStrategy: SyncStrategy;
  financialYearPartition: string;
  diskSizeBytes: number;
  checkpointToken: string;
  isTestDataset: boolean;
  deterministicSignature: string;
  indexedColumns: string[];
  lineage: DataLineageMetadata;
}

export interface AccountingReconciliationResult {
  datasetId: string;
  metricName: string;
  tallySourceTotal: number;
  localDatasetTotal: number;
  variance: number;
  isMatched: boolean;
  statusMessage: string;
  verifiedAt: string;
}

export interface IngestionJob {
  jobId: string;
  datasetId: string;
  companyId: string;
  objectType: DatasetType;
  state: IngestionJobState;
  phase: IngestionPipelinePhase;
  recordsDiscovered: number;
  recordsProcessed: number;
  recordsInserted: number;
  recordsRejected: number;
  elapsedMilliseconds: number;
  lastSuccessfulBatch: number;
  sourcePositionCheckpoint: string;
  schemaVersion: string;
  startedAt: string;
  completedAt?: string;
  errorSummary?: string;
  validationWarnings: string[];
  reconciliation?: AccountingReconciliationResult;
}

export interface IngestionJobRequest {
  companyId: string;
  dataType: DatasetType;
  strategy: SyncStrategy;
  financialYear: string;
  dateFrom?: string;
  dateTo?: string;
  batchSize: number;
  enableRawRetention: boolean;
  validateAccountingTotals: boolean;
}

export interface AnalyticalQueryPlan {
  queryId: string;
  datasetId: string;
  appliedFilters: string[];
  indexesUsed: string[];
  estimatedRows: number;
  executionTimeMs: number;
  cacheHit: boolean;
  sqlRepresentation: string;
  memoryUsedMb: number;
}

export interface AnalyticalQueryResult {
  queryId: string;
  totalRows: number;
  columns: string[];
  rows: Record<string, any>[];
  plan: AnalyticalQueryPlan;
  isOfflineCache: boolean;
  snapshotTimestamp: string;
}

export interface PrecomputedAggregateSummary {
  aggregateId: string;
  title: string;
  category: string;
  dimensions: string[];
  metrics: { field: string; func: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'; alias: string }[];
  rowCount: number;
  lastRefreshedAt: string;
  previewRows: Record<string, any>[];
}

export interface DataHealthItem {
  datasetType: DatasetType;
  datasetId: string;
  status: DatasetStatus;
  lastSynchronized: string;
  ageHours: number;
  rowCount: number;
  isStale: boolean;
  warning?: string;
}

export interface DatabaseHealthMetrics {
  engineName: string;
  engineVersion: string;
  databaseSizeBytes: number;
  datasetCount: number;
  totalRowCount: number;
  lastSyncTimestamp: string;
  failedJobCount: number;
  storageLimitBytes: number;
  storageUsedPercentage: number;
  storageLocation: string;
  encryptionActive: boolean;
  lastVacuumCompleted: string;
}

export interface BenchmarkExecutionRecord {
  rowVolumeLabel: '100K' | '500K' | '1M' | '5M';
  rowCount: number;
  ingestionSeconds: number;
  monthlyAggregationSeconds: number;
  filteredQuerySeconds: number;
  exportSeconds: number;
  peakMemoryMb: number;
  startupTimeMs: number;
  executedAt: string;
}

export interface StorageSettings {
  storageLocation: string;
  maxStorageGigabytes: number;
  retentionPolicy: 'KeepAll' | 'KeepXYears' | 'KeepSelected';
  retentionYears: number;
  autoCleanupEnabled: boolean;
  encryptionEnabled: boolean;
  routingPreference: QueryRoutingPreference;
  staleThresholdHours: number;
}
