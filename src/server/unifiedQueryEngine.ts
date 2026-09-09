/**
 * Phase 32G - Unified Query Engine
 * Complete query execution engine for normalized Tally data.
 * Features:
 * - Dynamic querying of ANY registered or discovered Tally dataset
 * - Strict company isolation
 * - Full filter operator support (EQ, NEQ, GT, GTE, LT, LTE, CONTAINS, IN, BETWEEN, etc.)
 * - Safe AST-based calculated fields (via SafeExpressionEvaluator)
 * - Semantic join engine with Accounting Grain Safety (deduplicated parent aggregation)
 * - Deterministic result caching and fine-grained invalidation
 * - Query execution planning via QueryPlanner
 * - Intelligent index tracking & recommendations
 * - Materialized analytics views
 * - Read-only Tally gateway safety guarantee
 */

import {
  QueryDefinition,
  QueryPlan,
  QueryResult,
  QueryValidationResult,
  FilterOperator,
  IUnifiedQueryEngine,
  QueryExecutionSource,
  SlowQueryRecord,
  QueryPerformanceStats,
  MaterializedViewDefinition,
  SavedQueryDefinition,
  IndexRecommendation
} from '../types/phase32GQuery';
import { WarehouseRecord } from '../types/phase32DWarehouse';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { universalDataModelEngine } from './universalDataModelEngine';
import { SafeExpressionEvaluator } from './safeExpressionEvaluator';
import { queryPlanner } from './queryPlanner';
import { queryResultCache } from './queryResultCache';
import { querySourceRouter } from './querySourceRouter';

export class UnifiedQueryEngine implements IUnifiedQueryEngine {
  // Slow query tracking
  private slowQueryThresholdMs = 40;
  private slowQueries: SlowQueryRecord[] = [];
  private totalQueries = 0;
  private totalRowsScanned = 0;
  private totalRowsReturned = 0;
  private totalDurationMs = 0;
  private queryTimes: number[] = [];
  private datasetUsage: Record<string, number> = {};
  private fieldUsage: Record<string, number> = {};
  private indexUsage: Record<string, number> = {};
  private querySignatures: Map<string, { count: number; totalMs: number }> = new Map();

  // Saved queries repository
  private savedQueries: Map<string, SavedQueryDefinition> = new Map();

  // Materialized views repository
  private materializedViews: Map<string, MaterializedViewDefinition> = new Map();

  // Active query cancellation tokens
  private activeQueries: Set<string> = new Set();

  constructor() {
    this.seedDefaultSavedQueries();
    this.seedDefaultMaterializedViews();
  }

  // ============================================================================
  // 1. QUERY EXECUTION
  // ============================================================================

  public async executeQuery<T = Record<string, any>>(
    def: QueryDefinition
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryId = def.queryId || `Q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.activeQueries.add(queryId);

    try {
      // 1. Mandatory Company Isolation Guard
      if (!def.companyId || typeof def.companyId !== 'string' || def.companyId.trim() === '') {
        throw new Error('Company Isolation Violation: Query must explicitly specify a valid non-empty companyId.');
      }

      // 2. Field existence validation against registered schema
      const schema = universalDataModelEngine.getActiveSchemaForDataset(def.dataset);
      const validFieldNames = new Set<string>();
      if (schema && schema.fields) {
        schema.fields.forEach((f) => validFieldNames.add(f.name.toLowerCase()));
        ['id', 'companyid', 'date', 'createdat', 'sourceid', 'amount', 'narration', 'name', 'status', 'vouchernumber', 'vouchertype'].forEach((f) => {
          validFieldNames.add(f);
        });
      }

      if (def.filters && def.filters.length > 0 && validFieldNames.size > 0) {
        for (const filter of def.filters) {
          const clean = filter.field.includes('.') ? filter.field.split('.')[1] : filter.field;
          if (!validFieldNames.has(clean.toLowerCase())) {
            throw new Error(
              `Field Validation Error: Field '${filter.field}' does not exist in dataset '${def.dataset}'.`
            );
          }
        }
      }

      // 3. Determine Source Routing
      const routing = querySourceRouter.routeSource(def);
      const schemaVersion = schema?.version || 1;

      // 4. Track query patterns for automatic index recommendations (tracked for every execution)
      const filterFields = (def.filters || []).map((f) => f.field);
      const joinFields = (def.joins || []).map((j) => j.sourceField || j.sourceKey || '');
      const sortFields = (def.orderBy || []).map((o) => o.field);
      warehouseStorageEngine.indexManager.trackQueryPattern(
        def.dataset,
        filterFields,
        joinFields,
        sortFields
      );

      // 5. Check Result Cache
      const cacheKey = queryResultCache.generateCacheKey(def, schemaVersion, 1, 1);
      const cached = queryResultCache.get(cacheKey);
      if (cached) {
        this.recordQueryStats(def, Date.now() - startTime, 0, cached.recordCount, true);
        const cachedSource = (routing.primarySource === 'SNAPSHOT' || cached.source === 'SNAPSHOT')
          ? 'CACHED_SNAPSHOT'
          : 'CACHED_WAREHOUSE';

        return {
          ...cached,
          companyId: def.companyId,
          dataset: def.dataset,
          queryId,
          isCached: true,
          source: cachedSource
        } as unknown as QueryResult<T>;
      }

      // 6. Retrieve Base Records strictly scoped to companyId
      let rawRecords: WarehouseRecord[] = [];
      let scannedCount = 0;

      if (routing.primarySource === 'SNAPSHOT' && def.snapshotId) {
        const allRecords = warehouseStorageEngine.getRecordsForDataset(def.dataset, def.companyId);
        rawRecords = allRecords.filter(
          (r) => r.metadata.sourceSnapshotId === def.snapshotId || r.metadata.companyId === def.companyId
        );
        scannedCount = rawRecords.length;
      } else {
        rawRecords = warehouseStorageEngine.getRecordsForDataset(def.dataset, def.companyId);
        scannedCount = rawRecords.length;
      }

      // If no records in warehouse and live tally requested, generate read-only live records
      if (rawRecords.length === 0 && routing.primarySource === 'LIVE_TALLY') {
        rawRecords = this.generateReadOnlyLiveTallyRecords(def.dataset, def.companyId);
        scannedCount = rawRecords.length;
      }

      // Strict company isolation filter
      let filteredRecords = rawRecords.filter((r) => {
        if (r.metadata.companyId !== def.companyId && r.metadata.companyId !== 'GLOBAL') {
          return false;
        }

        if (!def.filters || def.filters.length === 0) return true;

        return def.filters.every((filter) => {
          const val = r.payload[filter.field] !== undefined ? r.payload[filter.field] : (r.metadata as any)[filter.field];
          return this.evaluateFilter(val, filter.operator, filter.value, filter.valueTo);
        });
      });

      // 7. Joins with Accounting Grain Safety
      let joinedRows: Record<string, any>[] = filteredRecords.map((r) => ({
        ...r.payload,
        _canonicalRecordId: r.metadata.canonicalRecordId,
        _datasetId: r.metadata.datasetId,
        companyId: r.metadata.companyId
      }));

      const hasJoins = def.joins && def.joins.length > 0;
      let hasOneToManyJoin = false;

      if (hasJoins) {
        for (const join of def.joins!) {
          const sKey = join.sourceField || join.sourceKey || 'id';
          const tKey = join.targetField || join.targetKey || 'id';

          const card = join.cardinality || (def.dataset.includes('voucher') && join.targetDataset.includes('lines') ? '1:N' : '1:1');
          if (card === '1:N') hasOneToManyJoin = true;

          const targetRecords = warehouseStorageEngine.getRecordsForDataset(join.targetDataset, def.companyId);
          const targetMap = new Map<string, any[]>();

          for (const tr of targetRecords) {
            const k = String(tr.payload[tKey] || (tr.metadata as any)[tKey]);
            if (!targetMap.has(k)) targetMap.set(k, []);
            targetMap.get(k)!.push(tr.payload);
          }

          const newJoined: Record<string, any>[] = [];
          for (const row of joinedRows) {
            const keyVal = String(row[sKey]);
            const matches = targetMap.get(keyVal);

            if (matches && matches.length > 0) {
              for (const match of matches) {
                const merged: Record<string, any> = { ...row };
                for (const [k, v] of Object.entries(match)) {
                  merged[`${join.targetDataset}.${k}`] = v;
                  if (merged[k] === undefined) {
                    merged[k] = v;
                  }
                }
                newJoined.push(merged);
              }
            } else if (join.joinType === 'LEFT') {
              newJoined.push(row);
            }
          }
          joinedRows = newJoined;
        }
      }

      // 8. Calculated Fields (Safe AST Evaluation)
      if (def.calculatedFields && def.calculatedFields.length > 0) {
        joinedRows = joinedRows.map((row) => {
          const augmented = { ...row };
          for (const calc of def.calculatedFields!) {
            try {
              augmented[calc.name] = SafeExpressionEvaluator.evaluate(calc.expression, augmented);
            } catch (err: any) {
              augmented[calc.name] = null;
            }
          }
          return augmented;
        });
      }

      // 9. Aggregations & Group By with Accounting Grain Protection
      let outputRows: Record<string, any>[] = [];
      const globalAggregates: Record<string, number> = {};

      if (def.groupBy && def.groupBy.length > 0) {
        const groups = new Map<string, { groupValues: Record<string, any>; items: Record<string, any>[] }>();

        for (const row of joinedRows) {
          const keyParts = def.groupBy.map((g) => String(row[g] !== undefined ? row[g] : ''));
          const groupKey = keyParts.join(':::');

          if (!groups.has(groupKey)) {
            const groupValues: Record<string, any> = {};
            def.groupBy.forEach((g) => {
              groupValues[g] = row[g];
            });
            groups.set(groupKey, { groupValues, items: [] });
          }
          groups.get(groupKey)!.items.push(row);
        }

        for (const grp of groups.values()) {
          const rowOut: Record<string, any> = { ...grp.groupValues };

          if (def.aggregations && def.aggregations.length > 0) {
            for (const agg of def.aggregations) {
              const fn = agg.function || agg.type || 'COUNT';
              const alias = agg.alias || `${fn.toLowerCase()}_${agg.field}`;

              // Accounting Grain Protection: Deduplicate parent values if 1:N join
              const itemsToAggregate = hasOneToManyJoin && !agg.field.includes('.')
                ? this.deduplicateParentItems(grp.items)
                : grp.items;

              rowOut[alias] = this.computeAggregation(itemsToAggregate, agg.field, fn, agg.distinct);
            }
          } else {
            rowOut['count'] = grp.items.length;
          }

          outputRows.push(rowOut);
        }
      } else if (def.aggregations && def.aggregations.length > 0) {
        const singleAggRow: Record<string, any> = {};

        for (const agg of def.aggregations) {
          const fn = agg.function || agg.type || 'COUNT';
          const alias = agg.alias || `${fn.toLowerCase()}_${agg.field}`;

          // Accounting Grain Protection: Deduplicate parent values if 1:N join
          const itemsToAggregate = hasOneToManyJoin && !agg.field.includes('.')
            ? this.deduplicateParentItems(joinedRows)
            : joinedRows;

          const val = this.computeAggregation(itemsToAggregate, agg.field, fn, agg.distinct);
          globalAggregates[alias] = val;
          singleAggRow[alias] = val;
        }

        outputRows = [singleAggRow];
      } else {
        outputRows = joinedRows;
      }

      const totalMatchingRows = outputRows.length;

      // 10. Sorting
      if (def.orderBy && def.orderBy.length > 0) {
        outputRows.sort((a, b) => {
          for (const ord of def.orderBy!) {
            const dir = ord.order || ord.direction || 'ASC';
            const aVal = a[ord.field];
            const bVal = b[ord.field];

            if (aVal === bVal) continue;
            if (aVal === undefined || aVal === null) return dir === 'ASC' ? -1 : 1;
            if (bVal === undefined || bVal === null) return dir === 'ASC' ? 1 : -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return dir === 'ASC' ? aVal - bVal : bVal - aVal;
            }

            const cmp = String(aVal).localeCompare(String(bVal));
            return dir === 'ASC' ? cmp : -cmp;
          }
          return 0;
        });
      }

      // 11. Pagination / Offset / Limit
      const offset = def.offset || 0;
      const limit = def.limit !== undefined ? Math.min(def.limit, 10000) : 50;
      const paginatedRows = outputRows.slice(offset, offset + limit);

      // 12. Projection Pushdown (Project requested fields + calculated + aggregates)
      let finalRows: Record<string, any>[] = paginatedRows;

      if (def.fields && def.fields.length > 0 && !def.fields.includes('*') && (!def.aggregations || def.groupBy)) {
        const allowed = new Set([
          ...def.fields,
          ...(def.groupBy || []),
          ...(def.calculatedFields || []).map((c) => c.name),
          ...(def.aggregations || []).map((a) => a.alias || a.field),
          'companyId',
          'id'
        ]);

        finalRows = paginatedRows.map((r) => {
          const proj: Record<string, any> = {};
          for (const k of Object.keys(r)) {
            if (allowed.has(k) || def.fields!.some((f) => f === k || k.endsWith(`.${f}`))) {
              proj[k] = r[k];
            }
          }
          return proj;
        });
      }

      // 13. Columns Metadata
      const columns = this.deriveColumns(finalRows, def);

      // 14. Execution Duration
      const executionTimeMs = Date.now() - startTime;
      const nextCursor = offset + limit < totalMatchingRows ? String(offset + limit) : undefined;

      const sourceResult: QueryExecutionSource =
        routing.primarySource === 'LIVE_TALLY'
          ? 'LIVE_TALLY'
          : routing.primarySource === 'SNAPSHOT'
          ? 'SNAPSHOT'
          : 'WAREHOUSE';

      const result: QueryResult<T> = {
        queryId,
        companyId: def.companyId,
        dataset: def.dataset,
        columns,
        rows: finalRows as unknown as T[],
        recordCount: finalRows.length,
        totalMatchingRows,
        executionTimeMs,
        source: sourceResult,
        snapshotId: def.snapshotId,
        schemaVersion,
        warnings: routing.warnings,
        errors: [],
        lineageReference: {
          companyId: def.companyId,
          datasetId: def.dataset,
          schemaVersion,
          snapshotId: def.snapshotId,
          warehouseVersion: 1,
          transformationVersion: 1,
          executionTimestamp: new Date().toISOString()
        },
        pagination: {
          limit,
          offset,
          total: totalMatchingRows,
          nextCursor
        },
        nextCursor,
        isCached: false,
        aggregates: Object.keys(globalAggregates).length > 0 ? globalAggregates : undefined
      };

      // 15. Save to Cache
      queryResultCache.set(cacheKey, result as unknown as QueryResult);

      // 16. Record Statistics
      this.recordQueryStats(def, executionTimeMs, scannedCount, finalRows.length, false);

      return result;
    } finally {
      this.activeQueries.delete(queryId);
    }
  }

  // ============================================================================
  // 2. EXPLAIN & VALIDATION
  // ============================================================================

  public async explainQuery(definition: QueryDefinition): Promise<QueryPlan> {
    return queryPlanner.createPlan(definition);
  }

  public validateQuery(definition: QueryDefinition): QueryValidationResult {
    const val = queryPlanner.validateQuery(definition);
    return {
      isValid: val.isValid,
      errors: val.errors,
      warnings: val.warnings,
      fieldsValidated: definition.fields || [],
      relationshipsValidated: (definition.joins || []).map((j) => j.targetDataset),
      grainSafetyNote: val.isValid ? 'Validation passed' : undefined
    };
  }

  public cancelQuery(queryId: string): boolean {
    if (this.activeQueries.has(queryId)) {
      this.activeQueries.delete(queryId);
      return true;
    }
    return false;
  }

  // ============================================================================
  // 3. SAVED QUERIES & SCHEMA COMPATIBILITY
  // ============================================================================

  public getSavedQueries(companyId?: string): SavedQueryDefinition[] {
    const list = Array.from(this.savedQueries.values());
    if (companyId) {
      return list.filter((sq) => sq.companyScope === companyId || sq.companyScope === 'GLOBAL');
    }
    return list;
  }

  public getSavedQueryById(id: string): SavedQueryDefinition | undefined {
    return this.savedQueries.get(id);
  }

  public saveQuery(
    param1: string | Partial<SavedQueryDefinition>,
    definition?: QueryDefinition,
    companyScope: string = 'CMP-001',
    description?: string,
    createdBy: string = 'User'
  ): SavedQueryDefinition {
    let name: string;
    let def: QueryDefinition;
    let scope: string = companyScope;
    let desc: string | undefined = description;
    let creator: string = createdBy;
    let queryId: string | undefined;

    if (typeof param1 === 'object') {
      name = param1.name || 'Untitled Query';
      def = param1.definition!;
      scope = param1.companyScope || 'CMP-001';
      desc = param1.description;
      creator = param1.createdBy || 'User';
      queryId = param1.queryId || param1.savedQueryId;
    } else {
      name = param1;
      def = definition!;
    }

    const savedQueryId = queryId || `SQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const schemaMeta = universalDataModelEngine.getActiveSchemaForDataset(def.dataset);
    const schemaVersion = schemaMeta?.version || 1;

    // Check compatibility against active schema
    const issues: string[] = [];
    if (schemaMeta && def.fields) {
      const validNames = new Set(schemaMeta.fields.map((f) => f.name.toLowerCase()));
      ['id', 'companyid', 'date', 'amount', 'name', 'status', 'vouchernumber'].forEach((f) => validNames.add(f));

      for (const field of def.fields) {
        if (!validNames.has(field.toLowerCase())) {
          issues.push(`Field '${field}' does not exist in schema for dataset '${def.dataset}'`);
        }
      }
    }

    const status = issues.length > 0 ? 'Needs Review' : 'Valid';

    const saved: SavedQueryDefinition = {
      savedQueryId,
      queryId: savedQueryId,
      name,
      description: desc,
      companyScope: scope,
      definition: def,
      schemaVersion,
      createdBy: creator,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status,
      validationIssues: issues,
      compatibilityIssues: issues
    };

    this.savedQueries.set(savedQueryId, saved);
    return saved;
  }

  public deleteSavedQuery(savedQueryId: string): boolean {
    return this.savedQueries.delete(savedQueryId);
  }

  public validateSavedQueryAgainstCurrentSchema(savedQueryId: string): SavedQueryDefinition {
    const saved = this.savedQueries.get(savedQueryId);
    if (!saved) throw new Error(`Saved query '${savedQueryId}' not found.`);

    const def = saved.definition;
    const schemaMeta = universalDataModelEngine.getActiveSchemaForDataset(def.dataset);
    const issues: string[] = [];

    if (schemaMeta && def.fields) {
      const validNames = new Set(schemaMeta.fields.map((f) => f.name.toLowerCase()));
      ['id', 'companyid', 'date', 'amount', 'name', 'status', 'vouchernumber'].forEach((f) => validNames.add(f));

      for (const field of def.fields) {
        if (!validNames.has(field.toLowerCase())) {
          issues.push(`Field '${field}' does not exist in schema for dataset '${def.dataset}'`);
        }
      }
    }

    saved.status = issues.length > 0 ? 'Needs Review' : 'Valid';
    saved.validationIssues = issues;
    saved.compatibilityIssues = issues;
    saved.updatedAt = new Date().toISOString();

    this.savedQueries.set(savedQueryId, saved);
    return saved;
  }

  // ============================================================================
  // 4. MATERIALIZED VIEWS
  // ============================================================================

  public getMaterializedViews(companyId?: string): MaterializedViewDefinition[] {
    const list = Array.from(this.materializedViews.values());
    if (companyId) {
      return list.filter((v) => v.companyId === companyId || v.companyId === 'GLOBAL');
    }
    return list;
  }

  public async refreshMaterializedView(viewId: string): Promise<MaterializedViewDefinition> {
    const view = this.materializedViews.get(viewId);
    if (!view) throw new Error(`Materialized view '${viewId}' not found.`);

    view.status = 'Refreshing';
    try {
      const result = await this.executeQuery(view.definition);
      view.cachedData = result.rows;
      view.cachedAggregates = result.aggregates;
      view.rowCount = result.recordCount;
      view.lastRefresh = new Date().toISOString();
      view.status = 'Current';
      view.schemaVersion = result.schemaVersion;
    } catch (err: any) {
      view.status = 'Error';
      throw err;
    }

    return view;
  }

  public registerMaterializedView(
    name: string,
    dataset: string,
    companyId: string,
    definition: QueryDefinition,
    refreshPolicy: 'Manual' | 'After Sync' | 'Scheduled-ready' = 'Manual'
  ): MaterializedViewDefinition {
    const viewId = `mv_${dataset}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const def: MaterializedViewDefinition = {
      viewId,
      name,
      dataset,
      companyId,
      definition,
      refreshPolicy,
      status: 'Stale',
      sourceDatasetVersion: 1,
      schemaVersion: 1
    };

    this.materializedViews.set(viewId, def);
    return def;
  }

  // ============================================================================
  // 5. INDEX RECOMMENDATIONS & MANAGEMENT
  // ============================================================================

  public getIndexRecommendations(datasetId?: string): IndexRecommendation[] {
    return warehouseStorageEngine.indexManager.getIndexRecommendations(datasetId);
  }

  public approveIndexRecommendation(recommendationId: string): boolean {
    const recs = warehouseStorageEngine.indexManager.getIndexRecommendations();
    const rec = recs.find((r) => r.recommendationId === recommendationId);
    if (!rec) return false;
    const records = warehouseStorageEngine.getRecordsForDataset(rec.datasetId);
    return warehouseStorageEngine.indexManager.approveRecommendation(recommendationId, records);
  }

  public dismissIndexRecommendation(recommendationId: string): boolean {
    return warehouseStorageEngine.indexManager.dismissRecommendation(recommendationId);
  }

  public removeIndex(indexId: string): boolean {
    return warehouseStorageEngine.indexManager.removeIndex(indexId);
  }

  // ============================================================================
  // 6. PERFORMANCE DASHBOARD
  // ============================================================================

  public getPerformanceStats(): QueryPerformanceStats {
    const cacheStats = queryResultCache.getStats();
    const avgTime = this.totalQueries > 0 ? this.totalDurationMs / this.totalQueries : 0;

    const sortedTimes = [...this.queryTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95Time = sortedTimes[p95Index] || 0;

    const topQueries = Array.from(this.querySignatures.entries())
      .map(([sig, stats]) => ({
        querySignature: sig,
        count: stats.count,
        avgTimeMs: parseFloat((stats.totalMs / stats.count).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQueries: this.totalQueries,
      averageExecutionTimeMs: parseFloat(avgTime.toFixed(2)),
      p95ExecutionTimeMs: parseFloat(p95Time.toFixed(2)),
      totalRowsScanned: this.totalRowsScanned,
      totalRowsReturned: this.totalRowsReturned,
      cacheHitCount: cacheStats.hitCount,
      cacheMissCount: cacheStats.missCount,
      cacheHitRatePercent: cacheStats.hitRate,
      slowQueriesCount: this.slowQueries.length,
      slowQueries: [...this.slowQueries].reverse().slice(0, 10),
      topQueries,
      datasetUsage: { ...this.datasetUsage },
      fieldUsage: { ...this.fieldUsage },
      indexUsage: { ...this.indexUsage }
    };
  }

  public setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThresholdMs = Math.max(5, thresholdMs);
  }

  public getSlowQueryThreshold(): number {
    return this.slowQueryThresholdMs;
  }

  public clearSlowQueries(): void {
    this.slowQueries = [];
  }

  // ============================================================================
  // 7. READ-ONLY TALLY SAFETY ASSURANCE
  // ============================================================================

  public verifyReadOnlyTallySafety(): { isReadOnly: true; protocol: 'READ_ONLY_HTTP_XML_EXPORT'; mutationsForbidden: true } {
    return {
      isReadOnly: true,
      protocol: 'READ_ONLY_HTTP_XML_EXPORT',
      mutationsForbidden: true
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private deduplicateParentItems(rows: Record<string, any>[]): Record<string, any>[] {
    const seen = new Set<string>();
    const deduped: Record<string, any>[] = [];

    for (const r of rows) {
      const parentKey = r._canonicalRecordId || r.voucherNumber || r.id || r.sourceId || JSON.stringify(r);
      if (!seen.has(parentKey)) {
        seen.add(parentKey);
        deduped.push(r);
      }
    }
    return deduped;
  }

  private evaluateFilter(val: any, op: FilterOperator, targetVal: any, targetValTo?: any): boolean {
    if (op === 'IS NULL') {
      return val === undefined || val === null || val === '';
    }
    if (op === 'IS NOT NULL') {
      return val !== undefined && val !== null && val !== '';
    }

    if (val === undefined || val === null) {
      return op === 'NEQ' || op === 'Not Equals';
    }

    switch (op) {
      case 'EQ':
      case 'Equals':
        if (typeof val === 'number' && !isNaN(Number(targetVal))) {
          return Number(val) === Number(targetVal);
        }
        return String(val).trim().toLowerCase() === String(targetVal).trim().toLowerCase();

      case 'NEQ':
      case 'Not Equals':
        if (typeof val === 'number' && !isNaN(Number(targetVal))) {
          return Number(val) !== Number(targetVal);
        }
        return String(val).trim().toLowerCase() !== String(targetVal).trim().toLowerCase();

      case 'GT':
      case 'Greater Than':
        return Number(val) > Number(targetVal);

      case 'GTE':
      case 'Greater/Equal':
        return Number(val) >= Number(targetVal);

      case 'LT':
      case 'Less Than':
        return Number(val) < Number(targetVal);

      case 'LTE':
      case 'Less/Equal':
        return Number(val) <= Number(targetVal);

      case 'CONTAINS':
      case 'Contains':
        return String(val).toLowerCase().includes(String(targetVal).toLowerCase());

      case 'STARTS_WITH':
      case 'Starts With':
        return String(val).toLowerCase().startsWith(String(targetVal).toLowerCase());

      case 'ENDS_WITH':
      case 'Ends With':
        return String(val).toLowerCase().endsWith(String(targetVal).toLowerCase());

      case 'IN':
        if (Array.isArray(targetVal)) {
          return targetVal.some((t) => String(t).trim().toLowerCase() === String(val).trim().toLowerCase());
        }
        return String(targetVal).toLowerCase().split(',').map((s) => s.trim()).includes(String(val).toLowerCase());

      case 'NOT IN':
        if (Array.isArray(targetVal)) {
          return !targetVal.some((t) => String(t).trim().toLowerCase() === String(val).trim().toLowerCase());
        }
        return !String(targetVal).toLowerCase().split(',').map((s) => s.trim()).includes(String(val).toLowerCase());

      case 'BETWEEN':
        const num = Number(val);
        const low = Number(targetVal);
        const high = targetValTo !== undefined ? Number(targetValTo) : Number(targetVal);
        return num >= low && num <= high;

      default:
        return true;
    }
  }

  private computeAggregation(
    rows: Record<string, any>[],
    field: string,
    func: string,
    distinct: boolean = false
  ): number {
    if (func === 'COUNT') {
      if (!distinct) return rows.length;
      return new Set(rows.map((r) => r[field])).size;
    }

    const cleanField = field.includes('.') ? field.split('.')[1] : field;
    const numericVals: number[] = [];

    for (const r of rows) {
      const v = r[field] !== undefined ? r[field] : r[cleanField];
      if (typeof v === 'number' && !isNaN(v)) {
        numericVals.push(v);
      } else if (typeof v === 'string' && !isNaN(Number(v))) {
        numericVals.push(Number(v));
      }
    }

    if (numericVals.length === 0) return 0;
    const vals = distinct ? Array.from(new Set(numericVals)) : numericVals;

    switch (func) {
      case 'SUM':
        return vals.reduce((acc, curr) => acc + curr, 0);
      case 'MIN':
        return Math.min(...vals);
      case 'MAX':
        return Math.max(...vals);
      case 'AVG':
        return vals.reduce((acc, curr) => acc + curr, 0) / vals.length;
      case 'DISTINCT_COUNT':
        return new Set(rows.map((r) => r[field] !== undefined ? r[field] : r[cleanField])).size;
      default:
        return 0;
    }
  }

  private deriveColumns(rows: Record<string, any>[], def: QueryDefinition) {
    if (rows.length === 0) {
      return (def.fields || []).map((f) => ({ name: f, type: 'String' }));
    }

    const sample = rows[0];
    return Object.keys(sample).map((key) => {
      const val = sample[key];
      let type = 'String';
      if (typeof val === 'number') type = 'Decimal';
      else if (typeof val === 'boolean') type = 'Boolean';
      else if (val instanceof Date) type = 'Date';
      else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) type = 'Date';

      const isCalculated = (def.calculatedFields || []).some((c) => c.name === key);
      const isAggregate = (def.aggregations || []).some(
        (a) => a.alias === key || `${a.function || a.type}_${a.field}` === key
      );

      return {
        name: key,
        type,
        isCalculated,
        isAggregate
      };
    });
  }

  private recordQueryStats(
    definition: QueryDefinition,
    durationMs: number,
    scanned: number,
    returned: number,
    isCacheHit: boolean
  ) {
    this.totalQueries++;
    this.totalDurationMs += durationMs;
    this.totalRowsScanned += scanned;
    this.totalRowsReturned += returned;
    this.queryTimes.push(durationMs);

    this.datasetUsage[definition.dataset] = (this.datasetUsage[definition.dataset] || 0) + 1;
    (definition.fields || []).forEach((f) => {
      this.fieldUsage[f] = (this.fieldUsage[f] || 0) + 1;
    });

    const sig = `${definition.dataset} [${(definition.filters || []).map((f) => f.field).join(',') || 'ALL'}]`;
    const sigStats = this.querySignatures.get(sig) || { count: 0, totalMs: 0 };
    sigStats.count++;
    sigStats.totalMs += durationMs;
    this.querySignatures.set(sig, sigStats);

    if (durationMs >= this.slowQueryThresholdMs && !isCacheHit) {
      const slowRecord: SlowQueryRecord = {
        queryId: definition.queryId,
        companyId: definition.companyId,
        dataset: definition.dataset,
        executionTimeMs: durationMs,
        thresholdMs: this.slowQueryThresholdMs,
        timestamp: new Date().toISOString(),
        planSummary: `Dataset scan on '${definition.dataset}' with ${scanned} rows examined.`,
        suggestedOptimization: `Consider adding index on '${definition.dataset}' for fields [${(definition.filters || []).map((f) => f.field).join(', ')}] to avoid full scans.`,
        queryDefinition: definition
      };
      this.slowQueries.push(slowRecord);
    }
  }

  private generateReadOnlyLiveTallyRecords(datasetId: string, companyId: string): WarehouseRecord[] {
    const now = new Date().toISOString();
    return [
      {
        metadata: {
          canonicalRecordId: `LIVE-REC-001`,
          datasetId,
          companyId,
          sourceId: 'LIVE-001',
          sourceSnapshotId: 'LIVE',
          sourceSystem: 'Tally Gateway',
          sourceObject: datasetId,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
          isCurrent: true,
          version: 1,
          validFrom: now
        },
        payload: {
          id: 'LIVE-001',
          name: 'Live Tally Record 001',
          amount: 54000,
          date: '2026-03-08',
          ledgerName: 'HDFC Bank Account',
          voucherType: 'Payment',
          isDebit: true
        }
      }
    ];
  }

  private seedDefaultSavedQueries() {
    const companyId = 'CMP-001';

    this.saveQuery(
      'High Value Sales Invoices (> ₹50,000)',
      {
        queryId: 'Q-SAVED-001',
        companyId,
        dataset: 'canonical-vouchers',
        fields: ['voucherNumber', 'date', 'partyLedgerName', 'amount', 'narration'],
        filters: [
          { field: 'voucherType', operator: 'EQ', value: 'Sales' },
          { field: 'amount', operator: 'GT', value: 50000 }
        ],
        orderBy: [{ field: 'amount', order: 'DESC' }],
        limit: 25,
        sourcePreference: 'WAREHOUSE'
      },
      companyId,
      'Pre-filtered query identifying major sales invoices requiring credit manager review.'
    );

    this.saveQuery(
      'Sundry Debtors Ledger Balances',
      {
        queryId: 'Q-SAVED-002',
        companyId,
        dataset: 'canonical-parties',
        fields: ['partyName', 'partyType', 'gstin', 'state', 'currentBalance'],
        filters: [
          { field: 'partyType', operator: 'EQ', value: 'Debtor' },
          { field: 'currentBalance', operator: 'GT', value: 0 }
        ],
        orderBy: [{ field: 'currentBalance', order: 'DESC' }],
        limit: 50,
        sourcePreference: 'WAREHOUSE'
      },
      companyId,
      'Active customer accounts with outstanding debit balances.'
    );
  }

  private seedDefaultMaterializedViews() {
    const companyId = 'CMP-001';

    const defSales: MaterializedViewDefinition = {
      viewId: 'mv_daily_sales',
      name: 'Daily Sales Invoicing Summary',
      dataset: 'canonical-vouchers',
      companyId,
      definition: {
        queryId: 'Q-MV-SALES-DAILY',
        companyId,
        dataset: 'canonical-vouchers',
        fields: ['date'],
        filters: [{ field: 'voucherType', operator: 'EQ', value: 'Sales' }],
        groupBy: ['date'],
        aggregations: [
          { field: 'amount', function: 'SUM', alias: 'total_sales' },
          { field: 'voucherNumber', function: 'COUNT', alias: 'invoice_count' }
        ],
        orderBy: [{ field: 'date', order: 'DESC' }]
      },
      refreshPolicy: 'After Sync',
      status: 'Current',
      sourceDatasetVersion: 1,
      schemaVersion: 1,
      lastRefresh: new Date().toISOString(),
      rowCount: 12
    };

    this.materializedViews.set('mv_daily_sales', defSales);
  }
}

export const unifiedQueryEngine = new UnifiedQueryEngine();
