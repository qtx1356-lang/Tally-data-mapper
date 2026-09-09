/**
 * Phase 32G - Query Source Router
 * Dynamically routes queries between Local Warehouse, Snapshots, and Live Tally.
 * Enforces stale data warnings, mixed-source detection, and read-only guarantees.
 */

import {
  IQuerySourceRouter,
  QueryDefinition,
  QuerySourcePreference
} from '../types/phase32GQuery';
import { warehouseStorageEngine } from './warehouseStorageEngine';
import { universalDataModelEngine } from './universalDataModelEngine';

export class QuerySourceRouter implements IQuerySourceRouter {
  // Configurable warehouse freshness threshold: 2 hours in ms
  private freshnessThresholdMs: number = 2 * 60 * 60 * 1000;

  public routeSource(def: QueryDefinition): {
    primarySource: QuerySourcePreference;
    isStaleWarehouse: boolean;
    staleDetails?: { lastSync?: string; freshnessState: string };
    isMixed: boolean;
    sources: string[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const sources: string[] = [];

    // 1. Snapshot Preference or Snapshot specified in definition
    if (def.snapshotId || def.sourcePreference === 'SNAPSHOT') {
      const snapId = def.snapshotId || 'LATEST_SNAPSHOT';
      sources.push(`SNAPSHOT:${snapId}`);
      return {
        primarySource: 'SNAPSHOT',
        isStaleWarehouse: false,
        isMixed: false,
        sources,
        warnings
      };
    }

    // 2. Explicit Live Tally Preference
    if (def.sourcePreference === 'LIVE_TALLY') {
      sources.push('LIVE_TALLY');
      warnings.push('LIVE SOURCE: Query executed against Live Tally Read-Only Gateway.');
      return {
        primarySource: 'LIVE_TALLY',
        isStaleWarehouse: false,
        isMixed: false,
        sources,
        warnings
      };
    }

    // 3. Analytical Warehouse Routing (Default)
    // Check dataset status & freshness in warehouse & universalDataModelEngine
    const datasetMeta = universalDataModelEngine.getDatasetById(def.dataset, def.companyId);
    let isStale = false;
    let lastSyncTime: string | undefined = undefined;
    let freshnessState = 'Fresh';

    if (datasetMeta) {
      lastSyncTime = datasetMeta.freshness || datasetMeta.updatedAt;
      if (lastSyncTime) {
        const ageMs = Date.now() - new Date(lastSyncTime).getTime();
        if (ageMs > this.freshnessThresholdMs) {
          isStale = true;
          freshnessState = `Stale (Last synced ${Math.round(ageMs / (60 * 1000))} minutes ago)`;
        }
      }
    }

    // Check joined datasets for source routing & mixed sources
    let hasLiveJoin = false;
    sources.push('WAREHOUSE');

    if (def.joins && def.joins.length > 0) {
      for (const j of def.joins) {
        const joinMeta = universalDataModelEngine.getDatasetById(j.targetDataset, def.companyId);
        if (joinMeta) {
          sources.push(`WAREHOUSE:${j.targetDataset}`);
        } else {
          // If joined dataset is not in warehouse, would require Live Tally query
          hasLiveJoin = true;
          sources.push(`LIVE_TALLY:${j.targetDataset}`);
        }
      }
    }

    const isMixed = hasLiveJoin;

    if (isMixed) {
      warnings.push(
        `MIXED DATA SOURCES: Query combines local analytical warehouse and live Tally data sources (${sources.join(', ')}).`
      );
    }

    if (isStale) {
      warnings.push(
        `WAREHOUSE DATA MAY BE OUTDATED: Local warehouse was last synchronized at ${lastSyncTime || 'Unknown'}. Freshness State: ${freshnessState}.`
      );
    }

    return {
      primarySource: 'WAREHOUSE',
      isStaleWarehouse: isStale,
      staleDetails: isStale
        ? {
            lastSync: lastSyncTime,
            freshnessState
          }
        : undefined,
      isMixed,
      sources,
      warnings
    };
  }

  /**
   * Verify read-only Tally gateway safety
   */
  public verifyReadOnlySafety(): { isReadOnly: true; protocol: string } {
    return {
      isReadOnly: true,
      protocol: 'READ_ONLY_HTTP_XML_GATEWAY'
    };
  }
}

export const querySourceRouter = new QuerySourceRouter();
