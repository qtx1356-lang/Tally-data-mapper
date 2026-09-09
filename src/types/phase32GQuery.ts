/**
 * Phase 32G - Advanced Local Query & Indexing Layer Types
 * Dynamic dataset query engine, execution planner, grain safety, source router,
 * result cache, index recommendations, and materialized views for normalized Tally data.
 */

export type FilterOperator =
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL'
  | 'BETWEEN'
  | 'Equals'
  | 'Not Equals'
  | 'Greater Than'
  | 'Less Than'
  | 'Greater/Equal'
  | 'Less/Equal'
  | 'Contains'
  | 'Starts With'
  | 'Ends With';

export type QueryOperator = FilterOperator;

export type QuerySortOrder = 'ASC' | 'DESC';

export type AggregationType =
  | 'COUNT'
  | 'SUM'
  | 'MIN'
  | 'MAX'
  | 'AVG'
  | 'DISTINCT_COUNT';

export type AggregationFunction = AggregationType;

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

export type SourcePreference =
  | 'WAREHOUSE'
  | 'SNAPSHOT'
  | 'LIVE_TALLY'
  | 'AUTO';

export type QuerySourcePreference = SourcePreference;

export type QueryExecutionSource =
  | 'WAREHOUSE'
  | 'SNAPSHOT'
  | 'LIVE_TALLY'
  | 'MIXED'
  | 'CACHE_WAREHOUSE'
  | 'CACHE_SNAPSHOT'
  | 'CACHED_WAREHOUSE'
  | 'CACHED_SNAPSHOT';

export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value?: any;
  valueTo?: any; // For BETWEEN
}

export interface QueryOrderBy {
  field: string;
  direction?: QuerySortOrder;
  order?: QuerySortOrder;
}

export interface QueryAggregation {
  field: string;
  type?: AggregationType;
  function?: AggregationType | string;
  alias?: string;
  distinct?: boolean;
}

export interface QueryJoin {
  targetDataset: string;
  joinType: 'INNER' | 'LEFT';
  sourceKey?: string;
  sourceField?: string;
  targetKey?: string;
  targetField?: string;
  alias?: string;
  relationshipId?: string;
  cardinality?: '1:1' | '1:N' | 'N:1' | 'N:M';
  isOneToMany?: boolean;
  isManyToMany?: boolean;
  allowFanout?: boolean;
  explicitManyHandling?: 'ALLOW_FANOUT' | 'AGGREGATE_LINES' | 'ERROR_ON_FANOUT';
}

export interface CalculatedFieldDef {
  name: string;
  expression: string;
  returnType?: 'number' | 'string' | 'boolean' | 'date';
  description?: string;
}

export interface QueryDefinition {
  queryId: string;
  companyId: string; // Mandatory for strict company isolation
  dataset: string; // Dynamic dataset identifier
  fields?: string[]; // Projected fields
  filters?: QueryFilter[];
  joins?: QueryJoin[];
  groupBy?: string[];
  orderBy?: QueryOrderBy[];
  aggregations?: QueryAggregation[];
  calculatedFields?: CalculatedFieldDef[];
  limit?: number;
  offset?: number;
  cursor?: string;
  sourcePreference?: SourcePreference;
  snapshotId?: string;
  createdAt?: string;
  timeoutMs?: number;
}

export interface QueryPlanStep {
  stepNumber: number;
  operation: string;
  target: string;
  details: string;
  costEstimate: number;
  pushdown: boolean;
}

export interface GrainSafetyValidation {
  isSafe: boolean;
  primaryDatasetGrain?: string;
  hasOneToManyJoin?: boolean;
  hasManyToManyJoin?: boolean;
  affectedAggregations?: string[];
  warning?: string;
  actionTaken?: 'Pass' | 'DeduplicatedParentAggregation' | 'WarningAttached' | 'Error';
  grain?: string;
  hasOneToManyFanout?: boolean;
}

export interface QueryPlan {
  planId?: string;
  queryId?: string;
  source: QueryExecutionSource | string;
  primaryDataset?: string;
  primaryDatasetGrain?: string;
  datasets?: string[];
  joinedDatasets?: string[];
  indexes?: string[];
  indexesUsed: Array<{ indexId: string; fields: string[]; reason?: string }>;
  filters?: string[];
  filtersApplied?: Array<{ field: string; operator: FilterOperator; pushdown: boolean }>;
  joins?: string[];
  joinsPlanned?: Array<{
    targetDataset: string;
    on: string;
    joinType: string;
    cardinality: string;
    grainSafe: boolean;
  }>;
  aggregations?: string[];
  aggregationsPlanned?: Array<{
    field: string;
    function: string;
    alias: string;
    pushdown: boolean;
  }>;
  calculatedFieldsPlanned?: Array<{
    name: string;
    expression: string;
    astValid: boolean;
  }>;
  estimatedRows: number;
  estimatedCost: number;
  executionSteps: any[];
  grainSafety: GrainSafetyValidation;
  humanReadableExplanation?: string[];
  warnings?: string[];
  predicatePushdownApplied?: boolean;
  projectionPushdownApplied?: boolean;
  aggregationPushdownApplied?: boolean;
  createdAt?: string;
}

export interface QueryResultColumn {
  name: string;
  type: string;
  isCalculated?: boolean;
  isAggregate?: boolean;
}

export interface QueryResult<T = Record<string, any>> {
  queryId?: string;
  companyId?: string;
  dataset?: string;
  columns: QueryResultColumn[];
  rows: T[];
  recordCount: number;
  totalMatchingRows: number;
  executionTimeMs: number;
  source: QueryExecutionSource | 'CACHED_WAREHOUSE' | 'CACHED_SNAPSHOT';
  snapshotId?: string;
  schemaVersion: number;
  warnings: string[];
  errors: string[];
  lineageReference: {
    companyId: string;
    datasetId: string;
    schemaVersion: number;
    snapshotId?: string;
    warehouseVersion?: number;
    transformationVersion?: number;
    executionTimestamp: string;
  };
  nextCursor?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    nextCursor?: string;
  };
  isCached?: boolean;
  isMixedSource?: boolean;
  sourcesUsed?: string[];
  aggregates?: Record<string, number>;
}

export interface ExtendedWarehouseIndex {
  indexId: string;
  datasetId: string;
  fields: string[];
  isComposite: boolean;
  isUnique: boolean;
  usageCount: number;
  lastUsedAt?: string;
  buildTimeMs: number;
  approximateSizeBytes: number;
  status: 'Ready' | 'Rebuilding' | 'Stale' | 'Disabled';
}

export interface IndexRecommendation {
  recommendationId: string;
  datasetId: string;
  fields: string[];
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  filterFrequency: number;
  joinFrequency: number;
  sortFrequency: number;
  estimatedQueryCostSavingsPercent: number;
  status: 'RECOMMENDED' | 'APPROVED' | 'DISMISSED' | 'CREATED';
  createdAt: string;
}

export interface SlowQueryRecord {
  queryId: string;
  companyId: string;
  dataset: string;
  executionTimeMs: number;
  thresholdMs: number;
  timestamp: string;
  planSummary: string;
  suggestedOptimization: string;
  queryDefinition: QueryDefinition;
}

export interface QueryPerformanceStats {
  totalQueries: number;
  averageExecutionTimeMs: number;
  p95ExecutionTimeMs: number;
  totalRowsScanned: number;
  totalRowsReturned: number;
  cacheHitCount: number;
  cacheMissCount: number;
  cacheHitRatePercent: number;
  slowQueriesCount: number;
  slowQueries: SlowQueryRecord[];
  topQueries: { querySignature: string; count: number; avgTimeMs: number }[];
  datasetUsage: Record<string, number>;
  fieldUsage: Record<string, number>;
  indexUsage: Record<string, number>;
}

export interface MaterializedViewDefinition {
  viewId: string;
  name: string;
  dataset: string;
  companyId: string;
  definition: QueryDefinition;
  refreshPolicy: 'Manual' | 'After Sync' | 'Scheduled-ready';
  lastRefresh?: string;
  status: 'Current' | 'Stale' | 'Refreshing' | 'Error';
  sourceDatasetVersion: number;
  schemaVersion: number;
  snapshotId?: string;
  rowCount?: number;
  cachedData?: Record<string, any>[];
  cachedAggregates?: Record<string, number>;
}

export interface SavedQueryDefinition {
  savedQueryId: string;
  queryId?: string;
  name: string;
  description?: string;
  companyScope: string;
  definition: QueryDefinition;
  schemaVersion: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'Valid' | 'Needs Review' | 'Deprecated';
  validationIssues?: string[];
  compatibilityIssues?: string[];
}

export type SavedQuery = SavedQueryDefinition;

export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldsValidated: string[];
  relationshipsValidated: string[];
  grainSafetyNote?: string;
}

export interface IUnifiedQueryEngine {
  executeQuery<T = Record<string, any>>(definition: QueryDefinition): Promise<QueryResult<T>>;
  explainQuery(definition: QueryDefinition): Promise<QueryPlan>;
  validateQuery(definition: QueryDefinition): QueryValidationResult;
  cancelQuery(queryId: string): boolean;
}

export interface IQueryPlanner {
  createPlan(definition: QueryDefinition): Promise<QueryPlan>;
}

export interface IQuerySourceRouter {
  determineSource?(
    definition: QueryDefinition
  ): Promise<{
    source: QueryExecutionSource;
    warnings: string[];
    isStaleWarehouse: boolean;
    lastSyncTimestamp?: string;
  }>;
  routeSource?(definition: QueryDefinition): {
    primarySource: QuerySourcePreference;
    isStaleWarehouse: boolean;
    staleDetails?: { lastSync?: string; freshnessState: string };
    isMixed: boolean;
    sources: string[];
    warnings: string[];
  };
}

export interface IQueryResultCache {
  get(key: string): QueryResult | null;
  set(key: string, result: QueryResult, ttlSeconds?: number): void;
  invalidateForDataset(datasetId: string, companyId?: string): void;
  invalidateForSchema(datasetId: string): void;
  invalidateDataset?(datasetId: string): void;
  invalidateAll?(): void;
  clear(): void;
  getStats(): { hitCount: number; missCount: number; keyCount: number; hitRate: number };
}
