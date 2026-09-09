/**
 * Phase 32G - Query Result Cache Engine
 * High-performance deterministic in-memory analytical cache with fine-grained invalidation.
 */

import crypto from 'crypto';
import {
  IQueryResultCache,
  QueryDefinition,
  QueryResult
} from '../types/phase32GQuery';

interface CacheEntry {
  key: string;
  companyId: string;
  datasetId: string;
  snapshotId?: string;
  schemaVersion: number;
  datasetVersion: number;
  transformationVersion: number;
  result: QueryResult;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
}

export class QueryResultCache implements IQueryResultCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTtlMs: number = 5 * 60 * 1000; // 5 minutes default
  private hits: number = 0;
  private misses: number = 0;
  private maxEntries: number = 500;

  constructor(defaultTtlMs?: number, maxEntries?: number) {
    if (defaultTtlMs) this.defaultTtlMs = defaultTtlMs;
    if (maxEntries) this.maxEntries = maxEntries;
  }

  /**
   * Deterministic cache key generation accounting for:
   * Company, Query Definition, Schema Version, Dataset Version, Snapshot, Transformation Version
   */
  public generateCacheKey(
    def: QueryDefinition,
    schemaVersion: number = 1,
    datasetVersion: number = 1,
    transformationVersion: number = 1
  ): string {
    const payload = {
      companyId: def.companyId,
      dataset: def.dataset,
      fields: def.fields ? [...def.fields].sort() : [],
      filters: def.filters
        ? def.filters.map((f) => `${f.field}:${f.operator}:${JSON.stringify(f.value)}:${JSON.stringify(f.valueTo)}`).sort()
        : [],
      joins: def.joins
        ? def.joins.map((j) => `${j.targetDataset}:${j.joinType}:${j.sourceField}:${j.targetField}`).sort()
        : [],
      groupBy: def.groupBy ? [...def.groupBy].sort() : [],
      orderBy: def.orderBy ? def.orderBy.map((o) => `${o.field}:${o.order}`) : [],
      aggregations: def.aggregations
        ? def.aggregations.map((a) => `${a.field}:${a.function}:${a.alias}:${a.distinct}`).sort()
        : [],
      calculatedFields: def.calculatedFields
        ? def.calculatedFields.map((c) => `${c.name}:${c.expression}`).sort()
        : [],
      limit: def.limit,
      offset: def.offset,
      sourcePreference: def.sourcePreference || 'WAREHOUSE',
      snapshotId: def.snapshotId || 'NO_SNAP',
      schemaVersion,
      datasetVersion,
      transformationVersion
    };

    const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').substring(0, 24);
    return `qcache_${def.companyId}_${def.dataset}_${hash}`;
  }

  public get(cacheKey: string): QueryResult | undefined {
    const entry = this.cache.get(cacheKey);
    const now = Date.now();

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.misses++;
      return undefined;
    }

    this.hits++;
    entry.accessCount++;

    // Mark source as cached warehouse or cached snapshot
    const cachedResult: QueryResult = {
      ...entry.result,
      source: entry.snapshotId ? 'CACHED_SNAPSHOT' : 'CACHED_WAREHOUSE',
      warnings: [
        ...entry.result.warnings.filter((w) => !w.startsWith('Cache Served')),
        `Cache Served: Analytical result retrieved from memory cache (${new Date(entry.createdAt).toLocaleTimeString()}).`
      ]
    };

    return cachedResult;
  }

  public set(
    cacheKey: string,
    result: QueryResult,
    ttlMs?: number,
    metadata?: {
      datasetId: string;
      snapshotId?: string;
      schemaVersion?: number;
      datasetVersion?: number;
      transformationVersion?: number;
    }
  ): void {
    // Evict oldest if cache limit reached
    if (this.cache.size >= this.maxEntries) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.cache.entries()) {
        if (v.createdAt < oldestTime) {
          oldestTime = v.createdAt;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const now = Date.now();
    const entry: CacheEntry = {
      key: cacheKey,
      companyId: result.companyId,
      datasetId: metadata?.datasetId || result.lineageReference.datasetId,
      snapshotId: metadata?.snapshotId || result.snapshotId,
      schemaVersion: metadata?.schemaVersion || result.schemaVersion || 1,
      datasetVersion: metadata?.datasetVersion || 1,
      transformationVersion: metadata?.transformationVersion || 1,
      result,
      expiresAt: now + (ttlMs || this.defaultTtlMs),
      createdAt: now,
      accessCount: 1
    };

    this.cache.set(cacheKey, entry);
  }

  public invalidateDataset(datasetId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.datasetId === datasetId) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateForDataset(datasetId: string, companyId?: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.datasetId === datasetId && (!companyId || entry.companyId === companyId)) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateForSchema(datasetId: string): void {
    this.invalidateDataset(datasetId);
  }

  public clear(): void {
    this.cache.clear();
  }

  public invalidateCompany(companyId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.companyId === companyId) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateSnapshot(snapshotId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.snapshotId === snapshotId) {
        this.cache.delete(key);
      }
    }
  }

  public invalidateAll(): void {
    this.cache.clear();
  }

  public getStats(): {
    hitCount: number;
    missCount: number;
    keyCount: number;
    hitRate: number;
    entries: number;
    hits: number;
    misses: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 0;
    return {
      hitCount: this.hits,
      missCount: this.misses,
      keyCount: this.cache.size,
      hitRate,
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses
    };
  }
}

export const queryResultCache = new QueryResultCache();
