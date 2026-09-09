/**
 * Phase 32D - Warehouse Index Management Engine
 * High-performance composite and single-column in-memory indices for local warehouse queries
 */

import {
  IWarehouseIndexManager,
  WarehouseIndexDefinition,
  WarehouseRecord
} from '../types/phase32DWarehouse';
import { IndexRecommendation } from '../types/phase32GQuery';

export class WarehouseIndexEngine implements IWarehouseIndexManager {
  private indexDefinitions: Map<string, WarehouseIndexDefinition> = new Map();
  // Map indexId -> Map<indexedValue, Set<canonicalRecordId>>
  private indexBuckets: Map<string, Map<string, Set<string>>> = new Map();

  // Index usage and pattern tracking for recommendations
  private recommendations: Map<string, IndexRecommendation> = new Map();
  private queryPatterns: Map<string, { filterCount: number; joinCount: number; sortCount: number }> = new Map();

  constructor() {
    this.registerDefaultIndexes();
  }

  private registerDefaultIndexes() {
    // Vouchers indexes
    this.createIndex('canonical-vouchers', ['companyId', 'sourceId'], true);
    this.createIndex('canonical-vouchers', ['companyId', 'date'], false);
    this.createIndex('canonical-vouchers', ['companyId', 'partyLedgerId'], false);
    this.createIndex('canonical-vouchers', ['companyId', 'voucherType'], false);

    // Voucher lines indexes
    this.createIndex('canonical-voucher-lines', ['companyId', 'voucherId'], false);
    this.createIndex('canonical-voucher-lines', ['companyId', 'ledgerId'], false);

    // Master / Dimension indexes
    this.createIndex('canonical-ledgers', ['companyId', 'sourceId'], true);
    this.createIndex('canonical-ledgers', ['companyId', 'parentGroupId'], false);
    this.createIndex('canonical-parties', ['companyId', 'sourceId'], true);
    this.createIndex('canonical-parties', ['companyId', 'gstin'], false);
    this.createIndex('canonical-groups', ['companyId', 'sourceId'], true);

    // Inventory indexes
    this.createIndex('canonical-stock-items', ['companyId', 'sourceId'], true);
    this.createIndex('canonical-stock-items', ['companyId', 'stockGroupId'], false);
    this.createIndex('canonical-inventory-movements', ['companyId', 'stockItemId'], false);
    this.createIndex('canonical-inventory-movements', ['companyId', 'godownId'], false);
    this.createIndex('canonical-inventory-movements', ['companyId', 'date'], false);

    // Tax & Cost Centre indexes
    this.createIndex('canonical-tax-transactions', ['companyId', 'taxEntityId'], false);
    this.createIndex('canonical-tax-transactions', ['companyId', 'voucherId'], false);
    this.createIndex('canonical-cost-centres', ['companyId', 'sourceId'], true);

    // Payroll & Banking indexes
    this.createIndex('canonical-employees', ['companyId', 'sourceId'], true);
    this.createIndex('canonical-payroll-transactions', ['companyId', 'employeeId'], false);
    this.createIndex('canonical-bank-accounts', ['companyId', 'sourceId'], true);
    this.createIndex('canonical-bank-transactions', ['companyId', 'bankAccountId'], false);
    this.createIndex('canonical-bank-transactions', ['companyId', 'date'], false);
  }

  /**
   * Helper to build a composite index key from a record
   */
  private buildIndexKey(record: WarehouseRecord, fields: string[]): string {
    const parts = fields.map((f) => {
      // Check payload first, then metadata
      const val = record.payload[f] !== undefined ? record.payload[f] : (record.metadata as any)[f];
      return val !== undefined && val !== null ? String(val).trim().toLowerCase() : '__NULL__';
    });
    return parts.join(':::');
  }

  public createIndex(
    datasetId: string,
    fields: string[],
    isUnique: boolean = false
  ): WarehouseIndexDefinition {
    const isComposite = fields.length > 1;
    const indexId = `idx_${datasetId}_${fields.join('_')}`;

    const def: WarehouseIndexDefinition = {
      indexId,
      datasetId,
      fields,
      isComposite,
      isUnique,
      sizeBytes: 0,
      itemCount: 0,
      lastRebuiltAt: new Date().toISOString(),
      status: 'Ready',
      usageCount: 0,
      buildTimeMs: 0
    };

    this.indexDefinitions.set(indexId, def);
    if (!this.indexBuckets.has(indexId)) {
      this.indexBuckets.set(indexId, new Map());
    }

    return def;
  }

  /**
   * Indexes a single warehouse record into all applicable registered indexes
   */
  public indexRecord(record: WarehouseRecord): void {
    const datasetId = record.metadata.datasetId;

    for (const [indexId, def] of this.indexDefinitions.entries()) {
      if (def.datasetId !== datasetId) continue;

      let buckets = this.indexBuckets.get(indexId);
      if (!buckets) {
        buckets = new Map();
        this.indexBuckets.set(indexId, buckets);
      }

      const key = this.buildIndexKey(record, def.fields);
      let recordSet = buckets.get(key);
      if (!recordSet) {
        recordSet = new Set();
        buckets.set(key, recordSet);
      }

      recordSet.add(record.metadata.canonicalRecordId);
      def.itemCount = buckets.size;
      def.sizeBytes = buckets.size * 64; // Approximate in-memory bytes
    }
  }

  /**
   * Remove a record from index buckets when deleted or updated
   */
  public unindexRecord(record: WarehouseRecord): void {
    const datasetId = record.metadata.datasetId;

    for (const [indexId, def] of this.indexDefinitions.entries()) {
      if (def.datasetId !== datasetId) continue;

      const buckets = this.indexBuckets.get(indexId);
      if (!buckets) continue;

      const key = this.buildIndexKey(record, def.fields);
      const recordSet = buckets.get(key);
      if (recordSet) {
        recordSet.delete(record.metadata.canonicalRecordId);
        if (recordSet.size === 0) {
          buckets.delete(key);
        }
      }
      def.itemCount = buckets.size;
      def.sizeBytes = buckets.size * 64;
    }
  }

  /**
   * Find candidate record IDs matching exact field values using indexes
   */
  public findRecordIds(
    datasetId: string,
    fieldValues: Record<string, any>
  ): Set<string> | null {
    // Look for matching index
    const keys = Object.keys(fieldValues);
    for (const [indexId, def] of this.indexDefinitions.entries()) {
      if (def.datasetId !== datasetId) continue;

      // Check if all def.fields are present in fieldValues
      const isExactMatch =
        def.fields.length === keys.length &&
        def.fields.every((f) => keys.includes(f));

      if (isExactMatch) {
        const buckets = this.indexBuckets.get(indexId);
        if (!buckets) return new Set();

        const searchKeyParts = def.fields.map((f) => {
          const val = fieldValues[f];
          return val !== undefined && val !== null ? String(val).trim().toLowerCase() : '__NULL__';
        });
        const searchKey = searchKeyParts.join(':::');

        const matched = buckets.get(searchKey);
        def.usageCount = (def.usageCount || 0) + 1;
        def.lastUsedAt = new Date().toISOString();
        return matched ? new Set(matched) : new Set();
      }
    }

    return null; // No applicable index found
  }

  /**
   * Rebuild an index against a dataset's records
   */
  public async rebuildIndex(indexId: string, records?: WarehouseRecord[]): Promise<boolean> {
    const startTime = Date.now();
    const def = this.indexDefinitions.get(indexId);
    if (!def) return false;

    def.status = 'Rebuilding';
    const buckets = new Map<string, Set<string>>();
    this.indexBuckets.set(indexId, buckets);

    if (records) {
      for (const rec of records) {
        if (rec.metadata.datasetId !== def.datasetId) continue;
        const key = this.buildIndexKey(rec, def.fields);
        let recordSet = buckets.get(key);
        if (!recordSet) {
          recordSet = new Set();
          buckets.set(key, recordSet);
        }
        recordSet.add(rec.metadata.canonicalRecordId);
      }
    }

    def.itemCount = buckets.size;
    def.sizeBytes = buckets.size * 64;
    def.buildTimeMs = Date.now() - startTime;
    def.lastRebuiltAt = new Date().toISOString();
    def.status = 'Ready';
    return true;
  }

  public async rebuildAllIndexes(
    companyId?: string,
    allRecords?: WarehouseRecord[]
  ): Promise<{ rebuiltCount: number; totalDurationMs: number }> {
    const startTime = Date.now();
    let count = 0;

    for (const [indexId] of this.indexDefinitions.entries()) {
      const recordsToUse = companyId && allRecords
        ? allRecords.filter((r) => r.metadata.companyId === companyId)
        : allRecords;
      await this.rebuildIndex(indexId, recordsToUse);
      count++;
    }

    return {
      rebuiltCount: count,
      totalDurationMs: Date.now() - startTime
    };
  }

  public getIndexStatus(companyId?: string): WarehouseIndexDefinition[] {
    const list = Array.from(this.indexDefinitions.values());
    if (companyId) {
      return list.filter((idx) => !idx.companyId || idx.companyId === companyId);
    }
    return list;
  }

  /**
   * Remove an index
   */
  public removeIndex(indexId: string): boolean {
    if (!this.indexDefinitions.has(indexId)) return false;
    this.indexDefinitions.delete(indexId);
    this.indexBuckets.delete(indexId);
    return true;
  }

  /**
   * Track query filter, join, and sort patterns to generate intelligent index recommendations
   */
  public trackQueryPattern(
    datasetId: string,
    filteredFields: string[],
    joinedFields: string[],
    sortedFields: string[]
  ): void {
    const allFields = Array.from(new Set([...filteredFields, ...joinedFields, ...sortedFields]));
    for (const field of allFields) {
      const key = `${datasetId}:::${field}`;
      const existing = this.queryPatterns.get(key) || { filterCount: 0, joinCount: 0, sortCount: 0 };
      if (filteredFields.includes(field)) existing.filterCount++;
      if (joinedFields.includes(field)) existing.joinCount++;
      if (sortedFields.includes(field)) existing.sortCount++;
      this.queryPatterns.set(key, existing);

      // Check if an index already exists covering this field
      const hasIndex = Array.from(this.indexDefinitions.values()).some(
        (idx) => idx.datasetId === datasetId && idx.fields.includes(field)
      );

      const totalFrequency = existing.filterCount + existing.joinCount + existing.sortCount;
      if (!hasIndex && totalFrequency >= 2) {
        const recId = `rec_${datasetId}_${field}`;
        const priority: 'HIGH' | 'MEDIUM' | 'LOW' =
          totalFrequency >= 5 ? 'HIGH' : totalFrequency >= 3 ? 'MEDIUM' : 'LOW';

        const estimatedSavings = Math.min(85, 30 + totalFrequency * 10);

        this.recommendations.set(recId, {
          recommendationId: recId,
          datasetId,
          fields: [field],
          reason: `High query frequency detected: field '${field}' was filtered ${existing.filterCount}x, joined ${existing.joinCount}x, and sorted ${existing.sortCount}x without an index.`,
          priority,
          filterFrequency: existing.filterCount,
          joinFrequency: existing.joinCount,
          sortFrequency: existing.sortCount,
          estimatedQueryCostSavingsPercent: estimatedSavings,
          status: 'RECOMMENDED',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  public getIndexRecommendations(datasetId?: string): IndexRecommendation[] {
    const list = Array.from(this.recommendations.values());
    if (datasetId) {
      return list.filter((r) => r.datasetId === datasetId);
    }
    return list.sort((a, b) => {
      const prioWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return prioWeight[b.priority] - prioWeight[a.priority];
    });
  }

  public getRecommendations(datasetId?: string): IndexRecommendation[] {
    return this.getIndexRecommendations(datasetId);
  }

  public approveRecommendation(recommendationId: string, records?: WarehouseRecord[]): boolean {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return false;

    this.createIndex(rec.datasetId, rec.fields, false);
    const indexId = `idx_${rec.datasetId}_${rec.fields.join('_')}`;
    if (records) {
      this.rebuildIndex(indexId, records);
    }

    rec.status = 'CREATED';
    return true;
  }

  public dismissRecommendation(recommendationId: string): boolean {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return false;
    rec.status = 'DISMISSED';
    return true;
  }
}
