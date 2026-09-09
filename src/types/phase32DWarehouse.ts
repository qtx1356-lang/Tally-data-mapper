/**
 * Phase 32D - Local Analytical Warehouse Types & Interfaces
 * High-performance, company-isolated analytical warehouse for normalized Tally data
 */

import { ExtensionField } from './phase32UniversalModel';

export interface EvidenceTrace {
  sourceDataset?: string;
  sourceRecord?: string;
  sourcePath?: string;
  schemaVersion?: number;
  extractedAt?: string;
  fieldCount?: number;
  tallyVersion?: string;
  [key: string]: any;
}

export type DatasetGrainType = 'Fact' | 'Dimension';

export type WarehouseDatasetStatus =
  | 'Not Loaded'
  | 'Loading'
  | 'Current'
  | 'Partial'
  | 'Failed'
  | 'Stale';

export type SnapshotStatus =
  | 'Building'
  | 'Complete'
  | 'Partial'
  | 'Invalid'
  | 'Archived';

export type AggregationFunction = 'COUNT' | 'SUM' | 'MIN' | 'MAX' | 'AVG';

export type SortOrder = 'ASC' | 'DESC';

// ============================================================================
// 1. WAREHOUSE RECORD METADATA & BASE RECORD
// ============================================================================

export interface WarehouseRecordMetadata {
  canonicalRecordId: string;
  datasetId: string;
  companyId: string;
  schemaVersion: number;
  sourceSnapshotId?: string;
  sourceSystem: string;
  sourceObject: string;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
  version: number;
  validFrom: string;
  validTo?: string | null;
  extensionFields?: ExtensionField[];
  lineage?: EvidenceTrace;
}

export interface WarehouseRecord {
  metadata: WarehouseRecordMetadata;
  payload: Record<string, any>;
}

// ============================================================================
// 2. STANDARD DIMENSIONS
// ============================================================================

export interface DateDimensionRecord {
  dateKey: string; // YYYY-MM-DD
  date: string;
  day: number;
  dayOfWeek: number;
  dayName: string;
  month: string;
  monthNumber: number;
  quarter: number;
  quarterName: string;
  year: number;
  weekOfYear: number;
  financialYear: string; // e.g. "2025-2026"
  financialYearStart: string; // "2025-04-01"
  financialYearEnd: string; // "2026-03-31"
  financialQuarter: string; // "Q1", "Q2", "Q3", "Q4"
  isWeekend: boolean;
}

export interface VoucherTypeDimensionRecord {
  voucherTypeKey: string;
  companyId: string;
  sourceVoucherTypeName: string;
  canonicalCategory:
    | 'Sales'
    | 'Purchase'
    | 'Payment'
    | 'Receipt'
    | 'Journal'
    | 'Contra'
    | 'Debit Note'
    | 'Credit Note'
    | 'Inventory'
    | 'Payroll'
    | 'Other';
  numberingMethod: 'Auto' | 'Manual' | 'Custom';
  affectsInventory: boolean;
  isOptional: boolean;
}

export interface CompanyDimensionRecord {
  companyId: string;
  companyName: string;
  financialYearStartMonth: number; // 4 for April (India standard), 1 for Jan
  booksBeginningDate: string;
  currencySymbol: string;
  currencyCode: string;
  jurisdiction: string;
}

// ============================================================================
// 3. WAREHOUSE SNAPSHOT
// ============================================================================

export interface WarehouseSnapshot {
  snapshotId: string;
  companyId: string;
  createdAt: string;
  schemaVersion: number;
  datasetVersions: Record<string, number>;
  graphVersion: string;
  status: SnapshotStatus;
  recordCounts: Record<string, number>;
  approximateTotalSizeBytes: number;
  metadata?: Record<string, any>;
}

export interface SnapshotComparisonPlan {
  baseSnapshotId: string;
  targetSnapshotId: string;
  companyId: string;
  datasetComparisons: {
    datasetId: string;
    baseRowCount: number;
    targetRowCount: number;
    deltaRows: number;
    schemaChangeDetected: boolean;
  }[];
  preparedForPhase32E: boolean;
}

// ============================================================================
// 4. BULK INGESTION & BATCH WRITER
// ============================================================================

export interface IngestionBatchOptions {
  batchSize?: number;
  upsert?: boolean;
  preserveHistory?: boolean;
  snapshotId?: string;
  transactional?: boolean;
}

export interface IngestionBatchProgress {
  datasetId: string;
  companyId: string;
  rowsRead: number;
  rowsWritten: number;
  rowsUpdated: number;
  rowsSkipped: number;
  rowsFailed: number;
  durationMs: number;
  status: WarehouseDatasetStatus;
  errorMessage?: string;
}

export interface IBulkWarehouseWriter {
  insertBatch(
    datasetId: string,
    companyId: string,
    records: Record<string, any>[],
    options?: IngestionBatchOptions
  ): Promise<IngestionBatchProgress>;

  upsertBatch(
    datasetId: string,
    companyId: string,
    records: Record<string, any>[],
    options?: IngestionBatchOptions
  ): Promise<IngestionBatchProgress>;

  streamIngest(
    datasetId: string,
    companyId: string,
    recordGenerator: AsyncIterable<Record<string, any>> | Iterable<Record<string, any>>,
    options?: IngestionBatchOptions
  ): Promise<IngestionBatchProgress>;
}

// ============================================================================
// 5. INDEX MANAGEMENT
// ============================================================================

export interface WarehouseIndexDefinition {
  indexId: string;
  datasetId: string;
  companyId?: string;
  fields: string[];
  isComposite: boolean;
  isUnique: boolean;
  sizeBytes: number;
  itemCount: number;
  lastRebuiltAt: string;
  status: 'Ready' | 'Rebuilding' | 'Stale' | 'Disabled';
  usageCount?: number;
  lastUsedAt?: string;
  buildTimeMs?: number;
}

export interface IWarehouseIndexManager {
  createIndex(datasetId: string, fields: string[], isUnique?: boolean): WarehouseIndexDefinition;
  rebuildIndex(indexId: string): Promise<boolean>;
  rebuildAllIndexes(companyId?: string): Promise<{ rebuiltCount: number; totalDurationMs: number }>;
  getIndexStatus(companyId?: string): WarehouseIndexDefinition[];
  removeIndex?(indexId: string): boolean;
}

// ============================================================================
// 6. QUERY FOUNDATION & QUERY ENGINE
// ============================================================================

export interface QueryFilterClause {
  field: string;
  operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN' | 'LIKE' | 'BETWEEN';
  value: any;
  valueTo?: any; // For BETWEEN
}

export interface QueryAggregationClause {
  field: string;
  function: AggregationFunction;
  alias?: string;
}

export interface WarehouseQueryParams {
  datasetId: string;
  companyId: string; // Mandatory for strict company isolation
  filters?: QueryFilterClause[];
  dateRange?: {
    field?: string;
    from?: string;
    to?: string;
    financialYear?: string;
  };
  groupBy?: string[];
  aggregations?: QueryAggregationClause[];
  orderBy?: { field: string; order: SortOrder }[];
  limit?: number;
  offset?: number;
  cursor?: string;
  currentOnly?: boolean;
}

export interface WarehouseQueryResult<T = any> {
  datasetId: string;
  companyId: string;
  totalMatchedRows: number;
  returnedRows: number;
  offset: number;
  limit: number;
  nextCursor?: string;
  executionTimeMs: number;
  data: T[];
  aggregates?: Record<string, number>;
  sourceLineageInfo?: {
    snapshotId?: string;
    schemaVersion: number;
    datasetGrain: DatasetGrainType;
  };
}

export interface IWarehouseQueryEngine {
  query<T = any>(params: WarehouseQueryParams): Promise<WarehouseQueryResult<T>>;
  getRecordById(datasetId: string, companyId: string, canonicalRecordId: string): WarehouseRecord | null;
  getRecordBySourceId(datasetId: string, companyId: string, sourceId: string): WarehouseRecord | null;
  getHistoricalVersions(datasetId: string, companyId: string, sourceId: string): WarehouseRecord[];
}

// ============================================================================
// 7. WAREHOUSE MANAGER & HEALTH
// ============================================================================

export interface DatasetStorageStats {
  datasetId: string;
  datasetName: string;
  grainType: DatasetGrainType;
  recordCount: number;
  approximateSizeBytes: number;
  lastUpdated: string;
  schemaVersion: number;
  status: WarehouseDatasetStatus;
  activeIndexes: number;
  currentRecords: number;
  historicalRecords: number;
}

export interface WarehouseHealthReport {
  databaseStatus: 'Healthy' | 'Degraded' | 'Initializing' | 'Maintenance';
  storageSizeBytes: number;
  totalDatasetsCount: number;
  totalRecordsCount: number;
  indexStatus: {
    totalIndexes: number;
    healthyIndexes: number;
    rebuildingIndexes: number;
  };
  lastSnapshot?: WarehouseSnapshot | null;
  maintenanceOperations: {
    lastOptimizedAt?: string;
    lastVacuumedAt?: string;
    lastValidatedAt?: string;
  };
  companiesStored: string[];
  errors: WarehouseErrorLogItem[];
  uptimeSeconds: number;
}

export interface WarehouseErrorLogItem {
  errorCode: string;
  datasetId?: string;
  companyId?: string;
  recordId?: string;
  timestamp: string;
  message: string;
}

export interface IWarehouseManager {
  initialize(): Promise<boolean>;
  validateWarehouse(companyId?: string): Promise<{ isValid: boolean; issues: string[] }>;
  getHealthReport(): WarehouseHealthReport;
  getDatasetStats(companyId?: string): DatasetStorageStats[];
  optimizeStorage(companyId?: string): Promise<{ reclaimedBytes: number; durationMs: number }>;
  compactStorage(companyId?: string): Promise<{ beforeBytes: number; afterBytes: number }>;
  rebuildIndexes(companyId?: string): Promise<{ rebuiltIndexes: number }>;
}
