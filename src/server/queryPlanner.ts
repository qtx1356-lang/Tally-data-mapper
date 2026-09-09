/**
 * Phase 32G - Query Planner & Grain Safety Engine
 * Validates schemas, ensures company isolation, plans execution steps,
 * selects indexes, applies predicate/projection pushdown, and guards accounting grain.
 */

import crypto from 'crypto';
import {
  IQueryPlanner,
  QueryDefinition,
  QueryPlan,
  QueryPlanStep,
  GrainSafetyValidation,
  FilterOperator
} from '../types/phase32GQuery';
import { universalDataModelEngine } from './universalDataModelEngine';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { SafeExpressionEvaluator } from './safeExpressionEvaluator';
import { querySourceRouter } from './querySourceRouter';

export class QueryPlanner implements IQueryPlanner {
  /**
   * Comprehensive validation of QueryDefinition before execution or planning
   */
  public validateQuery(def: QueryDefinition): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Company Isolation Validation
    if (!def.companyId || typeof def.companyId !== 'string' || def.companyId.trim() === '') {
      errors.push('Company Isolation Violation: Query must explicitly specify a valid non-empty companyId.');
      return { isValid: false, errors, warnings };
    }

    // 2. Dataset Validation (Works with ANY discovered or dynamic dataset)
    if (!def.dataset || typeof def.dataset !== 'string') {
      errors.push('Dataset Validation Error: Query must specify a target dataset.');
      return { isValid: false, errors, warnings };
    }

    const schema = universalDataModelEngine.getActiveSchemaForDataset(def.dataset);
    const datasetMeta = universalDataModelEngine.getDatasetById(def.dataset, def.companyId);

    // If schema exists in registry, validate fields
    const validFieldNames = new Set<string>();
    const fieldTypeMap = new Map<string, string>();

    if (schema && schema.fields) {
      schema.fields.forEach((f) => {
        validFieldNames.add(f.name.toLowerCase());
        fieldTypeMap.set(f.name.toLowerCase(), f.type);
      });
      // Also standard canonical/metadata fields
      ['id', 'companyid', 'date', 'createdat', 'sourceid', 'amount', 'narration', 'name', 'status'].forEach((f) => {
        validFieldNames.add(f);
      });
    }

    // 3. Field Projection Validation
    if (def.fields && def.fields.length > 0 && validFieldNames.size > 0) {
      for (const field of def.fields) {
        // Skip calculated fields or join-prefixed fields in validation
        if (field.includes('.') || (def.calculatedFields && def.calculatedFields.some((c) => c.name === field))) {
          continue;
        }
        if (!validFieldNames.has(field.toLowerCase())) {
          errors.push(`Field Validation Error: Field '${field}' does not exist in dataset '${def.dataset}'.`);
        }
      }
    }

    // 4. Filter Validation & Operator Type Compatibility
    if (def.filters && def.filters.length > 0) {
      for (const filter of def.filters) {
        const cleanField = filter.field.includes('.') ? filter.field.split('.')[1] : filter.field;

        if (validFieldNames.size > 0 && !validFieldNames.has(cleanField.toLowerCase())) {
          errors.push(`Filter Validation Error: Field '${filter.field}' does not exist in dataset '${def.dataset}'.`);
        }

        const fieldType = fieldTypeMap.get(cleanField.toLowerCase());
        if (fieldType) {
          // Numeric operator validation
          if (['GT', 'GTE', 'LT', 'LTE', 'BETWEEN'].includes(filter.operator)) {
            if (fieldType !== 'Integer' && fieldType !== 'Decimal' && fieldType !== 'Date') {
              warnings.push(`Type Warning: Operator '${filter.operator}' applied to non-numeric field '${filter.field}' (${fieldType}).`);
            }
          }
          // String operator validation
          if (['CONTAINS', 'STARTS_WITH', 'ENDS_WITH'].includes(filter.operator)) {
            if (fieldType !== 'String' && fieldType !== 'Text') {
              warnings.push(`Type Warning: String operator '${filter.operator}' applied to non-string field '${filter.field}' (${fieldType}).`);
            }
          }
        }
      }
    }

    // 5. Join Validation (Must use registered relationship evidence)
    if (def.joins && def.joins.length > 0) {
      const allowedTargetDatasets = new Set(
        universalDataModelEngine.getAllDatasets(def.companyId).map((d) => d.datasetId)
      );

      for (const join of def.joins) {
        if (!allowedTargetDatasets.has(join.targetDataset)) {
          // Check if dataset exists anywhere in schemas
          const targetSchema = universalDataModelEngine.getActiveSchemaForDataset(join.targetDataset);
          if (!targetSchema) {
            errors.push(`Join Validation Error: Target dataset '${join.targetDataset}' is not registered.`);
          }
        }

        // Verify relationship evidence in registered schema
        if (schema && schema.relationships) {
          const matchingRel = schema.relationships.find(
            (r) => r.targetDatasetId === join.targetDataset || r.targetDatasetId.includes(join.targetDataset)
          );
          if (!matchingRel && !this.isKnownSemanticJoin(def.dataset, join.targetDataset)) {
            warnings.push(
              `Join Safety Warning: Join between '${def.dataset}' and '${join.targetDataset}' lacks formal relationship evidence in Schema Registry.`
            );
          }
        }
      }
    }

    // 6. Calculated Fields AST Validation
    if (def.calculatedFields && def.calculatedFields.length > 0) {
      for (const calc of def.calculatedFields) {
        const validation = SafeExpressionEvaluator.validate(calc.expression);
        if (!validation.isValid) {
          errors.push(`Calculated Field Error in '${calc.name}': ${validation.error}`);
        }
      }
    }

    // 7. Aggregations Validation
    if (def.aggregations && def.aggregations.length > 0) {
      for (const agg of def.aggregations) {
        if (!agg.alias || agg.alias.trim() === '') {
          errors.push(`Aggregation Error: Aggregation on '${agg.field}' must have a non-empty alias.`);
        }
        if (['SUM', 'AVG'].includes(agg.function)) {
          const cleanField = agg.field.includes('.') ? agg.field.split('.')[1] : agg.field;
          const fieldType = fieldTypeMap.get(cleanField.toLowerCase());
          if (fieldType && fieldType !== 'Integer' && fieldType !== 'Decimal') {
            warnings.push(`Aggregation Type Warning: Mathematical function '${agg.function}' on non-numeric field '${agg.field}' (${fieldType}).`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate an execution plan for a query definition
   */
  public async createPlan(def: QueryDefinition): Promise<QueryPlan> {
    const planId = `plan_${crypto.randomBytes(6).toString('hex')}`;
    const routing = querySourceRouter.routeSource(def);
    const schema = universalDataModelEngine.getActiveSchemaForDataset(def.dataset);
    const primaryGrain = schema?.grain || 'Record';

    const steps: QueryPlanStep[] = [];
    let stepCount = 1;
    let estimatedCost = 10;

    // Step 1: Storage Scan & Predicate Pushdown
    const pushdownFilters: { field: string; operator: FilterOperator; pushdown: boolean }[] = [];
    const indexesUsed: { indexId: string; fields: string[]; reason: string }[] = [];

    // Check available indexes in warehouse
    const indexDefs = warehouseStorageEngine.indexManager.getIndexStatus(def.companyId);

    if (def.filters && def.filters.length > 0) {
      for (const f of def.filters) {
        // Can this filter use an index?
        const matchingIdx = indexDefs.find(
          (idx) => idx.datasetId === def.dataset && idx.fields.includes(f.field)
        );

        if (matchingIdx && ['EQ', 'IN'].includes(f.operator)) {
          indexesUsed.push({
            indexId: matchingIdx.indexId,
            fields: matchingIdx.fields,
            reason: `Direct index lookup on filter '${f.field}'`
          });
          pushdownFilters.push({ field: f.field, operator: f.operator, pushdown: true });
        } else {
          pushdownFilters.push({ field: f.field, operator: f.operator, pushdown: true });
        }
      }
    }

    steps.push({
      stepNumber: stepCount++,
      operation: indexesUsed.length > 0 ? 'IndexScan' : 'StorageScan',
      target: def.dataset,
      details: indexesUsed.length > 0
        ? `Scan using index(es) ${indexesUsed.map((i) => i.indexId).join(', ')} with company isolation [${def.companyId}]`
        : `Scan dataset '${def.dataset}' with predicate pushdown filters [${pushdownFilters.map((f) => f.field).join(', ')}]`,
      costEstimate: indexesUsed.length > 0 ? 5 : 20,
      pushdown: true
    });

    // Step 2: Projection Pushdown
    if (def.fields && def.fields.length > 0) {
      steps.push({
        stepNumber: stepCount++,
        operation: 'ProjectionPushdown',
        target: def.dataset,
        details: `Retrieve only requested columns: [${def.fields.join(', ')}]`,
        costEstimate: 2,
        pushdown: true
      });
    }

    // Step 3: Joins Planned & Grain Safety
    const joinsPlanned: QueryPlan['joinsPlanned'] = [];
    let hasOneToMany = false;
    let hasManyToMany = false;
    const joinedDatasets: string[] = [];

    if (def.joins && def.joins.length > 0) {
      for (const j of def.joins) {
        joinedDatasets.push(j.targetDataset);
        const card = j.cardinality || this.detectCardinality(def.dataset, j.targetDataset);
        if (card === '1:N') hasOneToMany = true;
        if (card === 'N:M') hasManyToMany = true;

        const grainSafe = !hasManyToMany && (!hasOneToMany || j.allowFanout === true);

        joinsPlanned.push({
          targetDataset: j.targetDataset,
          on: `${def.dataset}.${j.sourceField} = ${j.targetDataset}.${j.targetField}`,
          joinType: j.joinType,
          cardinality: card,
          grainSafe
        });

        steps.push({
          stepNumber: stepCount++,
          operation: 'HashJoin',
          target: j.targetDataset,
          details: `${j.joinType} JOIN '${j.targetDataset}' ON ${j.sourceField}=${j.targetField} (Cardinality: ${card})`,
          costEstimate: card === '1:1' ? 10 : 25,
          pushdown: false
        });
      }
    }

    // Step 4: Accounting Grain Safety Validation
    const affectedAggregations: string[] = [];
    let grainWarning: string | undefined = undefined;
    let grainAction: GrainSafetyValidation['actionTaken'] = 'Pass';

    if (hasOneToMany && def.aggregations && def.aggregations.length > 0) {
      for (const agg of def.aggregations) {
        // If aggregating a primary voucher/parent field across 1:N lines
        const isParentField = !agg.field.includes('.') || agg.field.startsWith(def.dataset + '.');
        if (isParentField && ['SUM', 'AVG'].includes(agg.function)) {
          affectedAggregations.push(agg.alias || agg.field);
          grainWarning = `Accounting Grain Conflict: Summing parent field '${agg.field}' across a 1:N join would double-count values. Automatic deduplicated parent aggregation enabled.`;
          grainAction = 'DeduplicatedParentAggregation';
        }
      }
    }

    if (hasManyToMany) {
      grainWarning = `Many-to-Many Safety Alert: N:M join detected without explicit aggregation grouping. Cartesian product risk mitigated.`;
      grainAction = 'WarningAttached';
    }

    const grainSafety: GrainSafetyValidation = {
      isSafe: !hasManyToMany || def.joins?.every((j) => j.allowFanout === true) || false,
      primaryDatasetGrain: primaryGrain,
      hasOneToManyJoin: hasOneToMany,
      hasManyToManyJoin: hasManyToMany,
      affectedAggregations,
      warning: grainWarning,
      actionTaken: grainAction
    };

    // Step 5: Calculated Fields
    const calculatedFieldsPlanned: QueryPlan['calculatedFieldsPlanned'] = [];
    if (def.calculatedFields && def.calculatedFields.length > 0) {
      for (const calc of def.calculatedFields) {
        const val = SafeExpressionEvaluator.validate(calc.expression);
        calculatedFieldsPlanned.push({
          name: calc.name,
          expression: calc.expression,
          astValid: val.isValid
        });

        steps.push({
          stepNumber: stepCount++,
          operation: 'EvaluateCalculatedField',
          target: calc.name,
          details: `Evaluate safe AST '${calc.expression}' as column '${calc.name}'`,
          costEstimate: 5,
          pushdown: false
        });
      }
    }

    // Step 6: Group By & Aggregation Pushdown
    const aggregationsPlanned: QueryPlan['aggregationsPlanned'] = [];
    if (def.aggregations && def.aggregations.length > 0) {
      for (const agg of def.aggregations) {
        aggregationsPlanned.push({
          field: agg.field,
          function: agg.function,
          alias: agg.alias,
          pushdown: def.joins ? false : true
        });

        steps.push({
          stepNumber: stepCount++,
          operation: 'Aggregate',
          target: agg.alias,
          details: `${agg.function}(${agg.field}) AS ${agg.alias}${def.groupBy ? ` GROUP BY [${def.groupBy.join(', ')}]` : ''}`,
          costEstimate: 15,
          pushdown: def.joins ? false : true
        });
      }
    }

    // Step 7: Order By & Pagination
    if (def.orderBy && def.orderBy.length > 0) {
      steps.push({
        stepNumber: stepCount++,
        operation: 'Sort',
        target: 'ResultSet',
        details: `Sort by ${def.orderBy.map((o) => `${o.field} ${o.order}`).join(', ')}`,
        costEstimate: 8,
        pushdown: false
      });
    }

    if (def.limit !== undefined || def.offset !== undefined) {
      steps.push({
        stepNumber: stepCount++,
        operation: 'Paginate',
        target: 'ResultSet',
        details: `Limit: ${def.limit ?? 50}, Offset: ${def.offset ?? 0}`,
        costEstimate: 1,
        pushdown: true
      });
    }

    // Generate Human-Readable Explanation
    const explanation: string[] = [
      `1. Source Selection: Route query to [${routing.primarySource}] with Company Isolation enforced for '${def.companyId}'.`,
      `2. Storage Scan: Scan primary dataset '${def.dataset}' (${primaryGrain} grain). Pushed down ${pushdownFilters.length} filter predicates.`,
      indexesUsed.length > 0
        ? `3. Index Utilization: Leveraging index ${indexesUsed.map((i) => i.indexId).join(', ')} to prune scan candidates.`
        : `3. Index Scan: No composite index found; executing filtered in-memory dataset scan.`,
      joinsPlanned.length > 0
        ? `4. Joins: Joining ${joinsPlanned.map((j) => `${j.targetDataset} (${j.cardinality})`).join(', ')}. Grain safety: ${grainSafety.actionTaken}.`
        : `4. Joins: Single dataset query without join overhead.`,
      calculatedFieldsPlanned.length > 0
        ? `5. Calculations: Computing ${calculatedFieldsPlanned.length} safe AST expressions (${calculatedFieldsPlanned.map((c) => c.name).join(', ')}).`
        : `5. Calculations: None requested.`,
      aggregationsPlanned.length > 0
        ? `6. Aggregations: Aggregating [${aggregationsPlanned.map((a) => `${a.function}(${a.field})`).join(', ')}]${def.groupBy ? ` grouped by [${def.groupBy.join(', ')}]` : ''}.`
        : `6. Aggregations: Returning record-level rows.`,
      `7. Materialization: Applying projection, sorting, and pagination (Limit: ${def.limit ?? 50}).`
    ];

    estimatedCost = steps.reduce((acc, s) => acc + s.costEstimate, 0);

    return {
      planId,
      queryId: def.queryId,
      source: routing.primarySource,
      primaryDataset: def.dataset,
      primaryDatasetGrain: primaryGrain,
      joinedDatasets,
      indexesUsed,
      filtersApplied: pushdownFilters,
      joinsPlanned,
      aggregationsPlanned,
      calculatedFieldsPlanned,
      estimatedRows: 500,
      estimatedCost,
      executionSteps: steps,
      grainSafety,
      humanReadableExplanation: explanation,
      createdAt: new Date().toISOString()
    };
  }

  private isKnownSemanticJoin(sourceDataset: string, targetDataset: string): boolean {
    const pairs = [
      ['canonical-groups', 'canonical-ledgers'],
      ['canonical-ledgers', 'canonical-vouchers'],
      ['canonical-vouchers', 'canonical-voucher-lines'],
      ['canonical-voucher-lines', 'canonical-stock-items'],
      ['canonical-voucher-lines', 'canonical-parties'],
      ['canonical-voucher-lines', 'canonical-tax-transactions'],
      ['canonical-voucher-lines', 'canonical-cost-centres'],
      ['canonical-inventory-movements', 'canonical-stock-items'],
      ['canonical-inventory-movements', 'canonical-godowns']
    ];

    return pairs.some(
      ([a, b]) =>
        (sourceDataset.includes(a) && targetDataset.includes(b)) ||
        (sourceDataset.includes(b) && targetDataset.includes(a))
    );
  }

  private detectCardinality(sourceDataset: string, targetDataset: string): '1:1' | '1:N' | 'N:1' | 'N:M' {
    if (sourceDataset.includes('voucher') && targetDataset.includes('voucher-lines')) {
      return '1:N';
    }
    if (sourceDataset.includes('group') && targetDataset.includes('ledger')) {
      return '1:N';
    }
    if (sourceDataset.includes('ledger') && targetDataset.includes('group')) {
      return 'N:1';
    }
    if (sourceDataset.includes('voucher-line') && (targetDataset.includes('stock') || targetDataset.includes('party'))) {
      return 'N:1';
    }
    return '1:1';
  }
}

export const queryPlanner = new QueryPlanner();
